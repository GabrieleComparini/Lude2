const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const trackController = require('../controllers/trackController');

/**
 * @route   POST /api/tracks
 * @desc    Crea una nuova traccia
 * @access  Private
 */
router.post('/', protect, trackController.createTrack);

/**
 * @route   GET /api/tracks
 * @desc    Ottiene tutte le tracce (pubbliche o dell'utente)
 * @access  Private
 */
router.get('/', protect, trackController.getTracks);

/**
 * @route   GET /api/tracks/nearby
 * @desc    Ottiene tracce nelle vicinanze
 * @access  Private
 */
router.get('/nearby', protect, trackController.getNearbyTracks);

/**
 * @route   GET /api/tracks/:id
 * @desc    Ottiene una traccia specifica tramite ID
 * @access  Private
 */
router.get('/:id', protect, trackController.getTrackById);

/**
 * @route   PUT /api/tracks/:id
 * @desc    Aggiorna una traccia esistente
 * @access  Private
 */
router.put('/:id', protect, trackController.updateTrack);

/**
 * @route   DELETE /api/tracks/:id
 * @desc    Elimina una traccia
 * @access  Private
 */
router.delete('/:id', protect, trackController.deleteTrack);

/**
 * @route   POST /api/tracks/:id/poi
 * @desc    Aggiungi un punto di interesse alla traccia
 * @access  Private
 */
router.post('/:id/poi', protect, trackController.addPointOfInterest);

/**
 * @route   DELETE /api/tracks/:trackId/poi/:poiId
 * @desc    Rimuovi un punto di interesse dalla traccia
 * @access  Private
 */
router.delete('/:trackId/poi/:poiId', protect, trackController.removePointOfInterest);

module.exports = router; 