import { getAuth, useDeviceLanguage } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

// SDK nativo: la config sale de google-services.json (app.json → android.googleServicesFile).
// La sesión de Auth y la caché de Firestore (en disco, con cola de escrituras pendientes)
// las gestiona el SDK nativo; no hace falta AsyncStorage ni initializeApp.
export const auth = getAuth();
useDeviceLanguage(auth);

export const db = getFirestore();
