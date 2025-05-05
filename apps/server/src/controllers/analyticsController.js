const { asyncHandler } = require('../middleware/errorMiddleware');
const analyticsService = require('../services/analyticsService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Ottiene statistiche di riepilogo per l'utente
 * @route   GET /api/analytics/summary
 * @access  Private
 */
const getSummaryStats = asyncHandler(async (req, res) => {
  try {
    const stats = await analyticsService.getUserSummaryStats(req.user._id);
    return sendSuccess(res, stats);
  } catch (error) {
    console.error('Errore nel recupero delle statistiche:', error);
    return sendError(res, error.message, 500);
  }
});

/**
 * @desc    Ottiene dati di trend per grafici
 * @route   GET /api/analytics/trends
 * @access  Private
 */
const getTrends = asyncHandler(async (req, res) => {
  const { period, endDate } = req.query;
  
  // Validazione del periodo
  const validPeriods = ['week', 'month', 'year'];
  if (period && !validPeriods.includes(period)) {
    return sendError(res, `Periodo non valido. Valori consentiti: ${validPeriods.join(', ')}`, 400);
  }
  
  // Gestione data di fine
  let endDateTime = new Date();
  if (endDate) {
    endDateTime = new Date(endDate);
    if (isNaN(endDateTime.getTime())) {
      return sendError(res, 'Data di fine non valida', 400);
    }
  }
  
  try {
    const trends = await analyticsService.getUserTrends(
      req.user._id,
      period || 'week',
      endDateTime
    );
    
    return sendSuccess(res, trends);
  } catch (error) {
    console.error('Errore nel recupero dei trend:', error);
    return sendError(res, error.message, 500);
  }
});

/**
 * @desc    Ottiene dati per heatmap delle posizioni
 * @route   GET /api/analytics/heatmap
 * @access  Private
 */
const getHeatmapData = asyncHandler(async (req, res) => {
  const { bounds, startDate, endDate } = req.query;
  
  // Parsing dei bounds se presenti
  let boundsObj = null;
  if (bounds) {
    try {
      boundsObj = JSON.parse(bounds);
    } catch (error) {
      return sendError(res, 'Formato bounds non valido', 400);
    }
  }
  
  // Filtri per date
  const filters = {};
  
  if (startDate) {
    const startDateTime = new Date(startDate);
    if (isNaN(startDateTime.getTime())) {
      return sendError(res, 'Data di inizio non valida', 400);
    }
    filters.startDate = startDateTime;
  }
  
  if (endDate) {
    const endDateTime = new Date(endDate);
    if (isNaN(endDateTime.getTime())) {
      return sendError(res, 'Data di fine non valida', 400);
    }
    filters.endDate = endDateTime;
  }
  
  try {
    const heatmapData = await analyticsService.getHeatmapData(
      req.user._id,
      boundsObj,
      filters
    );
    
    return sendSuccess(res, heatmapData);
  } catch (error) {
    console.error('Errore nel recupero dei dati heatmap:', error);
    return sendError(res, error.message, 500);
  }
});

/**
 * @desc    Esporta dati utente e tracce
 * @route   GET /api/analytics/export
 * @access  Private
 */
const exportData = asyncHandler(async (req, res) => {
  const { format, startDate, endDate, limit } = req.query;
  
  // Validazione formato
  const validFormats = ['json', 'csv', 'gpx'];
  if (!validFormats.includes(format)) {
    return sendError(res, `Formato non valido. Valori consentiti: ${validFormats.join(', ')}`, 400);
  }
  
  // Filtri per date e limiti
  const filters = {};
  
  if (startDate) {
    const startDateTime = new Date(startDate);
    if (isNaN(startDateTime.getTime())) {
      return sendError(res, 'Data di inizio non valida', 400);
    }
    filters.startDate = startDateTime;
  }
  
  if (endDate) {
    const endDateTime = new Date(endDate);
    if (isNaN(endDateTime.getTime())) {
      return sendError(res, 'Data di fine non valida', 400);
    }
    filters.endDate = endDateTime;
  }
  
  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return sendError(res, 'Limite non valido', 400);
    }
    filters.limit = parsedLimit;
  }
  
  try {
    const exportData = await analyticsService.exportUserData(
      req.user._id,
      format,
      filters
    );
    
    // Invia il file al client in base al formato
    if (format === 'json') {
      return res.json(exportData);
    } else {
      // Per CSV e GPX imposta gli header corretti
      res.set('Content-Type', exportData.contentType);
      res.set('Content-Disposition', `attachment; filename="${exportData.filename}"`);
      return res.send(exportData.content);
    }
  } catch (error) {
    console.error('Errore nell\'esportazione dei dati:', error);
    return sendError(res, error.message, 500);
  }
});

module.exports = {
  getSummaryStats,
  getTrends,
  getHeatmapData,
  exportData
}; 