const { asyncHandler } = require('../middleware/errorMiddleware');
const trackService = require('../services/trackService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');
const { validateCoordinates, normalizePagination, normalizeSorting } = require('../utils/validator');

/**
 * @desc    Crea una nuova traccia
 * @route   POST /api/tracks
 * @access  Private
 */
const createTrack = asyncHandler(async (req, res) => {
  const { title, description, coordinates, isPublic, tags } = req.body;
  
  if (!title || !coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return sendError(res, 400, 'Titolo e coordinate valide sono richiesti');
  }
  
  // Validazione delle coordinate
  const invalidCoordinates = coordinates.some(coord => {
    const validation = validateCoordinates(coord.lat, coord.lng);
    return !validation.isValid;
  });
  
  if (invalidCoordinates) {
    return sendError(res, 400, 'Coordinate non valide');
  }
  
  const track = await trackService.createTrack({
    title,
    description,
    coordinates,
    isPublic: isPublic === undefined ? true : isPublic,
    tags: tags || [],
    user: req.user._id
  });
  
  return sendSuccess(res, 201, 'Traccia creata con successo', track);
});

/**
 * @desc    Ottiene tutte le tracce (pubbliche o dell'utente)
 * @route   GET /api/tracks
 * @access  Private
 */
const getTracks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = normalizePagination(req.query);
  const { sortObj } = normalizeSorting(req.query, ['createdAt', 'title', 'distance'], 'createdAt');
  
  const { type = 'all' } = req.query; // 'all', 'me', 'followed', 'public'
  
  const { tracks, total } = await trackService.getTracks(
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
    'Tracce recuperate con successo', 
    tracks, 
    page, 
    totalPages, 
    total
  );
});

/**
 * @desc    Ottiene una traccia specifica tramite ID
 * @route   GET /api/tracks/:id
 * @access  Private
 */
const getTrackById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const track = await trackService.getTrackById(id, req.user._id);
  
  if (!track) {
    return sendError(res, 404, 'Traccia non trovata');
  }
  
  return sendSuccess(res, 200, 'Traccia recuperata con successo', track);
});

/**
 * @desc    Aggiorna una traccia esistente
 * @route   PUT /api/tracks/:id
 * @access  Private
 */
const updateTrack = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, isPublic, tags } = req.body;
  
  const updatedTrack = await trackService.updateTrack(id, req.user._id, {
    title,
    description,
    isPublic,
    tags
  });
  
  return sendSuccess(res, 200, 'Traccia aggiornata con successo', updatedTrack);
});

/**
 * @desc    Elimina una traccia
 * @route   DELETE /api/tracks/:id
 * @access  Private
 */
const deleteTrack = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await trackService.deleteTrack(id, req.user._id);
  
  return sendSuccess(res, 200, 'Traccia eliminata con successo');
});

/**
 * @desc    Ottiene tracce nelle vicinanze
 * @route   GET /api/tracks/nearby
 * @access  Private
 */
const getNearbyTracks = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 10000 } = req.query; // maxDistance in metri (default 10km)
  
  const validation = validateCoordinates(lat, lng);
  if (!validation.isValid) {
    return sendError(res, 400, 'Coordinate non valide', validation.errors);
  }
  
  const { page, limit, skip } = normalizePagination(req.query);
  
  const { tracks, total } = await trackService.getNearbyTracks(
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
    'Tracce nelle vicinanze recuperate con successo', 
    tracks, 
    page, 
    totalPages, 
    total
  );
});

/**
 * @desc    Aggiungi un punto di interesse alla traccia
 * @route   POST /api/tracks/:id/poi
 * @access  Private
 */
const addPointOfInterest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, lat, lng, type } = req.body;
  
  if (!title || !lat || !lng) {
    return sendError(res, 400, 'Titolo e coordinate sono richiesti');
  }
  
  const validation = validateCoordinates(lat, lng);
  if (!validation.isValid) {
    return sendError(res, 400, 'Coordinate non valide', validation.errors);
  }
  
  const updatedTrack = await trackService.addPointOfInterest(
    id,
    req.user._id,
    {
      title,
      description,
      coordinates: validation.coordinates,
      type: type || 'generic'
    }
  );
  
  return sendSuccess(res, 200, 'Punto di interesse aggiunto con successo', updatedTrack);
});

/**
 * @desc    Rimuovi un punto di interesse dalla traccia
 * @route   DELETE /api/tracks/:trackId/poi/:poiId
 * @access  Private
 */
const removePointOfInterest = asyncHandler(async (req, res) => {
  const { trackId, poiId } = req.params;
  
  const updatedTrack = await trackService.removePointOfInterest(
    trackId,
    poiId,
    req.user._id
  );
  
  return sendSuccess(res, 200, 'Punto di interesse rimosso con successo', updatedTrack);
});

module.exports = {
  createTrack,
  getTracks,
  getTrackById,
  updateTrack,
  deleteTrack,
  getNearbyTracks,
  addPointOfInterest,
  removePointOfInterest
}; 