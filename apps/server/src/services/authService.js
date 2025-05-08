const User = require('../models/User');
const admin = require('../config/firebaseAdmin');
const bcrypt = require('bcryptjs');

/**
 * Registra un nuovo utente
 * @param {string} email - Email dell'utente
 * @param {string} password - Password dell'utente
 * @param {string} displayName - Nome dell'utente
 * @returns {Promise<Object>} - Oggetto con utente creato
 */
const registerUser = async (email, password, displayName) => {
  // Controlla se l'email è già usata
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new Error('Email già in uso');
  }
  
  // Cripta password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Genera username unico
  const username = await generateUniqueUsername(displayName || email.split('@')[0]);
  
  // Crea nuovo utente
  const user = new User({
    email,
    password: hashedPassword,
    username,
    name: displayName || username,
    lastLogin: new Date()
  });
  
  await user.save();
  
  return { user };
};

/**
 * Login utente
 * @param {string} email - Email dell'utente
 * @param {string} password - Password dell'utente
 * @returns {Promise<Object>} - Oggetto con utente
 */
const loginUser = async (email, password) => {
  // Cerca utente per email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Credenziali non valide');
  }
  
  // Verifica password
  const isMatch = user.password 
    ? await bcrypt.compare(password, user.password)
    : false;
  
  if (!isMatch) {
    throw new Error('Credenziali non valide');
  }
  
  return { user };
};

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
  
  // Cripta password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Crea utente nel database con ruolo admin
  const newAdmin = await User.create({
    email,
    password: hashedPassword,
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
  registerUser,
  loginUser,
  syncUserWithFirebase,
  createAdminUser
}; 