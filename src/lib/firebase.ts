import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDHFdyzKpJcO9pVfTY9iXIhYZZJrXokWos',
  authDomain: 'daily-app-80801.firebaseapp.com',
  projectId: 'daily-app-80801',
  storageBucket: 'daily-app-80801.firebasestorage.app',
  messagingSenderId: '345898052899',
  appId: '1:345898052899:web:ef1e755b59b977e8efb096',
  measurementId: 'G-T19EM60XHM',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
auth.useDeviceLanguage();

export const db = getFirestore(app);

export default app;
