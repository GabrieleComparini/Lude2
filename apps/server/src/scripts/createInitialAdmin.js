const mongoose = require('mongoose');
const User = require('../models/User');
const admin = require('../config/firebaseAdmin');
require('dotenv').config();

/**
 * Script per creare il primo utente admin nel database
 * Usare questo script dopo il primo deploy
 */
const createInitialAdmin = async () => {
  try {
    console.log('Connessione al database...');
    
    // Connetti al database
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connesso al database');
    
    // Verifica se esiste già un admin
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Un utente admin esiste già:', adminExists.email);
      process.exit(0);
    }
    
    console.log('Creazione utente admin in Firebase...');
    
    // Verifica che le variabili d'ambiente necessarie siano definite
    if (!process.env.INITIAL_ADMIN_EMAIL || !process.env.INITIAL_ADMIN_PASSWORD) {
      console.error('Errore: INITIAL_ADMIN_EMAIL e/o INITIAL_ADMIN_PASSWORD non definite nel file .env');
      process.exit(1);
    }
    
    // Crea utente in Firebase
    const userRecord = await admin.auth().createUser({
      email: process.env.INITIAL_ADMIN_EMAIL,
      password: process.env.INITIAL_ADMIN_PASSWORD,
      displayName: 'Admin',
      emailVerified: true
    });
    
    console.log('Utente Firebase creato con UID:', userRecord.uid);
    console.log('Creazione utente admin nel database locale...');
    
    // Crea utente nel database locale
    const newAdmin = await User.create({
      firebaseUid: userRecord.uid,
      email: process.env.INITIAL_ADMIN_EMAIL,
      username: 'admin',
      name: 'Administrator',
      role: 'admin',
      lastLogin: new Date()
    });
    
    console.log('Utente admin creato con successo nel database:');
    console.log(`- ID: ${newAdmin._id}`);
    console.log(`- Email: ${newAdmin.email}`);
    console.log(`- Nome: ${newAdmin.name}`);
    console.log(`- Ruolo: ${newAdmin.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Errore nella creazione admin:', error);
    process.exit(1);
  }
};

// Esegui la funzione
createInitialAdmin(); 