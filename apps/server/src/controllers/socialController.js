const { asyncHandler } = require('../middleware/errorMiddleware');
const trackService = require('../services/trackService');
const userService = require('../services/userService');
const notificationService = require('../services/notificationService');
const Track = require('../models/Track');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');
const { normalizePagination, normalizeSorting } = require('../utils/validator');
const mongoose = require('mongoose');

/**
 * @desc    Aggiunge un commento a una traccia
 * @route   POST /api/social/tracks/:trackId/comments
 * @access  Private
 */
const addComment = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  const { text } = req.body;
  
  if (!text || text.trim() === '') {
    return sendError(res, 400, 'Il testo del commento è obbligatorio');
  }
  
  const track = await Track.findById(trackId);
  if (!track) {
    return sendError(res, 404, 'Traccia non trovata');
  }
  
  // Verifica se l'utente può vedere questa traccia (se è privata)
  if (track.privacy === 'private' && track.userId.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'Non hai i permessi per commentare questa traccia');
  }
  
  if (track.privacy === 'followers') {
    const trackOwner = await User.findById(track.userId);
    const isFollowing = trackOwner.connections.followers.some(
      id => id.toString() === req.user._id.toString()
    );
    if (!isFollowing && track.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Non hai i permessi per commentare questa traccia');
    }
  }
  
  const newComment = {
    userId: req.user._id,
    text: text.trim(),
    createdAt: new Date()
  };
  
  track.social.comments.push(newComment);
  await track.save();
  
  // Crea una notifica per il proprietario della traccia
  if (track.userId.toString() !== req.user._id.toString()) {
    await notificationService.createNotification({
      recipient: track.userId,
      sender: req.user._id,
      type: 'comment',
      content: {
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        trackId: track._id
      }
    });
  }
  
  return sendSuccess(res, 201, 'Commento aggiunto con successo', newComment);
});

/**
 * @desc    Rimuove un commento da una traccia
 * @route   DELETE /api/social/tracks/:trackId/comments/:commentId
 * @access  Private
 */
const removeComment = asyncHandler(async (req, res) => {
  const { trackId, commentId } = req.params;
  
  const track = await Track.findById(trackId);
  if (!track) {
    return sendError(res, 404, 'Traccia non trovata');
  }
  
  const comment = track.social.comments.id(commentId);
  if (!comment) {
    return sendError(res, 404, 'Commento non trovato');
  }
  
  // Verifica che l'utente sia il proprietario del commento o della traccia
  if (comment.userId.toString() !== req.user._id.toString() && 
      track.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin') {
    return sendError(res, 403, 'Non hai i permessi per eliminare questo commento');
  }
  
  comment.remove();
  await track.save();
  
  return sendSuccess(res, 200, 'Commento rimosso con successo');
});

/**
 * @desc    Ottiene tutti i commenti di una traccia
 * @route   GET /api/social/tracks/:trackId/comments
 * @access  Private (a seconda della privacy della traccia)
 */
const getComments = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  const { page, limit, skip } = normalizePagination(req.query);
  
  const track = await Track.findById(trackId);
  if (!track) {
    return sendError(res, 404, 'Traccia non trovata');
  }
  
  // Verifica se l'utente può vedere questa traccia (se è privata)
  if (track.privacy === 'private' && track.userId.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'Non hai i permessi per vedere i commenti di questa traccia');
  }
  
  if (track.privacy === 'followers') {
    const trackOwner = await User.findById(track.userId);
    const isFollowing = trackOwner.connections.followers.some(
      id => id.toString() === req.user._id.toString()
    );
    if (!isFollowing && track.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Non hai i permessi per vedere i commenti di questa traccia');
    }
  }
  
  // Ottieni i commenti paginati
  const comments = track.social.comments
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(skip, skip + limit);
  
  const total = track.social.comments.length;
  const totalPages = Math.ceil(total / limit);
  
  // Popola le informazioni degli utenti per ogni commento
  const populatedComments = await Promise.all(comments.map(async (comment) => {
    const user = await User.findById(comment.userId).select('username name profileImage');
    return {
      ...comment.toObject(),
      user
    };
  }));
  
  return sendPaginated(
    res, 
    200, 
    'Commenti recuperati con successo', 
    populatedComments, 
    page, 
    totalPages, 
    total
  );
});

/**
 * @desc    Aggiunge una reazione a una traccia
 * @route   POST /api/social/tracks/:trackId/reactions
 * @access  Private
 */
const addReaction = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  const { type = 'like' } = req.body;
  
  const validReactionTypes = ['like', 'love', 'wow'];
  if (!validReactionTypes.includes(type)) {
    return sendError(res, 400, 'Tipo di reazione non valido');
  }
  
  const track = await Track.findById(trackId);
  if (!track) {
    return sendError(res, 404, 'Traccia non trovata');
  }
  
  // Verifica se l'utente può vedere questa traccia (se è privata)
  if (track.privacy === 'private' && track.userId.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'Non hai i permessi per reagire a questa traccia');
  }
  
  if (track.privacy === 'followers') {
    const trackOwner = await User.findById(track.userId);
    const isFollowing = trackOwner.connections.followers.some(
      id => id.toString() === req.user._id.toString()
    );
    if (!isFollowing && track.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Non hai i permessi per reagire a questa traccia');
    }
  }
  
  // Controlla se l'utente ha già reagito
  const existingReaction = track.social.likes.find(
    like => like.userId.toString() === req.user._id.toString()
  );
  
  if (existingReaction) {
    // Rimuovi la reazione esistente
    track.social.likes = track.social.likes.filter(
      like => like.userId.toString() !== req.user._id.toString()
    );
  }
  
  // Aggiungi la nuova reazione
  track.social.likes.push({
    userId: req.user._id,
    type,
    createdAt: new Date()
  });
  
  await track.save();
  
  // Crea una notifica per il proprietario della traccia
  if (track.userId.toString() !== req.user._id.toString()) {
    await notificationService.createNotification({
      recipient: track.userId,
      sender: req.user._id,
      type: 'reaction',
      content: {
        reactionType: type,
        trackId: track._id
      }
    });
  }
  
  return sendSuccess(res, 200, 'Reazione aggiunta con successo');
});

/**
 * @desc    Rimuove la reazione dell'utente da una traccia
 * @route   DELETE /api/social/tracks/:trackId/reactions
 * @access  Private
 */
const removeReaction = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  
  const track = await Track.findById(trackId);
  if (!track) {
    return sendError(res, 404, 'Traccia non trovata');
  }
  
  // Rimuovi la reazione se esiste
  const reactionExists = track.social.likes.some(
    like => like.userId.toString() === req.user._id.toString()
  );
  
  if (!reactionExists) {
    return sendError(res, 404, 'Nessuna reazione trovata');
  }
  
  track.social.likes = track.social.likes.filter(
    like => like.userId.toString() !== req.user._id.toString()
  );
  
  await track.save();
  
  return sendSuccess(res, 200, 'Reazione rimossa con successo');
});

/**
 * @desc    Ottiene il feed delle attività dagli utenti seguiti
 * @route   GET /api/social/feed
 * @access  Private
 */
const getFeed = asyncHandler(async (req, res) => {
  const { page, limit, skip } = normalizePagination(req.query);
  const { sortObj } = normalizeSorting(req.query, ['startTime', 'createdAt'], 'createdAt');
  
  // Ottieni gli ID degli utenti che l'utente segue
  const currentUser = await User.findById(req.user._id);
  const followingIds = currentUser.connections.following;
  
  if (followingIds.length === 0) {
    return sendPaginated(
      res,
      200,
      'Feed recuperato con successo (nessun utente seguito)',
      [],
      page,
      0,
      0
    );
  }
  
  // Trova le tracce pubbliche di questi utenti
  const { tracks, total } = await trackService.getFeedTracks(
    followingIds,
    req.user._id,
    skip,
    limit,
    sortObj
  );
  
  const totalPages = Math.ceil(total / limit);
  
  return sendPaginated(
    res, 
    200, 
    'Feed recuperato con successo', 
    tracks, 
    page, 
    totalPages, 
    total
  );
});

module.exports = {
  addComment,
  removeComment,
  getComments,
  addReaction,
  removeReaction,
  getFeed
}; 