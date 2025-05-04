const User = require('../models/User');
const { deleteImage } = require('../config/cloudinary');
const mongoose = require('mongoose');

/**
 * Ottiene un utente tramite ID
 * @param {string} userId - ID dell'utente 
 * @returns {Promise<Object>} - Utente trovato
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  return user;
};

/**
 * Ottiene un utente tramite username
 * @param {string} username - Username dell'utente
 * @returns {Promise<Object>} - Utente trovato
 */
const getUserByUsername = async (username) => {
  const user = await User.findOne({ username }).select('-firebaseUid -role -connections.blocked');
  return user;
};

/**
 * Aggiorna i dati di un utente
 * @param {string} userId - ID dell'utente da aggiornare
 * @param {Object} updateData - Dati da aggiornare
 * @returns {Promise<Object>} - Utente aggiornato
 */
const updateUser = async (userId, updateData) => {
  // Se viene aggiornato lo username, verifica che non sia già presente
  if (updateData.username) {
    const usernameExists = await User.findOne({ 
      username: updateData.username,
      _id: { $ne: userId }
    });
    
    if (usernameExists) {
      throw new Error('Username già in uso');
    }
  }
  
  const updatedUser = await User.findByIdAndUpdate(
    userId, 
    { $set: updateData }, 
    { new: true, runValidators: true }
  );
  
  if (!updatedUser) {
    throw new Error('Utente non trovato');
  }
  
  return updatedUser;
};

/**
 * Aggiorna l'immagine del profilo di un utente
 * @param {string} userId - ID dell'utente
 * @param {string} imageUrl - URL della nuova immagine
 * @param {string} publicId - ID pubblico dell'immagine su Cloudinary
 * @returns {Promise<Object>} - Utente aggiornato
 */
const updateProfileImage = async (userId, imageUrl, publicId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('Utente non trovato');
  }
  
  // Se l'utente ha già un'immagine profilo, eliminala da Cloudinary
  if (user.profileImageId) {
    try {
      await deleteImage(user.profileImageId);
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'immagine precedente:', error);
    }
  }
  
  user.profileImage = imageUrl;
  user.profileImageId = publicId;
  
  await user.save();
  
  return user;
};

/**
 * Lista utenti con filtri e paginazione
 * @param {number} skip - Numero di elementi da saltare
 * @param {number} limit - Limite di elementi da restituire
 * @param {Object} sortObj - Oggetto per l'ordinamento
 * @param {Object} filters - Filtri da applicare
 * @returns {Promise<Object>} - { users, total }
 */
const listUsers = async (skip, limit, sortObj, filters) => {
  const query = {};
  
  // Applica i filtri
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { username: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  if (filters.role) {
    query.role = filters.role;
  }
  
  if (filters.createdAfter) {
    query.createdAt = { $gte: new Date(filters.createdAfter) };
  }
  
  if (filters.createdBefore) {
    if (!query.createdAt) query.createdAt = {};
    query.createdAt.$lte = new Date(filters.createdBefore);
  }
  
  // Esegui la query
  const users = await User.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .select('-firebaseUid');
  
  const total = await User.countDocuments(query);
  
  return { users, total };
};

/**
 * Segui un utente
 * @param {string} followerId - ID dell'utente che segue
 * @param {string} followedId - ID dell'utente da seguire
 * @returns {Promise<Object>} - Risultato dell'operazione
 */
const followUser = async (followerId, followedId) => {
  // Verifica che gli utenti esistano
  if (!mongoose.Types.ObjectId.isValid(followedId)) {
    throw new Error('ID utente non valido');
  }
  
  const followed = await User.findById(followedId);
  if (!followed) {
    throw new Error('Utente da seguire non trovato');
  }
  
  const follower = await User.findById(followerId);
  if (!follower) {
    throw new Error('Utente follower non trovato');
  }
  
  // Verifica se l'utente già segue
  if (follower.connections.following.includes(followedId)) {
    return { success: true, message: 'Stai già seguendo questo utente' };
  }
  
  // Verifica se l'utente è bloccato
  if (followed.connections.blocked.includes(followerId) || 
      follower.connections.blocked.includes(followedId)) {
    throw new Error('Non puoi seguire questo utente');
  }
  
  // Aggiorna le connessioni
  await User.findByIdAndUpdate(
    followerId,
    { $addToSet: { 'connections.following': followedId } }
  );
  
  await User.findByIdAndUpdate(
    followedId,
    { $addToSet: { 'connections.followers': followerId } }
  );
  
  return { success: true, message: 'Hai iniziato a seguire questo utente' };
};

/**
 * Smetti di seguire un utente
 * @param {string} followerId - ID dell'utente che smette di seguire
 * @param {string} followedId - ID dell'utente da non seguire più
 * @returns {Promise<Object>} - Risultato dell'operazione
 */
const unfollowUser = async (followerId, followedId) => {
  // Verifica che gli utenti esistano
  if (!mongoose.Types.ObjectId.isValid(followedId)) {
    throw new Error('ID utente non valido');
  }
  
  // Aggiorna le connessioni
  await User.findByIdAndUpdate(
    followerId,
    { $pull: { 'connections.following': followedId } }
  );
  
  await User.findByIdAndUpdate(
    followedId,
    { $pull: { 'connections.followers': followerId } }
  );
  
  return { success: true, message: 'Hai smesso di seguire questo utente' };
};

/**
 * Ottieni le connessioni di un utente (followers e following)
 * @param {string} userId - ID dell'utente
 * @param {string} type - Tipo di connessioni ('followers', 'following', 'all')
 * @returns {Promise<Object>} - Connessioni dell'utente
 */
const getUserConnections = async (userId, type) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('Utente non trovato');
  }
  
  let result = {};
  
  if (type === 'all' || type === 'followers') {
    const followers = await User.find({ 
      _id: { $in: user.connections.followers } 
    }).select('_id username name profileImage');
    
    result.followers = followers;
  }
  
  if (type === 'all' || type === 'following') {
    const following = await User.find({ 
      _id: { $in: user.connections.following } 
    }).select('_id username name profileImage');
    
    result.following = following;
  }
  
  return result;
};

module.exports = {
  getUserById,
  getUserByUsername,
  updateUser,
  updateProfileImage,
  listUsers,
  followUser,
  unfollowUser,
  getUserConnections
}; 