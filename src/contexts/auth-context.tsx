import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateProfile,
  User,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  getGoogleCredential,
  signInWithGoogle,
  signOutFromGoogle,
  GoogleSignInResult,
} from '../lib/google-auth';
import { cancelTaskNotifications } from '../lib/notifications';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** true si la cuenta entra con correo + contraseña (puede cambiarla desde Cuenta). */
  hasPassword: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** "cancelled" si el usuario cerró el selector de cuentas sin elegir. */
  loginWithGoogle: () => Promise<GoogleSignInResult>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /**
   * Borra tareas, registros, notas y la cuenta. Reautentica antes: con la contraseña
   * actual, o con Google si la cuenta no tiene contraseña. Devuelve false si se canceló.
   */
  deleteAccount: (password?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // updateProfile muta el mismo objeto `user` y onAuthStateChanged no se dispara:
  // este contador fuerza a los consumidores a volver a leer displayName.
  const [, setProfileVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const result = await signInWithGoogle();
    const current = auth.currentUser;
    if (result === 'success' && current) {
      // Primera vez con Google: crear su documento de usuario (sin pisar uno existente).
      const ref = doc(db, 'users', current.uid);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) {
        await setDoc(ref, {
          name: current.displayName ?? '',
          email: current.email ?? '',
          createdAt: new Date(),
        });
      }
    }
    return result;
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(result.user, { displayName: name });

    // Guardar datos del usuario en Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      name,
      email,
      createdAt: new Date(),
    });
  };

  const logout = async () => {
    // Las notificaciones locales son de la cuenta que sale: no deben seguir sonando.
    await cancelTaskNotifications().catch(() => {});
    await signOutFromGoogle();
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateDisplayName = async (name: string) => {
    const current = auth.currentUser;
    if (!current) throw new Error('No hay sesión activa');
    await updateProfile(current, { displayName: name });
    await setDoc(doc(db, 'users', current.uid), { name }, { merge: true });
    setProfileVersion((v) => v + 1);
  };

  // Firebase exige una sesión reciente para cambiar la contraseña: se reautentica
  // con la contraseña actual antes.
  const changePassword = async (currentPassword: string, newPassword: string) => {
    const current = auth.currentUser;
    if (!current?.email) throw new Error('No hay sesión activa');
    const credential = EmailAuthProvider.credential(current.email, currentPassword);
    await reauthenticateWithCredential(current, credential);
    await updatePassword(current, newPassword);
  };

  const deleteAccount = async (password?: string) => {
    const current = auth.currentUser;
    if (!current) throw new Error('No hay sesión activa');

    // 1) Reautenticar primero: si falla no se borra nada.
    if (current.providerData.some((p) => p.providerId === 'password')) {
      if (!current.email || !password) throw new Error('Escribe tu contraseña');
      await reauthenticateWithCredential(
        current,
        EmailAuthProvider.credential(current.email, password),
      );
    } else {
      const credential = await getGoogleCredential();
      if (!credential) return false;
      await reauthenticateWithCredential(current, credential);
    }

    // 2) Borrar los datos del usuario (lotes de hasta 400 operaciones).
    const refs = [
      ...(await getDocs(query(collection(db, 'tasks'), where('userId', '==', current.uid)))).docs,
      ...(await getDocs(collection(db, 'users', current.uid, 'taskLogs'))).docs,
      ...(await getDocs(collection(db, 'users', current.uid, 'notes'))).docs,
    ].map((d) => d.ref);
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(db);
      refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
    await writeBatch(db).delete(doc(db, 'users', current.uid)).commit();

    // 3) Notificaciones, sesión de Google y la cuenta de Firebase.
    await cancelTaskNotifications().catch(() => {});
    await signOutFromGoogle();
    await deleteUser(current);
    return true;
  };

  const hasPassword =
    user?.providerData.some((p) => p.providerId === 'password') ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasPassword,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        updateDisplayName,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
