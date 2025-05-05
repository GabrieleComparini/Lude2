const { asyncHandler } = require('../middleware/errorMiddleware');
const challengeService = require('../services/challengeService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');
const { normalizePagination, normalizeSorting } = require('../utils/validator');
const mongoose = require('mongoose');

/**
 * @desc    Ottiene le sfide disponibili
 * @route   GET /api/challenges
 * @access  Private
 */
const getChallenges = asyncHandler(async (req, res) => {
  const { page, limit, skip } = normalizePagination(req.query);
  const sort = normalizeSorting(req.query.sort, { startDate: -1 });
  
  // Filtri dalle query params
  const filters = {
    status: req.query.status,
    type: req.query.type,
    difficulty: req.query.difficulty,
    isSpecial: req.query.isSpecial === 'true' ? true : undefined,
    activeNow: req.query.activeNow === 'true',
    vehicleType: req.query.vehicleType,
    tag: req.query.tag,
    createdBy: req.query.createdBy
  };
  
  const result = await challengeService.getChallenges(filters, {
    skip,
    limit,
    sort
  });
  
  return sendPaginated(res, 
    result.challenges, 
    result.total, 
    page, 
    limit
  );
});

/**
 * @desc    Ottiene i dettagli di una sfida specifica
 * @route   GET /api/challenges/:id
 * @access  Private
 */
const getChallengeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'ID sfida non valido', 400);
  }
  
  try {
    const challenge = await challengeService.getChallengeById(id);
    return sendSuccess(res, challenge);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
});

/**
 * @desc    Partecipa a una sfida
 * @route   POST /api/challenges/:id/join
 * @access  Private
 */
const joinChallenge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'ID sfida non valido', 400);
  }
  
  try {
    const userChallenge = await challengeService.joinChallenge(req.user._id, id);
    return sendSuccess(res, userChallenge);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
});

/**
 * @desc    Abbandona una sfida
 * @route   POST /api/challenges/:id/leave
 * @access  Private
 */
const leaveChallenge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'ID sfida non valido', 400);
  }
  
  try {
    const result = await challengeService.leaveChallenge(req.user._id, id);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
});

/**
 * @desc    Ottiene le sfide dell'utente
 * @route   GET /api/challenges/user
 * @access  Private
 */
const getUserChallenges = asyncHandler(async (req, res) => {
  const { page, limit, skip } = normalizePagination(req.query);
  const status = req.query.status || null;
  
  const result = await challengeService.getUserChallenges(req.user._id, status, {
    skip,
    limit
  });
  
  return sendPaginated(res, 
    result.userChallenges, 
    result.total, 
    page, 
    limit
  );
});

/**
 * @desc    Ottiene il progresso dell'utente in una sfida
 * @route   GET /api/challenges/:id/progress
 * @access  Private
 */
const getChallengeProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'ID sfida non valido', 400);
  }
  
  try {
    const userChallenge = await UserChallenge.findOne({
      userId: req.user._id,
      challengeId: id
    }).populate('challengeId');
    
    if (!userChallenge) {
      return sendError(res, 'Non stai partecipando a questa sfida', 404);
    }
    
    return sendSuccess(res, userChallenge);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

/**
 * @desc    Ottiene la classifica dei partecipanti a una sfida
 * @route   GET /api/challenges/:id/leaderboard
 * @access  Private
 */
const getChallengeLeaderboard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit, skip } = normalizePagination(req.query);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'ID sfida non valido', 400);
  }
  
  try {
    const result = await challengeService.getChallengeLeaderboard(id, {
      skip,
      limit
    });
    
    return sendPaginated(res, 
      result.leaderboard, 
      result.total, 
      page, 
      limit
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

module.exports = {
  getChallenges,
  getChallengeById,
  joinChallenge,
  leaveChallenge,
  getUserChallenges,
  getChallengeProgress,
  getChallengeLeaderboard
}; 