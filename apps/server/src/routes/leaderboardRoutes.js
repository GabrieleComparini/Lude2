const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const leaderboardController = require('../controllers/leaderboardController');

/**
 * @route   GET /api/leaderboards/:type/:period
 * @desc    Ottiene una classifica per tipo e periodo
 * @access  Private
 */
router.get('/:type/:period', protect, leaderboardController.getLeaderboard);

/**
 * @route   GET /api/leaderboards/:type/:period/position
 * @desc    Ottiene la posizione dell'utente in una classifica
 * @access  Private
 */
router.get('/:type/:period/position', protect, leaderboardController.getUserPosition);

module.exports = router; 