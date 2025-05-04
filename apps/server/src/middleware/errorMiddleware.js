/**
 * Gestore errori formattati per le risposte API
 */
const errorHandler = (err, req, res, next) => {
  // Log dell'errore
  console.error('Error:', err);
  
  // Ottiene lo status code dall'errore o fallback a 500
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Errore interno del server',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    errors: err.errors || null
  });
};

/**
 * Middleware per catturare errori asincroni
 * @param {Function} fn - Funzione asincrona da avvolgere
 * @returns {Function} - Middleware pronto per express
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Crea un errore formattato
 * @param {string} message - Messaggio di errore
 * @param {number} statusCode - Codice HTTP
 * @returns {Error} - Errore formattato
 */
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Crea un errore di validazione con errori multipli
 * @param {string} message - Messaggio di errore principale
 * @param {Object} validationErrors - Oggetto con errori di validazione
 * @returns {Error} - Errore formattato con dettagli di validazione
 */
const createValidationError = (message, validationErrors) => {
  const error = createError(message, 422);
  error.errors = validationErrors;
  return error;
};

module.exports = {
  errorHandler,
  asyncHandler,
  createError,
  createValidationError
}; 