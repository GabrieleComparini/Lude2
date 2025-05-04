const { asyncHandler } = require('../middleware/errorMiddleware');
const authService = require('../services/authService');

/**
 * @desc    Sincronizza utente Firebase con database locale
 * @route   POST /api/auth/sync
 * @access  Public
 */
const syncUser = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token non fornito'
    });
  }
  
  const result = await authService.syncUserWithFirebase(token);
  
  if (result.isNew) {
    res.status(201).json({
      success: true,
      message: 'Utente sincronizzato con successo',
      user: result.user
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'Utente già sincronizzato',
      user: result.user
    });
  }
});

/**
 * @desc    Verifica token e restituisce dati utente
 * @route   GET /api/auth/verify
 * @access  Private
 */
const verifyToken = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

/**
 * @desc    Crea un nuovo utente admin (solo admin può farlo)
 * @route   POST /api/auth/create-admin
 * @access  Admin
 */
const createAdmin = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  
  // Validazione base
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Email, password e nome sono obbligatori'
    });
  }
  
  const newAdmin = await authService.createAdminUser(email, password, name);
  
  res.status(201).json({
    success: true,
    message: 'Utente admin creato con successo',
    user: newAdmin
  });
});

module.exports = {
  syncUser,
  verifyToken,
  createAdmin
}; 