const Photo = require('../models/Photo');
const Track = require('../models/Track');
const { deleteImage } = require('../config/cloudinary');
const mongoose = require('mongoose');

/**
 * Crea una nuova foto
 * @param {Object} photoData - Dati della foto
 * @returns {Promise<Object>} - Foto creata
 */
const createPhoto = async (photoData) => {
  const photo = new Photo({
    url: photoData.url,
    publicId: photoData.publicId,
    title: photoData.title || 'Foto senza titolo',
    description: photoData.description || '',
    coordinates: photoData.coordinates,
    isPublic: photoData.isPublic === undefined ? true : photoData.isPublic,
    tags: photoData.tags || [],
    user: photoData.user
  });
  
  // Se traccia e punto di interesse sono specificati, collega la foto
  if (photoData.trackId && photoData.poiId) {
    try {
      await linkPhotoToPointOfInterest(
        null, // ID foto non ancora disponibile
        photoData.trackId,
        photoData.poiId,
        photoData.user,
        photo // Passa l'oggetto foto direttamente
      );
    } catch (error) {
      console.error('Errore nel collegamento automatico della foto al POI:', error);
    }
  }
  
  await photo.save();
  return photo;
};

/**
 * Ottiene le foto con filtri
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @param {number} skip - Elementi da saltare (paginazione)
 * @param {number} limit - Numero di elementi da restituire
 * @param {Object} sortObj - Oggetto per l'ordinamento
 * @param {string} type - Tipo di foto da restituire ('all', 'me', 'followed', 'public')
 * @param {Object} filters - Filtri aggiuntivi
 * @returns {Promise<Object>} - { photos, total }
 */
const getPhotos = async (userId, skip, limit, sortObj, type, filters) => {
  const query = {};
  
  // Applica filtri in base al tipo
  if (type === 'me') {
    // Solo le foto dell'utente
    query.user = userId;
  } else if (type === 'followed') {
    // Foto degli utenti seguiti
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user || !user.connections.following.length) {
      return { photos: [], total: 0 };
    }
    
    query.user = { $in: user.connections.following };
    query.isPublic = true;
  } else if (type === 'public') {
    // Solo foto pubbliche
    query.isPublic = true;
  } else {
    // Tutte le foto a cui l'utente ha accesso (pubbliche o proprie)
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
  const photos = await Photo.find(query)
    .populate('user', 'username name profileImage')
    .sort(sortObj)
    .skip(skip)
    .limit(limit);
  
  const total = await Photo.countDocuments(query);
  
  return { photos, total };
};

/**
 * Ottiene una foto tramite ID
 * @param {string} photoId - ID della foto
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @returns {Promise<Object>} - Foto trovata
 */
const getPhotoById = async (photoId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(photoId)) {
    return null;
  }
  
  const photo = await Photo.findById(photoId)
    .populate('user', 'username name profileImage');
  
  // Verifica accesso
  if (!photo) {
    return null;
  }
  
  if (!photo.isPublic && photo.user._id.toString() !== userId) {
    return null; // L'utente non ha accesso a questa foto
  }
  
  return photo;
};

/**
 * Aggiorna una foto esistente
 * @param {string} photoId - ID della foto
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @param {Object} updateData - Dati da aggiornare
 * @returns {Promise<Object>} - Foto aggiornata
 */
const updatePhoto = async (photoId, userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(photoId)) {
    throw new Error('ID foto non valido');
  }
  
  // Verifica che la foto appartenga all'utente
  const photo = await Photo.findOne({ _id: photoId, user: userId });
  
  if (!photo) {
    throw new Error('Foto non trovata o non autorizzato');
  }
  
  // Aggiorna solo i campi consentiti
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      photo[key] = updateData[key];
    }
  });
  
  await photo.save();
  
  return photo;
};

/**
 * Elimina una foto
 * @param {string} photoId - ID della foto
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @returns {Promise<void>}
 */
const deletePhoto = async (photoId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(photoId)) {
    throw new Error('ID foto non valido');
  }
  
  const photo = await Photo.findOne({ _id: photoId, user: userId });
  
  if (!photo) {
    throw new Error('Foto non trovata o non autorizzato');
  }
  
  // Elimina da Cloudinary
  if (photo.publicId) {
    try {
      await deleteImage(photo.publicId);
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'immagine da Cloudinary:', error);
    }
  }
  
  // Scollega da eventuali tracce/POI
  if (photo.linkedTo && photo.linkedTo.trackId && photo.linkedTo.poiId) {
    try {
      await unlinkPhotoFromPointOfInterest(
        photoId,
        photo.linkedTo.trackId,
        photo.linkedTo.poiId,
        userId
      );
    } catch (error) {
      console.error('Errore nello scollegamento della foto dal POI:', error);
    }
  }
  
  await Photo.deleteOne({ _id: photoId });
};

/**
 * Ottiene foto nelle vicinanze di un punto
 * @param {number} lat - Latitudine
 * @param {number} lng - Longitudine
 * @param {number} maxDistance - Distanza massima in metri
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @param {number} skip - Elementi da saltare (paginazione)
 * @param {number} limit - Numero di elementi da restituire
 * @returns {Promise<Object>} - { photos, total }
 */
const getNearbyPhotos = async (lat, lng, maxDistance, userId, skip, limit) => {
  // Richiede un indice 2dsphere sulle coordinate
  const query = {
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat] // GeoJSON usa [lng, lat]
        },
        $maxDistance: maxDistance
      }
    },
    $or: [
      { isPublic: true },
      { user: userId }
    ]
  };
  
  const photos = await Photo.find(query)
    .populate('user', 'username name profileImage')
    .skip(skip)
    .limit(limit);
  
  const total = await Photo.countDocuments(query);
  
  return { photos, total };
};

/**
 * Collega una foto a un punto di interesse di una traccia
 * @param {string} photoId - ID della foto
 * @param {string} trackId - ID della traccia
 * @param {string} poiId - ID del punto di interesse
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @param {Object} photoObj - Oggetto foto (opzionale, se la foto non è ancora salvata)
 * @returns {Promise<Object>} - { photo, track }
 */
const linkPhotoToPointOfInterest = async (photoId, trackId, poiId, userId, photoObj = null) => {
  if (!mongoose.Types.ObjectId.isValid(trackId)) {
    throw new Error('ID traccia non valido');
  }
  
  // Verifica che la traccia esista e appartenga all'utente
  const track = await Track.findOne({ _id: trackId, user: userId });
  
  if (!track) {
    throw new Error('Traccia non trovata o non autorizzato');
  }
  
  // Trova il punto di interesse nella traccia
  const poiIndex = track.pointsOfInterest.findIndex(
    poi => poi._id.toString() === poiId
  );
  
  if (poiIndex === -1) {
    throw new Error('Punto di interesse non trovato');
  }
  
  let photo;
  
  // Se è stata passata una foto già creata ma non ancora salvata
  if (!photoId && photoObj) {
    photo = photoObj;
    photo.linkedTo = {
      trackId,
      poiId
    };
  } else {
    // Altrimenti, trova la foto per ID
    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      throw new Error('ID foto non valido');
    }
    
    photo = await Photo.findOne({ _id: photoId, user: userId });
    
    if (!photo) {
      throw new Error('Foto non trovata o non autorizzato');
    }
    
    // Aggiorna il riferimento nella foto
    photo.linkedTo = {
      trackId,
      poiId
    };
    
    await photo.save();
  }
  
  // Aggiungi la foto al punto di interesse nella traccia
  track.pointsOfInterest[poiIndex].photos.push(photo._id);
  await track.save();
  
  return { photo, track };
};

/**
 * Scollega una foto da un punto di interesse
 * @param {string} photoId - ID della foto
 * @param {string} trackId - ID della traccia
 * @param {string} poiId - ID del punto di interesse
 * @param {string} userId - ID dell'utente che fa la richiesta
 * @returns {Promise<Object>} - { photo, track }
 */
const unlinkPhotoFromPointOfInterest = async (photoId, trackId, poiId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(photoId) || 
      !mongoose.Types.ObjectId.isValid(trackId)) {
    throw new Error('ID non validi');
  }
  
  // Verifica che la traccia esista e appartenga all'utente
  const track = await Track.findOne({ _id: trackId, user: userId });
  
  if (!track) {
    throw new Error('Traccia non trovata o non autorizzato');
  }
  
  // Trova il punto di interesse nella traccia
  const poiIndex = track.pointsOfInterest.findIndex(
    poi => poi._id.toString() === poiId
  );
  
  if (poiIndex === -1) {
    throw new Error('Punto di interesse non trovato');
  }
  
  // Verifica che la foto sia collegata al punto di interesse
  const photoIndex = track.pointsOfInterest[poiIndex].photos.findIndex(
    id => id.toString() === photoId
  );
  
  if (photoIndex === -1) {
    throw new Error('Foto non collegata a questo punto di interesse');
  }
  
  // Rimuovi la foto dal punto di interesse
  track.pointsOfInterest[poiIndex].photos.splice(photoIndex, 1);
  await track.save();
  
  // Aggiorna la foto
  const photo = await Photo.findById(photoId);
  
  if (photo && photo.linkedTo && 
      photo.linkedTo.trackId.toString() === trackId &&
      photo.linkedTo.poiId.toString() === poiId) {
    photo.linkedTo = null;
    await photo.save();
  }
  
  return { photo, track };
};

module.exports = {
  createPhoto,
  getPhotos,
  getPhotoById,
  updatePhoto,
  deletePhoto,
  getNearbyPhotos,
  linkPhotoToPointOfInterest,
  unlinkPhotoFromPointOfInterest
}; 