const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

/**
 * @route   GET /api/analytics/summary
 * @desc    Ottiene statistiche di riepilogo per l'utente
 * @access  Private
 */
router.get('/summary', protect, analyticsController.getSummaryStats);

/**
 * @route   GET /api/analytics/trends
 * @desc    Ottiene dati di trend per grafici
 * @access  Private
 */
router.get('/trends', protect, analyticsController.getTrends);

/**
 * @route   GET /api/analytics/heatmap
 * @desc    Ottiene dati per heatmap delle posizioni
 * @access  Private
 */
router.get('/heatmap', protect, analyticsController.getHeatmapData);

/**
 * @route   GET /api/analytics/export
 * @desc    Esporta dati utente e tracce
 * @access  Private
 */
router.get('/export', protect, analyticsController.exportData);

module.exports = router; 