const { asyncHandler } = require('../middleware/errorMiddleware');
const userService = require('../services/userService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');
const { normalizePagination, normalizeSorting } = require('../utils/validator');

/**
 * @desc    Ottiene il profilo dell'utente corrente
 * @route   GET /api/users/me
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'Profilo utente recuperato con successo', req.user);
});

/**
 * @desc    Aggiorna il profilo dell'utente corrente
 * @route   PUT /api/users/me
 * @access  Private
 */
const updateCurrentUser = asyncHandler(async (req, res) => {
  const { name, username, bio, preferences, location } = req.body;
  
  const updatedUser = await userService.updateUser(req.user._id, {
    name,
    username,
    bio,
    preferences,
    location
  });
  
  return sendSuccess(res, 200, 'Profilo aggiornato con successo', updatedUser);
});

/**
 * @desc    Aggiorna l'immagine del profilo dell'utente
 * @route   PUT /api/users/me/profile-image
 * @access  Private
 */
const updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.cloudinaryResult) {
    return sendError(res, 400, 'Nessuna immagine caricata');
  }
  
  const updatedUser = await userService.updateProfileImage(
    req.user._id, 
    req.cloudinaryResult.secure_url,
    req.cloudinaryResult.public_id
  );
  
  return sendSuccess(res, 200, 'Immagine profilo aggiornata con successo', updatedUser);
});

/**
 * @desc    Ottiene un utente specifico tramite username
 * @route   GET /api/users/:username
 * @access  Public
 */
const getUserByUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  const user = await userService.getUserByUsername(username);
  
  if (!user) {
    return sendError(res, 404, 'Utente non trovato');
  }
  
  return sendSuccess(res, 200, 'Utente trovato', user);
});

/**
 * @desc    Lista utenti con filtri e paginazione
 * @route   GET /api/users/list
 * @access  Admin
 */
const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = normalizePagination(req.query);
  const { sortObj } = normalizeSorting(req.query, ['createdAt', 'name', 'username', 'lastLogin'], 'createdAt');
  
  const { users, total } = await userService.listUsers(skip, limit, sortObj, req.query);
  
  const totalPages = Math.ceil(total / limit);
  
  return sendPaginated(res, 200, 'Lista utenti recuperata con successo', users, page, totalPages, total);
});

/**
 * @desc    Segui un utente
 * @route   POST /api/users/:id/follow
 * @access  Private
 */
const followUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (id === req.user._id.toString()) {
    return sendError(res, 400, 'Non puoi seguire te stesso');
  }
  
  const result = await userService.followUser(req.user._id, id);
  
  return sendSuccess(res, 200, result.message);
});

/**
 * @desc    Smetti di seguire un utente
 * @route   POST /api/users/:id/unfollow
 * @access  Private
 */
const unfollowUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await userService.unfollowUser(req.user._id, id);
  
  return sendSuccess(res, 200, result.message);
});

/**
 * @desc    Ottieni follower e following di un utente
 * @route   GET /api/users/:id/connections
 * @access  Private
 */
const getUserConnections = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type = 'all' } = req.query; // 'followers', 'following', 'all'
  
  const connections = await userService.getUserConnections(id, type);
  
  return sendSuccess(res, 200, 'Connessioni recuperate con successo', connections);
});

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  updateProfileImage,
  getUserByUsername,
  listUsers,
  followUser,
  unfollowUser,
  getUserConnections
}; 