/**
 * Script per creare un utente admin nel database
 * 
 * Questo script crea un utente con ruolo admin direttamente nel database,
 * bypassando l'autenticazione Firebase. Usare solo per l'impostazione iniziale.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Configura la connessione al database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lude';

// Definizione dello schema utente (deve corrispondere al modello User reale)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  profileImage: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  firebaseUid: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Creazione del modello
const User = mongoose.model('User', userSchema);

// Dettagli dell'utente admin
const adminDetails = {
  username: 'admin',
  email: 'admin@example.com',
  name: 'Administrator',
  role: 'admin',
  isActive: true,
  // Genera un ID Firebase fittizio - sarà necessario aggiornarlo in seguito
  firebaseUid: `admin_${crypto.randomBytes(8).toString('hex')}`
};

// Funzione per creare l'admin
async function createAdmin() {
  try {
    // Connessione al database
    console.log(`Connessione al database: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connesso al database');
    
    // Controlla se esiste già un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Un utente admin esiste già:', existingAdmin);
      return;
    }
    
    // Crea nuovo admin
    console.log('Creazione utente admin...');
    const admin = new User(adminDetails);
    await admin.save();
    
    console.log('Admin creato con successo:');
    console.log({
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      firebaseUid: admin.firebaseUid
    });
    
    console.log('\nIMPORTANTE:');
    console.log('1. Questo utente non può ancora autenticarsi tramite Firebase.');
    console.log('2. Dovrai creare un utente in Firebase con la stessa email.');
    console.log('3. Quindi aggiorna il firebaseUid di questo utente con l\'UID reale di Firebase.');
    
  } catch (error) {
    console.error('Errore durante la creazione dell\'admin:', error);
  } finally {
    // Chiudi la connessione
    await mongoose.connection.close();
    console.log('Connessione al database chiusa');
  }
}

createAdmin(); 