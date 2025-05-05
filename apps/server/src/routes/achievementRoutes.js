const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const achievementController = require('../controllers/achievementController');

/**
 * @route   GET /api/achievements
 * @desc    Ottiene tutti gli achievement disponibili
 * @access  Private
 */
router.get('/', protect, achievementController.getAllAchievements);

/**
 * @route   GET /api/achievements/earned
 * @desc    Ottiene gli achievement dell'utente
 * @access  Private
 */
router.get('/earned', protect, achievementController.getUserAchievements);

/**
 * @route   GET /api/achievements/check
 * @desc    Controlla se l'utente ha sbloccato nuovi achievement
 * @access  Private
 */
router.get('/check', protect, achievementController.checkAchievements);

/**
 * @route   GET /api/achievements/:id
 * @desc    Ottiene dettagli di un achievement specifico
 * @access  Private
 */
router.get('/:id', protect, achievementController.getAchievementById);

/**
 * @route   PUT /api/achievements/:id/seen
 * @desc    Segna un achievement come visualizzato
 * @access  Private
 */
router.put('/:id/seen', protect, achievementController.markAchievementAsSeen);

module.exports = router; 