const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

/**
 * @route   POST /api/auth/sync
 * @desc    Sincronizza utente Firebase con database locale
 * @access  Public
 */
router.post('/sync', authController.syncUser);

/**
 * @route   GET /api/auth/verify
 * @desc    Verifica token e restituisce dati utente
 * @access  Private
 */
router.get('/verify', protect, authController.verifyToken);

/**
 * @route   POST /api/auth/create-admin
 * @desc    Crea un nuovo utente admin (solo admin può farlo)
 * @access  Admin
 */
router.post('/create-admin', protect, adminOnly, authController.createAdmin);

module.exports = router; 