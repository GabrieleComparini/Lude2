const { asyncHandler } = require('../middleware/errorMiddleware');
const photoService = require('../services/photoService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');
const { validateCoordinates, normalizePagination, normalizeSorting } = require('../utils/validator');

/**
 * @desc    Carica una nuova foto
 * @route   POST /api/photos
 * @access  Private
 */
const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.cloudinaryResult) {
    return sendError(res, 400, 'Nessuna immagine caricata');
  }
  
  const { title, description, lat, lng, trackId, poiId, tags } = req.body;
  
  let coordinates = null;
  
  // Validazione coordinate se fornite
  if (lat && lng) {
    const validation = validateCoordinates(lat, lng);
    if (!validation.isValid) {
      return sendError(res, 400, 'Coordinate non valide', validation.errors);
    }
    coordinates = validation.coordinates;
  }
  
  const photo = await photoService.createPhoto({
    url: req.cloudinaryResult.secure_url,
    publicId: req.cloudinaryResult.public_id,
    title,
    description,
    coordinates,
    trackId,
    poiId,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
    user: req.user._id
  });
  
  return sendSuccess(res, 201, 'Foto caricata con successo', photo);
});

/**
 * @desc    Ottiene tutte le foto con vari filtri
 * @route   GET /api/photos
 * @access  Private
 */
const getPhotos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = normalizePagination(req.query);
  const { sortObj } = normalizeSorting(req.query, ['createdAt', 'title'], 'createdAt');
  
  const { type = 'all' } = req.query; // 'all', 'me', 'followed', 'public'
  
  const { photos, total } = await photoService.getPhotos(
    req.user._id,
    skip,
    limit,
    sortObj,
    type,
    req.query
  );
  
  const totalPages = Math.ceil(total / limit);
  
  return sendPaginated(
    res, 
    200, 
    'Foto recuperate con successo', 
    photos, 
    page, 
    totalPages, 
    total
  );
});

/**
 * @desc    Ottiene una foto specifica tramite ID
 * @route   GET /api/photos/:id
 * @access  Private
 */
const getPhotoById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const photo = await photoService.getPhotoById(id, req.user._id);
  
  if (!photo) {
    return sendError(res, 404, 'Foto non trovata');
  }
  
  return sendSuccess(res, 200, 'Foto recuperata con successo', photo);
});

/**
 * @desc    Aggiorna i dettagli di una foto
 * @route   PUT /api/photos/:id
 * @access  Private
 */
const updatePhoto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, isPublic, tags } = req.body;
  
  const updatedPhoto = await photoService.updatePhoto(id, req.user._id, {
    title,
    description,
    isPublic,
    tags
  });
  
  return sendSuccess(res, 200, 'Foto aggiornata con successo', updatedPhoto);
});

/**
 * @desc    Elimina una foto
 * @route   DELETE /api/photos/:id
 * @access  Private
 */
const deletePhoto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await photoService.deletePhoto(id, req.user._id);
  
  return sendSuccess(res, 200, 'Foto eliminata con successo');
});

/**
 * @desc    Ottiene foto nelle vicinanze
 * @route   GET /api/photos/nearby
 * @access  Private
 */
const getNearbyPhotos = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 5000 } = req.query; // maxDistance in metri (default 5km)
  
  const validation = validateCoordinates(lat, lng);
  if (!validation.isValid) {
    return sendError(res, 400, 'Coordinate non valide', validation.errors);
  }
  
  const { page, limit, skip } = normalizePagination(req.query);
  
  const { photos, total } = await photoService.getNearbyPhotos(
    validation.coordinates.lat,
    validation.coordinates.lng,
    Number(maxDistance),
    req.user._id,
    skip,
    limit
  );
  
  const totalPages = Math.ceil(total / limit);
  
  return sendPaginated(
    res, 
    200, 
    'Foto nelle vicinanze recuperate con successo', 
    photos, 
    page, 
    totalPages, 
    total
  );
});

/**
 * @desc    Collega una foto a un punto di interesse di una traccia
 * @route   POST /api/photos/:photoId/link/:trackId/:poiId
 * @access  Private
 */
const linkPhotoToPointOfInterest = asyncHandler(async (req, res) => {
  const { photoId, trackId, poiId } = req.params;
  
  const result = await photoService.linkPhotoToPointOfInterest(
    photoId,
    trackId,
    poiId,
    req.user._id
  );
  
  return sendSuccess(res, 200, 'Foto collegata al punto di interesse con successo', result);
});

/**
 * @desc    Scollega una foto da un punto di interesse
 * @route   DELETE /api/photos/:photoId/link/:trackId/:poiId
 * @access  Private
 */
const unlinkPhotoFromPointOfInterest = asyncHandler(async (req, res) => {
  const { photoId, trackId, poiId } = req.params;
  
  const result = await photoService.unlinkPhotoFromPointOfInterest(
    photoId,
    trackId,
    poiId,
    req.user._id
  );
  
  return sendSuccess(res, 200, 'Foto scollegata dal punto di interesse con successo', result);
});

module.exports = {
  uploadPhoto,
  getPhotos,
  getPhotoById,
  updatePhoto,
  deletePhoto,
  getNearbyPhotos,
  linkPhotoToPointOfInterest,
  unlinkPhotoFromPointOfInterest
}; 