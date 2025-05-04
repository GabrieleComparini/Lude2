const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

try {
  // Controlla se esiste la variabile d'ambiente con le credenziali
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Inizializzando Firebase Admin con credenziali da variabile d\'ambiente');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Cerca il file serviceAccountKey.json
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      path.join(__dirname, '../../serviceAccountKey.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      console.log(`Inizializzando Firebase Admin con file: ${serviceAccountPath}`);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
      });
    } else {
      // Fallback alle credenziali di default
      console.log(`File serviceAccountKey.json non trovato: ${serviceAccountPath}`);
      console.log('Tentativo di inizializzazione con credenziali di default...');
      admin.initializeApp();
      console.log('Firebase Admin inizializzato usando le credenziali di default');
    }
  }
} catch (error) {
  console.error('Errore nell\'inizializzazione di Firebase Admin:', error);
}

module.exports = admin; 