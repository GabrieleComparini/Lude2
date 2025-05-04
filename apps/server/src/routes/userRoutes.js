const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { asyncHandler, createError } = require('../middleware/errorMiddleware');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');
const User = require('../models/User');
const admin = require('../config/firebaseAdmin');

/**
 * @route   GET /api/users/profile
 * @desc    Ottiene il profilo dell'utente attuale
 * @access  Private
 */
router.get('/profile', protect, asyncHandler(async (req, res) => {
  // L'utente è già nella req grazie al middleware protect
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw createError('Utente non trovato', 404);
  }
  
  res.status(200).json({
    success: true,
    user
  });
}));

/**
 * @route   PUT /api/users/profile
 * @desc    Aggiorna il profilo utente
 * @access  Private
 */
router.put(
  '/profile',
  protect,
  uploadToCloudinary('profileImage', { folder: 'lude/profiles' }),
  asyncHandler(async (req, res) => {
    const { username, name, bio } = req.body;
    
    // Ottieni l'utente corrente
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw createError('Utente non trovato', 404);
    }
    
    // Verifica unicità username se viene cambiato
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ 
        username, 
        _id: { $ne: user._id } 
      });
      
      if (usernameExists) {
        throw createError('Username già in uso', 400);
      }
      
      user.username = username;
    }
    
    // Aggiorna campi base
    if (name) user.name = name;
    if (bio) user.bio = bio;
    
    // Aggiorna immagine profilo se caricata
    if (req.cloudinaryResult) {
      user.profileImage = req.cloudinaryResult.secure_url;
    }
    
    // Salva le modifiche
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profilo aggiornato con successo',
      user
    });
  })
);

/**
 * @route   PUT /api/users/preferences
 * @desc    Aggiorna le preferenze utente
 * @access  Private
 */
router.put('/preferences', protect, asyncHandler(async (req, res) => {
  const { unitSystem, privacySettings, notifications } = req.body;
  
  // Ottieni l'utente corrente
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw createError('Utente non trovato', 404);
  }
  
  // Aggiorna le preferenze
  if (unitSystem) user.preferences.unitSystem = unitSystem;
  
  if (privacySettings) {
    if (privacySettings.defaultTrackPrivacy) {
      user.preferences.privacySettings.defaultTrackPrivacy = privacySettings.defaultTrackPrivacy;
    }
    if (privacySettings.defaultPhotoPrivacy) {
      user.preferences.privacySettings.defaultPhotoPrivacy = privacySettings.defaultPhotoPrivacy;
    }
    if (privacySettings.showLocationInProfile !== undefined) {
      user.preferences.privacySettings.showLocationInProfile = privacySettings.showLocationInProfile;
    }
  }
  
  if (notifications) {
    if (notifications.newFollower !== undefined) {
      user.preferences.notifications.newFollower = notifications.newFollower;
    }
    if (notifications.newComment !== undefined) {
      user.preferences.notifications.newComment = notifications.newComment;
    }
    if (notifications.newLike !== undefined) {
      user.preferences.notifications.newLike = notifications.newLike;
    }
  }
  
  // Salva le modifiche
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Preferenze aggiornate con successo',
    preferences: user.preferences
  });
}));

/**
 * @route   GET /api/users/:username
 * @desc    Ottiene un profilo utente pubblico tramite username
 * @access  Public
 */
router.get('/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  const user = await User.findOne({ username });
  
  if (!user) {
    throw createError('Utente non trovato', 404);
  }
  
  // Restituisci solo i dati pubblici
  const publicProfile = user.toPublicJSON();
  
  res.status(200).json({
    success: true,
    user: publicProfile
  });
}));

/**
 * @route   GET /api/users/search
 * @desc    Cerca utenti per username o nome
 * @access  Private
 */
router.get('/search', protect, asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    throw createError('Parametro di ricerca mancante', 400);
  }
  
  // Cerca utenti che corrispondono alla query
  const users = await User.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { name: { $regex: query, $options: 'i' } }
    ]
  }).limit(20).select('username name profileImage');
  
  res.status(200).json({
    success: true,
    count: users.length,
    users
  });
}));

/**
 * @route   POST /api/users/:id/follow
 * @desc    Segui un utente
 * @access  Private
 */
router.post('/:id/follow', protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Verifica che l'utente non stia cercando di seguire se stesso
  if (id === req.user._id.toString()) {
    throw createError('Non puoi seguire te stesso', 400);
  }
  
  // Trova l'utente da seguire
  const userToFollow = await User.findById(id);
  
  if (!userToFollow) {
    throw createError('Utente non trovato', 404);
  }
  
  // Ottieni l'utente corrente
  const currentUser = await User.findById(req.user._id);
  
  // Verifica se l'utente è già seguito
  const isAlreadyFollowing = currentUser.connections.following.some(
    userId => userId.toString() === id
  );
  
  if (isAlreadyFollowing) {
    throw createError('Stai già seguendo questo utente', 400);
  }
  
  // Aggiungi alla lista following dell'utente corrente
  currentUser.connections.following.push(userToFollow._id);
  await currentUser.save();
  
  // Aggiungi alla lista followers dell'utente seguito
  userToFollow.connections.followers.push(currentUser._id);
  await userToFollow.save();
  
  res.status(200).json({
    success: true,
    message: `Hai iniziato a seguire ${userToFollow.username}`
  });
}));

/**
 * @route   DELETE /api/users/:id/follow
 * @desc    Smetti di seguire un utente
 * @access  Private
 */
router.delete('/:id/follow', protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Trova l'utente da non seguire più
  const userToUnfollow = await User.findById(id);
  
  if (!userToUnfollow) {
    throw createError('Utente non trovato', 404);
  }
  
  // Ottieni l'utente corrente
  const currentUser = await User.findById(req.user._id);
  
  // Rimuovi dalla lista following dell'utente corrente
  currentUser.connections.following = currentUser.connections.following.filter(
    userId => userId.toString() !== id
  );
  await currentUser.save();
  
  // Rimuovi dalla lista followers dell'utente seguito
  userToUnfollow.connections.followers = userToUnfollow.connections.followers.filter(
    userId => userId.toString() !== req.user._id.toString()
  );
  await userToUnfollow.save();
  
  res.status(200).json({
    success: true,
    message: `Hai smesso di seguire ${userToUnfollow.username}`
  });
}));

/**
 * @route   GET /api/users
 * @desc    Ottiene lista utenti (solo admin)
 * @access  Admin
 */
router.get('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = req.query;
  
  // Costruisci query di ricerca
  let query = {};
  
  if (search) {
    query = {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };
  }
  
  // Calcola skip per paginazione
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Esegui la query
  const users = await User.find(query)
    .sort({ [sort]: order === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  // Conta totale utenti che soddisfano la query
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    users
  });
}));

/**
 * @route   PUT /api/users/:id/role
 * @desc    Modifica ruolo utente (solo admin)
 * @access  Admin
 */
router.put('/:id/role', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!role || !['user', 'admin'].includes(role)) {
    throw createError('Ruolo non valido', 400);
  }
  
  const user = await User.findById(id);
  
  if (!user) {
    throw createError('Utente non trovato', 404);
  }
  
  // Non permettere di declassare se stesso
  if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
    throw createError('Non puoi declassare te stesso dal ruolo di admin', 403);
  }
  
  user.role = role;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: `Ruolo di ${user.username} aggiornato a ${role}`,
    user
  });
}));

/**
 * @route   POST /api/users
 * @desc    Crea un nuovo utente (richiede admin)
 * @access  Admin
 */
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { email, username, name, bio, role, preferences, password } = req.body;
  
  // Validazione
  if (!email || !username || !name) {
    throw createError('Email, username e nome sono obbligatori', 400);
  }

  if (!password) {
    throw createError('La password è obbligatoria', 400);
  }
  
  // Verifica se email e username sono già in uso
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw createError('Email già in uso', 400);
  }
  
  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    throw createError('Username già in uso', 400);
  }
  
  try {
    // Crea prima l'utente in Firebase
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: true
    });
    
    // Assegna ruolo in Firebase (opzionale)
    if (role === 'admin') {
      await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    }
    
    // Crea il nuovo utente nel database MongoDB con l'UID reale di Firebase
    const newUser = new User({
      email,
      username,
      name,
      bio: bio || '',
      role: role || 'user',
      firebaseUid: userRecord.uid, // Usa l'UID reale
      preferences,
      lastLogin: new Date()
    });
    
    await newUser.save();
    
    res.status(201).json({
      success: true,
      message: 'Utente creato con successo in Firebase e nel database',
      user: newUser
    });
  } catch (error) {
    // Gestisci errori specifici di Firebase
    throw createError(`Errore nella creazione utente in Firebase: ${error.message}`, 400);
  }
}));

module.exports = router; 