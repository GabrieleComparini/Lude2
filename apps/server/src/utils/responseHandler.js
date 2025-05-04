/**
 * Invia una risposta di successo
 * @param {Object} res - Oggetto response di Express
 * @param {number} statusCode - Codice di stato HTTP
 * @param {string} message - Messaggio di successo
 * @param {Object} data - Dati da inviare nella risposta
 */
const sendSuccess = (res, statusCode = 200, message = 'Operazione completata con successo', data = null) => {
  const response = {
    success: true,
    message
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Invia una risposta di errore
 * @param {Object} res - Oggetto response di Express
 * @param {number} statusCode - Codice di stato HTTP
 * @param {string} message - Messaggio di errore
 * @param {Object} errors - Eventuali dettagli sugli errori
 */
const sendError = (res, statusCode = 400, message = 'Si è verificato un errore', errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Invia una risposta paginata
 * @param {Object} res - Oggetto response di Express
 * @param {number} statusCode - Codice di stato HTTP
 * @param {string} message - Messaggio di successo
 * @param {Array} items - Array di elementi da inviare
 * @param {number} currentPage - Pagina corrente
 * @param {number} totalPages - Numero totale di pagine
 * @param {number} totalItems - Numero totale di elementi
 */
const sendPaginated = (
  res, 
  statusCode = 200, 
  message = 'Operazione completata con successo', 
  items = [], 
  currentPage = 1, 
  totalPages = 1, 
  totalItems = 0
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: items,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    }
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated
}; 