const { createError, createValidationError } = require('./errorMiddleware');

/**
 * Validazione delle coordinate geografiche
 */
const validateCoordinates = (req, res, next) => {
  const { latitude, longitude } = req.body;
  
  // Valida latitude
  if (latitude === undefined || latitude === null) {
    return next(createError('Latitudine mancante', 400));
  }
  
  const lat = parseFloat(latitude);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    return next(createError('Latitudine non valida. Deve essere un numero tra -90 e 90', 400));
  }
  
  // Valida longitude
  if (longitude === undefined || longitude === null) {
    return next(createError('Longitudine mancante', 400));
  }
  
  const lng = parseFloat(longitude);
  if (isNaN(lng) || lng < -180 || lng > 180) {
    return next(createError('Longitudine non valida. Deve essere un numero tra -180 e 180', 400));
  }
  
  // Aggiunge coordinate validate alla request
  req.validatedCoordinates = {
    latitude: lat,
    longitude: lng
  };
  
  next();
};

/**
 * Validazione completa percorso (route) in formato GeoJSON
 */
const validateGeoJsonRoute = (req, res, next) => {
  const { route } = req.body;
  
  if (!route) {
    return next(createError('Route GeoJSON mancante', 400));
  }
  
  try {
    // Valida struttura GeoJSON
    if (!route.type || !route.coordinates) {
      return next(createError('Route GeoJSON non valida, mancano type o coordinates', 400));
    }
    
    if (route.type !== 'LineString') {
      return next(createError('Route GeoJSON deve essere di tipo LineString', 400));
    }
    
    if (!Array.isArray(route.coordinates) || route.coordinates.length < 2) {
      return next(createError('Route GeoJSON deve contenere almeno 2 punti', 400));
    }
    
    // Valida ogni punto
    const errors = [];
    
    route.coordinates.forEach((point, index) => {
      if (!Array.isArray(point) || point.length < 2) {
        errors.push(`Punto ${index} non valido, deve avere almeno longitudine e latitudine`);
        return;
      }
      
      const [lng, lat] = point;
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push(`Punto ${index}: longitudine non valida (${lng})`);
      }
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push(`Punto ${index}: latitudine non valida (${lat})`);
      }
    });
    
    if (errors.length > 0) {
      return next(createValidationError('Errori nella validazione della route', { route: errors }));
    }
    
    // Aggiunge route validata alla request
    req.validatedRoute = route;
    
    next();
  } catch (error) {
    next(createError(`Errore durante la validazione della route: ${error.message}`, 400));
  }
};

/**
 * Formatta un punto in GeoJSON
 */
const pointToGeoJson = (latitude, longitude) => {
  return {
    type: 'Point',
    coordinates: [longitude, latitude] // GeoJSON usa [longitude, latitude]
  };
};

/**
 * Helper per creare filtro di query geografica
 */
const createGeoNearQuery = (longitude, latitude, maxDistanceKm = 10) => {
  return {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistanceKm * 1000 // Converti in metri
      }
    }
  };
};

module.exports = {
  validateCoordinates,
  validateGeoJsonRoute,
  pointToGeoJson,
  createGeoNearQuery
}; 