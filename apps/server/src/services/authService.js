const User = require('../models/User');
const admin = require('../config/firebaseAdmin');

/**
 * Sincronizza un utente Firebase con il database locale
 * @param {string} token - Token Firebase dell'utente
 * @returns {Promise<Object>} - Oggetto con utente e flag isNew
 */
const syncUserWithFirebase = async (token) => {
  // Verifica token Firebase
  const decodedToken = await admin.auth().verifyIdToken(token);
  
  // Controlla se utente esiste già nel database
  let user = await User.findOne({ firebaseUid: decodedToken.uid });
  
  if (user) {
    // Aggiorna ultimo accesso
    user.lastLogin = new Date();
    await user.save();
    
    return { user, isNew: false };
  }
  
  // Ottieni info utente da Firebase
  const firebaseUser = await admin.auth().getUser(decodedToken.uid);
  
  // Genera username unico
  let username = await generateUniqueUsername(firebaseUser.displayName);
  
  // Crea nuovo utente
  user = new User({
    firebaseUid: decodedToken.uid,
    email: firebaseUser.email,
    username,
    name: firebaseUser.displayName || 'Utente',
    profileImage: firebaseUser.photoURL || '',
    lastLogin: new Date()
  });
  
  await user.save();
  
  return { user, isNew: true };
};

/**
 * Crea un nuovo utente admin
 * @param {string} email - Email dell'admin
 * @param {string} password - Password dell'admin
 * @param {string} name - Nome dell'admin
 * @returns {Promise<Object>} - Nuovo utente admin
 */
const createAdminUser = async (email, password, name) => {
  // Controlla se l'email è già usata
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new Error('Email già in uso');
  }
  
  // Genera username unico
  let username = await generateUniqueUsername(name);
  
  // Crea utente in Firebase
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: name,
    emailVerified: true
  });
  
  // Assegna ruolo admin in Firebase (se si usa un sistema di ruoli in Firebase)
  // await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
  
  // Crea utente nel database con ruolo admin
  const newAdmin = await User.create({
    firebaseUid: userRecord.uid,
    email,
    username,
    name,
    role: 'admin',
    lastLogin: new Date()
  });
  
  return newAdmin;
};

/**
 * Genera un username unico
 * @param {string} baseName - Nome base da cui generare lo username
 * @returns {Promise<string>} - Username unico
 */
const generateUniqueUsername = async (baseName) => {
  if (!baseName) {
    baseName = `user_${Math.floor(Math.random() * 10000)}`;
  } else {
    baseName = baseName.toLowerCase().replace(/\s+/g, '_');
  }
  
  // Verifica unicità username
  const usernameExists = await User.findOne({ username: baseName });
  if (usernameExists) {
    return `${baseName}_${Math.floor(Math.random() * 10000)}`;
  }
  
  return baseName;
};

module.exports = {
  syncUserWithFirebase,
  createAdminUser
}; 