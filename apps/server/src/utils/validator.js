/**
 * Validazione di base per una email
 * @param {string} email - Email da validare
 * @returns {boolean} - true se l'email è valida, false altrimenti
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validazione di base per una password
 * @param {string} password - Password da validare
 * @returns {boolean} - true se la password è valida, false altrimenti
 */
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validazione per coordinate geografiche
 * @param {number} latitude - Latitudine da validare
 * @param {number} longitude - Longitudine da validare
 * @returns {Object} - Oggetto con i risultati della validazione
 */
const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  const errors = {};
  
  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.latitude = 'Latitudine non valida';
  }
  
  if (isNaN(lng) || lng < -180 || lng > 180) {
    errors.longitude = 'Longitudine non valida';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    coordinates: { lat, lng }
  };
};

/**
 * Validazione delle query di paginazione
 * @param {Object} query - Oggetto query
 * @returns {Object} - Oggetto con i parametri di paginazione normalizzati
 */
const normalizePagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  return {
    page,
    limit,
    skip
  };
};

/**
 * Normalizza i parametri di ordinamento
 * @param {Object} query - Oggetto query
 * @param {Array} allowedFields - Campi su cui è permesso ordinare
 * @param {string} defaultField - Campo di default per l'ordinamento
 * @returns {Object} - Oggetto con i parametri di ordinamento
 */
const normalizeSorting = (query, allowedFields = [], defaultField = 'createdAt') => {
  let sort = query.sort || defaultField;
  let order = query.order || 'desc';
  
  // Verifica che il campo di ordinamento sia tra quelli consentiti
  if (allowedFields.length > 0 && !allowedFields.includes(sort)) {
    sort = defaultField;
  }
  
  // Normalizza l'ordine
  if (order !== 'asc' && order !== 'desc') {
    order = 'desc';
  }
  
  return {
    sort,
    order,
    sortObj: { [sort]: order === 'desc' ? -1 : 1 }
  };
};

module.exports = {
  isValidEmail,
  isValidPassword,
  validateCoordinates,
  normalizePagination,
  normalizeSorting
}; 