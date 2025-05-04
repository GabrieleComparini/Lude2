const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const photoController = require('../controllers/photoController');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');

/**
 * @route   POST /api/photos
 * @desc    Carica una nuova foto
 * @access  Private
 */
router.post('/', protect, uploadToCloudinary('image', { folder: 'lude/photos' }), photoController.uploadPhoto);

/**
 * @route   GET /api/photos
 * @desc    Ottiene tutte le foto con vari filtri
 * @access  Private
 */
router.get('/', protect, photoController.getPhotos);

/**
 * @route   GET /api/photos/nearby
 * @desc    Ottiene foto nelle vicinanze
 * @access  Private
 */
router.get('/nearby', protect, photoController.getNearbyPhotos);

/**
 * @route   GET /api/photos/:id
 * @desc    Ottiene una foto specifica tramite ID
 * @access  Private
 */
router.get('/:id', protect, photoController.getPhotoById);

/**
 * @route   PUT /api/photos/:id
 * @desc    Aggiorna i dettagli di una foto
 * @access  Private
 */
router.put('/:id', protect, photoController.updatePhoto);

/**
 * @route   DELETE /api/photos/:id
 * @desc    Elimina una foto
 * @access  Private
 */
router.delete('/:id', protect, photoController.deletePhoto);

/**
 * @route   POST /api/photos/:photoId/link/:trackId/:poiId
 * @desc    Collega una foto a un punto di interesse di una traccia
 * @access  Private
 */
router.post('/:photoId/link/:trackId/:poiId', protect, photoController.linkPhotoToPointOfInterest);

/**
 * @route   DELETE /api/photos/:photoId/link/:trackId/:poiId
 * @desc    Scollega una foto da un punto di interesse
 * @access  Private
 */
router.delete('/:photoId/link/:trackId/:poiId', protect, photoController.unlinkPhotoFromPointOfInterest);

module.exports = router; 