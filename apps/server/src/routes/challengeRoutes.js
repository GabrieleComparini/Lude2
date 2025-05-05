const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const challengeController = require('../controllers/challengeController');

/**
 * @route   GET /api/challenges
 * @desc    Ottiene le sfide disponibili
 * @access  Private
 */
router.get('/', protect, challengeController.getChallenges);

/**
 * @route   GET /api/challenges/user
 * @desc    Ottiene le sfide dell'utente
 * @access  Private
 */
router.get('/user', protect, challengeController.getUserChallenges);

/**
 * @route   GET /api/challenges/:id
 * @desc    Ottiene i dettagli di una sfida specifica
 * @access  Private
 */
router.get('/:id', protect, challengeController.getChallengeById);

/**
 * @route   POST /api/challenges/:id/join
 * @desc    Partecipa a una sfida
 * @access  Private
 */
router.post('/:id/join', protect, challengeController.joinChallenge);

/**
 * @route   POST /api/challenges/:id/leave
 * @desc    Abbandona una sfida
 * @access  Private
 */
router.post('/:id/leave', protect, challengeController.leaveChallenge);

/**
 * @route   GET /api/challenges/:id/progress
 * @desc    Ottiene il progresso dell'utente in una sfida
 * @access  Private
 */
router.get('/:id/progress', protect, challengeController.getChallengeProgress);

/**
 * @route   GET /api/challenges/:id/leaderboard
 * @desc    Ottiene la classifica dei partecipanti a una sfida
 * @access  Private
 */
router.get('/:id/leaderboard', protect, challengeController.getChallengeLeaderboard);

module.exports = router; 