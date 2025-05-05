const express = require('express');
const router = express.Router();
const { protect, ownerOrAdmin } = require('../middleware/authMiddleware');
const socialController = require('../controllers/socialController');
const notificationController = require('../controllers/notificationController');

/**
 * @route   GET /api/social/feed
 * @desc    Ottiene il feed delle attività degli utenti seguiti
 * @access  Private
 */
router.get('/feed', protect, socialController.getFeed);

/**
 * @route   POST /api/social/tracks/:trackId/comments
 * @desc    Aggiunge un commento a una traccia
 * @access  Private
 */
router.post('/tracks/:trackId/comments', protect, socialController.addComment);

/**
 * @route   GET /api/social/tracks/:trackId/comments
 * @desc    Ottiene tutti i commenti di una traccia
 * @access  Private (dipende dalla privacy della traccia)
 */
router.get('/tracks/:trackId/comments', protect, socialController.getComments);

/**
 * @route   DELETE /api/social/tracks/:trackId/comments/:commentId
 * @desc    Rimuove un commento da una traccia
 * @access  Private (solo proprietario del commento o della traccia)
 */
router.delete('/tracks/:trackId/comments/:commentId', protect, socialController.removeComment);

/**
 * @route   POST /api/social/tracks/:trackId/reactions
 * @desc    Aggiunge una reazione a una traccia
 * @access  Private
 */
router.post('/tracks/:trackId/reactions', protect, socialController.addReaction);

/**
 * @route   DELETE /api/social/tracks/:trackId/reactions
 * @desc    Rimuove la reazione dell'utente da una traccia
 * @access  Private
 */
router.delete('/tracks/:trackId/reactions', protect, socialController.removeReaction);

/**
 * @route   GET /api/social/notifications
 * @desc    Ottiene le notifiche dell'utente
 * @access  Private
 */
router.get('/notifications', protect, notificationController.getUserNotifications);

/**
 * @route   PUT /api/social/notifications/:id/read
 * @desc    Segna una notifica come letta
 * @access  Private
 */
router.put('/notifications/:id/read', protect, notificationController.markNotificationAsRead);

/**
 * @route   PUT /api/social/notifications/read-all
 * @desc    Segna tutte le notifiche come lette
 * @access  Private
 */
router.put('/notifications/read-all', protect, notificationController.markAllNotificationsAsRead);

/**
 * @route   DELETE /api/social/notifications/:id
 * @desc    Elimina una notifica
 * @access  Private
 */
router.delete('/notifications/:id', protect, notificationController.deleteNotification);

module.exports = router; 