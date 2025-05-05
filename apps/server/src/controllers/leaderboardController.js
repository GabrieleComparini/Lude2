const { asyncHandler } = require('../middleware/errorMiddleware');
const leaderboardService = require('../services/leaderboardService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Ottiene una classifica per tipo e periodo
 * @route   GET /api/leaderboards/:type/:period
 * @access  Private
 */
const getLeaderboard = asyncHandler(async (req, res) => {
  const { type, period } = req.params;
  const { date, scope, geoCode, forceRefresh } = req.query;
  
  // Validazione parametri richiesti
  const validTypes = ['total_distance', 'total_tracks', 'avg_speed', 'max_speed', 'total_duration', 'total_elevation'];
  const validPeriods = ['daily', 'weekly', 'monthly', 'yearly', 'all_time'];
  
  if (!validTypes.includes(type)) {
    return sendError(res, `Tipo di classifica non valido. Valori consentiti: ${validTypes.join(', ')}`, 400);
  }
  
  if (!validPeriods.includes(period)) {
    return sendError(res, `Periodo non valido. Valori consentiti: ${validPeriods.join(', ')}`, 400);
  }
  
  try {
    const referenceDate = date ? new Date(date) : new Date();
    
    if (isNaN(referenceDate.getTime())) {
      return sendError(res, 'Data non valida', 400);
    }
    
    const options = {
      scope: scope || 'global',
      geoCode: geoCode || null,
      forceRefresh: forceRefresh === 'true'
    };
    
    const leaderboard = await leaderboardService.getOrGenerateLeaderboard(
      type, 
      period, 
      referenceDate, 
      options
    );
    
    // Verifica se l'utente corrente è nella classifica e arricchisci i dati
    const enrichedData = enrichLeaderboardWithUserData(leaderboard, req.user._id);
    
    return sendSuccess(res, enrichedData);
  } catch (error) {
    console.error('Errore durante il recupero della classifica:', error);
    return sendError(res, error.message, 500);
  }
});

/**
 * @desc    Ottiene la posizione dell'utente in una classifica
 * @route   GET /api/leaderboards/:type/:period/position
 * @access  Private
 */
const getUserPosition = asyncHandler(async (req, res) => {
  const { type, period } = req.params;
  const { date, scope, geoCode } = req.query;
  
  try {
    const referenceDate = date ? new Date(date) : new Date();
    
    if (isNaN(referenceDate.getTime())) {
      return sendError(res, 'Data non valida', 400);
    }
    
    const options = {
      scope: scope || 'global',
      geoCode: geoCode || null,
      forceRefresh: false
    };
    
    const leaderboard = await leaderboardService.getOrGenerateLeaderboard(
      type, 
      period, 
      referenceDate, 
      options
    );
    
    // Cerca l'utente nella classifica
    const userId = req.user._id.toString();
    const userEntry = leaderboard.entries.find(entry => 
      entry.userId.toString() === userId
    );
    
    if (!userEntry) {
      return sendSuccess(res, {
        inLeaderboard: false,
        message: 'Non sei presente in questa classifica'
      });
    }
    
    // Calcola la posizione percentile (es: top 10%)
    const totalEntries = leaderboard.entries.length;
    const percentile = Math.round((userEntry.rank / totalEntries) * 100);
    
    return sendSuccess(res, {
      inLeaderboard: true,
      rank: userEntry.rank,
      value: userEntry.value,
      total: totalEntries,
      percentile,
      change: userEntry.change
    });
  } catch (error) {
    console.error('Errore durante il recupero della posizione:', error);
    return sendError(res, error.message, 500);
  }
});

/**
 * Arricchisce i dati della classifica con informazioni sull'utente corrente
 * @param {Object} leaderboard - La classifica completa
 * @param {ObjectId} userId - ID dell'utente corrente
 * @returns {Object} - Classifica arricchita
 */
const enrichLeaderboardWithUserData = (leaderboard, userId) => {
  if (!leaderboard || !leaderboard.entries) {
    return leaderboard;
  }
  
  const userIdStr = userId.toString();
  const userInLeaderboard = leaderboard.entries.find(entry => 
    entry.userId.toString() === userIdStr
  );
  
  return {
    ...leaderboard.toObject(),
    userStatus: {
      inLeaderboard: !!userInLeaderboard,
      currentUserRank: userInLeaderboard ? userInLeaderboard.rank : null,
      currentUserValue: userInLeaderboard ? userInLeaderboard.value : null,
      currentUserChange: userInLeaderboard ? userInLeaderboard.change : null
    }
  };
};

module.exports = {
  getLeaderboard,
  getUserPosition
}; 