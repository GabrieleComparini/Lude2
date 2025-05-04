/**
 * Script per impostare variabili d'ambiente e verificare la corretta configurazione
 * Eseguire con: node setup-env.js
 */
const fs = require('fs');
const path = require('path');

console.log('Verifica configurazione Firebase con Service Account Key...');

// Percorso del service account key relativo alla directory principale
const serviceAccountKeyPath = path.resolve('../serviceAccountKey.json');

// Controlla se il file esiste
if (fs.existsSync(serviceAccountKeyPath)) {
  console.log(`✅ File serviceAccountKey.json trovato in: ${serviceAccountKeyPath}`);
  
  try {
    // Leggi il file per verificare che sia un JSON valido
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));
    console.log('✅ Il file serviceAccountKey.json è un JSON valido');
    console.log(`   - project_id: ${serviceAccount.project_id}`);
    console.log(`   - client_email: ${serviceAccount.client_email}`);
  } catch (error) {
    console.error('❌ Errore nella lettura/parsing del file serviceAccountKey.json:', error.message);
  }
} else {
  console.error(`❌ File serviceAccountKey.json NON trovato in: ${serviceAccountKeyPath}`);
  console.log('Assicurarsi che il file sia presente nella directory principale (lude/)');
}

// Verifica se il file .env esiste
const envPath = path.resolve('./.env');
if (fs.existsSync(envPath)) {
  console.log(`✅ File .env trovato in: ${envPath}`);
  
  // Legge il file .env e verifica la presenza della variabile GOOGLE_APPLICATION_CREDENTIALS
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('GOOGLE_APPLICATION_CREDENTIALS')) {
    console.log('✅ Variabile GOOGLE_APPLICATION_CREDENTIALS trovata nel file .env');
  } else {
    console.log('❌ Variabile GOOGLE_APPLICATION_CREDENTIALS NON trovata nel file .env');
    console.log('Aggiungi la seguente riga al tuo file .env:');
    console.log('GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json');
  }
} else {
  console.log(`❌ File .env NON trovato in: ${envPath}`);
  console.log('È necessario creare un file .env nella directory server con il seguente contenuto:');
  console.log(`
# Server Configuration
PORT=5000

# MongoDB Configuration
DATABASE_URL=mongodb://localhost:27017/lude

# Firebase Admin Configuration via Service Account Key
GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# JWT Secret (per l'autenticazione basata su token, se utilizzata)
JWT_SECRET=your-strong-secret-key
JWT_EXPIRE=30d
  `);
}

console.log('\nISTRUZIONI PER AVVIARE IL SERVER:');
console.log('1. Assicurati che il file .env contenga GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json');
console.log('2. Avvia il server con: npm start');
console.log('3. Il server utilizzerà automaticamente le credenziali dal file serviceAccountKey.json'); 