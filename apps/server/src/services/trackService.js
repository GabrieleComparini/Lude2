const Track = require('../models/Track');
const mongoose = require('mongoose');

/**
 * Crea una nuova traccia
 * @param {Object} trackData - Dati della traccia da creare
 * @returns {Promise<Object>} - Traccia creata
 */
const createTrack = async (trackData) => {
  const track = new Track(trackData);
  
  // Calcola la distanza totale della traccia
  track.distance = calculateTrackDistance(trackData.coordinates);
  
  await track.save();
  return track;
};

/**
 * Ottiene le tracce con filtri
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @param {number} skip - Elementi da saltare (paginazione)
 * @param {number} limit - Numero di elementi da restituire
 * @param {Object} sortObj - Oggetto per l'ordinamento
 * @param {string} type - Tipo di tracce da restituire ('all', 'me', 'followed', 'public')
 * @param {Object} filters - Filtri aggiuntivi
 * @returns {Promise<Object>} - { tracks, total }
 */
const getTracks = async (userId, skip, limit, sortObj, type, filters) => {
  const query = {};
  
  // Applica filtri in base al tipo
  if (type === 'me') {
    // Solo le tracce dell'utente
    query.user = userId;
  } else if (type === 'followed') {
    // Tracce degli utenti seguiti (richiede un'aggregazione con utenti)
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user || !user.connections.following.length) {
      return { tracks: [], total: 0 };
    }
    
    query.user = { $in: user.connections.following };
    query.isPublic = true;
  } else if (type === 'public') {
    // Solo tracce pubbliche
    query.isPublic = true;
  } else {
    // Tutte le tracce a cui l'utente ha accesso (pubbliche o proprie)
    query.$or = [
      { isPublic: true },
      { user: userId }
    ];
  }
  
  // Filtri aggiuntivi
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { tags: { $in: [filters.search] } }
    ];
  }
  
  if (filters.tags) {
    const tagList = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
    query.tags = { $in: tagList };
  }
  
  if (filters.createdAfter) {
    query.createdAt = { $gte: new Date(filters.createdAfter) };
  }
  
  if (filters.createdBefore) {
    if (!query.createdAt) query.createdAt = {};
    query.createdAt.$lte = new Date(filters.createdBefore);
  }
  
  // Esegui query e popolamento
  const tracks = await Track.find(query)
    .populate('user', 'username name profileImage')
    .sort(sortObj)
    .skip(skip)
    .limit(limit);
  
  const total = await Track.countDocuments(query);
  
  return { tracks, total };
};

/**
 * Ottiene una traccia tramite ID
 * @param {string} trackId - ID della traccia
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @returns {Promise<Object>} - Traccia trovata
 */
const getTrackById = async (trackId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(trackId)) {
    return null;
  }
  
  const track = await Track.findById(trackId)
    .populate('user', 'username name profileImage')
    .populate('pointsOfInterest.photos', 'url');
  
  // Verifica accesso
  if (!track) {
    return null;
  }
  
  if (!track.isPublic && track.user._id.toString() !== userId) {
    return null; // L'utente non ha accesso a questa traccia
  }
  
  return track;
};

/**
 * Aggiorna una traccia esistente
 * @param {string} trackId - ID della traccia
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @param {Object} updateData - Dati da aggiornare
 * @returns {Promise<Object>} - Traccia aggiornata
 */
const updateTrack = async (trackId, userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(trackId)) {
    throw new Error('ID traccia non valido');
  }
  
  // Verifica che la traccia appartenga all'utente
  const track = await Track.findOne({ _id: trackId, user: userId });
  
  if (!track) {
    throw new Error('Traccia non trovata o non autorizzato');
  }
  
  // Aggiorna solo i campi consentiti
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      track[key] = updateData[key];
    }
  });
  
  await track.save();
  
  return track;
};

/**
 * Elimina una traccia
 * @param {string} trackId - ID della traccia
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @returns {Promise<void>}
 */
const deleteTrack = async (trackId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(trackId)) {
    throw new Error('ID traccia non valido');
  }
  
  const track = await Track.findOne({ _id: trackId, user: userId });
  
  if (!track) {
    throw new Error('Traccia non trovata o non autorizzato');
  }
  
  // Elimina anche le foto associate ai punti di interesse
  if (track.pointsOfInterest && track.pointsOfInterest.length > 0) {
    const Photo = require('../models/Photo');
    const photoIds = [];
    
    track.pointsOfInterest.forEach(poi => {
      if (poi.photos && poi.photos.length > 0) {
        photoIds.push(...poi.photos);
      }
    });
    
    if (photoIds.length > 0) {
      await Photo.deleteMany({ _id: { $in: photoIds } });
    }
  }
  
  await Track.deleteOne({ _id: trackId });
};

/**
 * Ottiene tracce nelle vicinanze di un punto
 * @param {number} lat - Latitudine
 * @param {number} lng - Longitudine
 * @param {number} maxDistance - Distanza massima in metri
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @param {number} skip - Elementi da saltare (paginazione)
 * @param {number} limit - Numero di elementi da restituire
 * @returns {Promise<Object>} - { tracks, total }
 */
const getNearbyTracks = async (lat, lng, maxDistance, userId, skip, limit) => {
  // Deve essere implementato un indice geospaziale sulla prima coordinata delle tracce
  const query = {
    'coordinates.0': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat] // GeoJSON utilizza [lng, lat]
        },
        $maxDistance: maxDistance
      }
    },
    $or: [
      { isPublic: true },
      { user: userId }
    ]
  };
  
  const tracks = await Track.find(query)
    .populate('user', 'username name profileImage')
    .skip(skip)
    .limit(limit);
  
  const total = await Track.countDocuments(query);
  
  return { tracks, total };
};

/**
 * Aggiunge un punto di interesse a una traccia
 * @param {string} trackId - ID della traccia
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @param {Object} poiData - Dati del punto di interesse
 * @returns {Promise<Object>} - Traccia aggiornata
 */
const addPointOfInterest = async (trackId, userId, poiData) => {
  if (!mongoose.Types.ObjectId.isValid(trackId)) {
    throw new Error('ID traccia non valido');
  }
  
  const track = await Track.findOne({ _id: trackId, user: userId });
  
  if (!track) {
    throw new Error('Traccia non trovata o non autorizzato');
  }
  
  const poi = {
    title: poiData.title,
    description: poiData.description || '',
    coordinates: {
      lat: poiData.coordinates.lat,
      lng: poiData.coordinates.lng
    },
    type: poiData.type || 'generic',
    photos: []
  };
  
  track.pointsOfInterest.push(poi);
  await track.save();
  
  return track;
};

/**
 * Rimuove un punto di interesse da una traccia
 * @param {string} trackId - ID della traccia
 * @param {string} poiId - ID del punto di interesse
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @returns {Promise<Object>} - Traccia aggiornata
 */
const removePointOfInterest = async (trackId, poiId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(trackId)) {
    throw new Error('ID traccia non valido');
  }
  
  const track = await Track.findOne({ _id: trackId, user: userId });
  
  if (!track) {
    throw new Error('Traccia non trovata o non autorizzato');
  }
  
  // Cerca l'indice del punto di interesse
  const poiIndex = track.pointsOfInterest.findIndex(
    poi => poi._id.toString() === poiId
  );
  
  if (poiIndex === -1) {
    throw new Error('Punto di interesse non trovato');
  }
  
  // Elimina anche le foto associate al punto di interesse
  if (track.pointsOfInterest[poiIndex].photos && track.pointsOfInterest[poiIndex].photos.length > 0) {
    const Photo = require('../models/Photo');
    await Photo.deleteMany({ _id: { $in: track.pointsOfInterest[poiIndex].photos } });
  }
  
  // Rimuovi il punto di interesse
  track.pointsOfInterest.splice(poiIndex, 1);
  await track.save();
  
  return track;
};

/**
 * Calcola la distanza totale di una traccia
 * @param {Array} coordinates - Array di coordinate { lat, lng }
 * @returns {number} - Distanza in metri
 */
const calculateTrackDistance = (coordinates) => {
  if (!coordinates || coordinates.length < 2) {
    return 0;
  }
  
  let totalDistance = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(
      coordinates[i].lat,
      coordinates[i].lng,
      coordinates[i + 1].lat,
      coordinates[i + 1].lng
    );
  }
  
  return Math.round(totalDistance);
};

/**
 * Calcola la distanza tra due punti usando la formula di Haversine
 * @param {number} lat1 - Latitudine punto 1
 * @param {number} lng1 - Longitudine punto 1
 * @param {number} lat2 - Latitudine punto 2
 * @param {number} lng2 - Longitudine punto 2
 * @returns {number} - Distanza in metri
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Raggio della Terra in metri
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distanza in metri
};

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