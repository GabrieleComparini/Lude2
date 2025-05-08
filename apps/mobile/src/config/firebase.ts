import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, Auth, User as FirebaseUser } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getEnvVar = (key: string): string => {
  if (process.env[key]) {
    return process.env[key] as string;
  }
  try {
    const extraKey = key.replace('EXPO_PUBLIC_', '').toLowerCase();
    if (Constants?.expoConfig?.extra?.[extraKey]) {
      return Constants.expoConfig.extra[extraKey] as string;
    }
  } catch (error) {
    console.log(`Errore nell'accesso a ${key} da Constants:`, error);
  }
  console.log(`Usando valore fittizio per ${key}`);
  const defaults: { [key: string]: string } = {
    EXPO_PUBLIC_FIREBASE_API_KEY: 'AIzaSyDummyApiKeyForDevelopment123456',
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'lude-demo.firebaseapp.com',
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'lude-demo',
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'lude-demo.appspot.com',
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789012',
    EXPO_PUBLIC_FIREBASE_APP_ID: '1:123456789012:web:abcdef1234567890'
  };
  return defaults[key] || '';
};

const firebaseConfig = {
  apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

console.log('Firebase config:', JSON.stringify(firebaseConfig));

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

try {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('Firebase inizializzato con successo');
} catch (error: any) {
  console.error('Errore inizializzazione Firebase:', error);
  // In caso di errore, app e auth potrebbero rimanere undefined.
  // AuthContext dovrà gestire questa eventualità.
  // Se si desidera un mock, deve essere completo o 'as any'.
  // Per ora, li lascio potenzialmente undefined.
}

export { app, auth };
export default app; 