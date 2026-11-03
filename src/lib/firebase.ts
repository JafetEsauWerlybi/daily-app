import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

// SDK nativo: la config sale de google-services.json (app.json → android.googleServicesFile).
// La sesión de Auth y la caché de Firestore (en disco, con cola de escrituras pendientes)
// las gestiona el SDK nativo; no hace falta AsyncStorage ni initializeApp.
export const auth = getAuth();

// El SDK nativo no soporta useDeviceLanguage() (lanza al llamarla): el idioma de los
// correos de Firebase (recuperar contraseña) se fija a mano con el idioma del teléfono.
try {
  const deviceLanguage = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0];
  auth.languageCode = deviceLanguage || 'es';
} catch {
  auth.languageCode = 'es';
}

export const db = getFirestore();
