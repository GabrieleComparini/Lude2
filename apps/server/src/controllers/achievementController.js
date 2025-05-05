const { asyncHandler } = require('../middleware/errorMiddleware');
const achievementService = require('../services/achievementService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');
const { normalizePagination } = require('../utils/validator');

/**
 * @desc    Ottiene tutti gli achievement disponibili nel sistema
 * @route   GET /api/achievements
 * @access  Private
 */
const getAllAchievements = asyncHandler(async (req, res) => {
  const filters = {
    category: req.query.category,
    rarity: req.query.rarity,
    isHidden: req.query.showHidden ? undefined : false
  };
  
  const achievements = await achievementService.getAllAchievements(filters);
  
  return sendSuccess(res, achievements);
});

/**
 * @desc    Ottiene gli achievement di un utente
 * @route   GET /api/achievements/earned
 * @access  Private
 */
const getUserAchievements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = normalizePagination(req.query);
  
  const result = await achievementService.getUserAchievements(req.user._id, {
    skip,
    limit
  });
  
  return sendPaginated(res, 
    result.achievements, 
    result.total, 
    page, 
    limit
  );
});

/**
 * @desc    Verifica in tempo reale gli achievement sbloccabili dall'utente
 * @route   GET /api/achievements/check
 * @access  Private
 */
const checkAchievements = asyncHandler(async (req, res) => {
  const newAchievements = await achievementService.checkAchievementsForUser(req.user._id);
  
  return sendSuccess(res, {
    newAchievementsCount: newAchievements.length,
    newAchievements
  });
});

/**
 * @desc    Marca un achievement come visualizzato dall'utente
 * @route   PUT /api/achievements/:id/seen
 * @access  Private
 */
const markAchievementAsSeen = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const userAchievement = await achievementService.markAchievementAsSeen(req.user._id, id);
  
  return sendSuccess(res, userAchievement);
});

/**
 * @desc    Ottiene dettagli di un singolo achievement
 * @route   GET /api/achievements/:id
 * @access  Private
 */
const getAchievementById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const achievement = await Achievement.findById(id);
    
    if (!achievement) {
      return sendError(res, 'Achievement non trovato', 404);
    }
    
    return sendSuccess(res, achievement);
  } catch (error) {
    return sendError(res, 'ID achievement non valido', 400);
  }
});

module.exports = {
  getAllAchievements,
  getUserAchievements,
  checkAchievements,
  markAchievementAsSeen,
  getAchievementById
}; 