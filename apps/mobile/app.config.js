import 'dotenv/config';

export default {
  name: 'Lude',
  slug: 'lude-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'lude',
  userInterfaceStyle: 'dark',
  splash: {
    backgroundColor: '#252525'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.lude.mobile'
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#252525'
    },
    package: 'com.lude.mobile'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    // API and services
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
    
    // Firebase configuration
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
    
    eas: {
      projectId: 'lude-mobile'
    }
  },
  plugins: [
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: "Consenti a Lude di accedere alla tua posizione.",
        locationAlwaysPermission: "Consenti a Lude di accedere alla tua posizione anche quando l'app è in background.",
        locationWhenInUsePermission: "Consenti a Lude di accedere alla tua posizione quando l'app è in uso."
      }
    ]
  ]
}; 