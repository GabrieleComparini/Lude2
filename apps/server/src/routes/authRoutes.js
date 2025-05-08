const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

/**
 * @route   POST /api/auth/register
 * @desc    Registra un nuovo utente
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login utente
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout utente
 * @access  Private
 */
router.post('/logout', protect, authController.logout);

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