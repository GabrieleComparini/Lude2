const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Carica variabili d'ambiente
dotenv.config();

// Se l'app non è già inizializzata, inizializzala
if (!admin.apps.length) {
  // Percorso del service account key specificato nell'env file o fallback al path relativo
  const serviceAccountPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountPath = serviceAccountPathFromEnv 
    ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS) 
    : path.resolve(__dirname, '../../../serviceAccountKey.json');
  
  // Verifica se il file esiste
  if (fs.existsSync(serviceAccountPath)) {
    console.log(`Trovato file serviceAccountKey.json: ${serviceAccountPath}`);
    try {
      // Carica il file e inizializza Firebase Admin
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin inizializzato con successo usando serviceAccountKey.json');
    } catch (error) {
      console.error(`Errore durante l'inizializzazione di Firebase Admin: ${error.message}`);
      // Fallback al metodo precedente
      fallbackInitialization();
    }
  } else {
    console.warn(`File serviceAccountKey.json non trovato: ${serviceAccountPath}`);
    // Fallback al metodo precedente
    fallbackInitialization();
  }
}

// Funzione di fallback per l'inizializzazione
function fallbackInitialization() {
  console.warn('Tentativo di inizializzazione con credenziali di default...');
  try {
    // Tentativo di inizializzazione con credenziali di default
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log('Firebase Admin inizializzato usando le credenziali di default');
  } catch (error) {
    console.error(`Errore nell'inizializzazione con credenziali di default: ${error.message}`);
    initializeWithEnvVars();
  }
}

// Inizializzazione con variabili d'ambiente
function initializeWithEnvVars() {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
      console.log('Firebase Admin inizializzato usando variabili d\'ambiente');
    } catch (error) {
      console.error(`Errore nell'inizializzazione con variabili d'ambiente: ${error.message}`);
    }
  } else {
    console.error('Mancano le variabili d\'ambiente necessarie per l\'inizializzazione di Firebase Admin');
  }
}

module.exports = admin; 