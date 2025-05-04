const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const axios = require('axios');
require('dotenv').config();

// Configurazione Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// DEBUG: Mostra la configurazione (oscurando le chiavi)
console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : 'MANCANTE',
  appId: firebaseConfig.appId ? '***' : 'MANCANTE'
});

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configurazione Admin
const adminEmail = 'admin@example.com';
const adminPassword = 'Admin123!';
const adminName = 'Administrator';
const adminUsername = 'admin';

// Normalizza l'URL base rimuovendo eventuali slash finali
const normalizeBaseUrl = (url) => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// Metodo alternativo che non usa l'API /auth/create-admin ma crea direttamente nel database
const createAdminViaSyncAPI = async (user, token) => {
  const baseUrl = normalizeBaseUrl(process.env.VITE_API_URL) || 'http://localhost:5001';
  console.log(`Sincronizzazione utente con il backend: ${baseUrl}/api/auth/sync`);
  
  try {
    // Prima sincronizziamo l'utente
    const syncResponse = await axios.post(`${baseUrl}/api/auth/sync`, {
      token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Risposta sincronizzazione:', syncResponse.data);
    
    // Ora proviamo a modificare il ruolo direttamente usando l'endpoint users
    const userId = syncResponse.data.user._id;
    console.log(`Aggiornamento ruolo utente (ID: ${userId})`);
    
    const updateResponse = await axios.put(`${baseUrl}/api/users/${userId}/role`, {
      role: 'admin'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Risposta aggiornamento:', updateResponse.data);
    return updateResponse.data;
  } catch (error) {
    console.error('Errore durante la sincronizzazione/aggiornamento:', error);
    if (error.response) {
      console.error('Dettagli errore:', error.response.data);
    }
    throw error;
  }
};

async function createAdmin() {
  try {
    // 1. Crea l'utente in Firebase Auth
    console.log(`Creazione utente Firebase: ${adminEmail}`);
    
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('Nuovo utente Firebase creato');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('L\'utente esiste già, tentativo di login...');
        userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('Login a utente esistente riuscito');
      } else {
        console.error('Errore durante la creazione/login:', error.code, error.message);
        throw error;
      }
    }
    
    const user = userCredential.user;
    console.log(`Utente Firebase: ${user.uid}, email: ${user.email}`);
    
    // 2. Ottieni il token Firebase
    const token = await user.getIdToken();
    console.log('Token Firebase ottenuto');
    
    // 3. METODO A: Usa l'API create-admin
    try {
      const baseUrl = normalizeBaseUrl(process.env.VITE_API_URL) || 'http://localhost:5001';
      console.log(`Creazione utente admin nel database: ${baseUrl}/api/auth/create-admin`);
      
      const response = await axios.post(`${baseUrl}/api/auth/create-admin`, {
        email: adminEmail,
        name: adminName,
        username: adminUsername,
        role: 'admin'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Admin creato con successo (Metodo A):', response.data);
    } catch (error) {
      console.error('Errore con metodo A:', error.message);
      if (error.response) {
        console.error('Dettagli errore:', error.response.data);
      }
      
      // Se il metodo A fallisce, proviamo il metodo alternativo
      console.log('Tentativo con metodo alternativo...');
      await createAdminViaSyncAPI(user, token);
    }
    
    console.log(`
Credenziali admin:
Email: ${adminEmail}
Password: ${adminPassword}
Username: ${adminUsername}
`);
    
  } catch (error) {
    console.error('Errore durante la creazione dell\'admin:', error);
    if (error.response) {
      console.error('Dettagli errore:', error.response.data);
    }
  }
}

createAdmin(); 