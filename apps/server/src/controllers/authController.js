const { asyncHandler } = require('../middleware/errorMiddleware');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

/**
 * @desc    Registra un nuovo utente
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email e password sono obbligatori'
    });
  }
  
  const result = await authService.registerUser(email, password, displayName);
  
  // Genera token JWT
  const token = jwt.sign(
    { id: result.user._id, email: result.user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.status(201).json({
    success: true,
    message: 'Registrazione completata con successo',
    token,
    user: result.user.toPublicJSON()
  });
});

/**
 * @desc    Login utente
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email e password sono obbligatori'
    });
  }
  
  const result = await authService.loginUser(email, password);
  
  // Genera token JWT
  const token = jwt.sign(
    { id: result.user._id, email: result.user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Aggiorna ultimo accesso
  result.user.lastLogin = new Date();
  await result.user.save();
  
  res.status(200).json({
    success: true,
    message: 'Login effettuato con successo',
    token,
    user: result.user.toPublicJSON()
  });
});

/**
 * @desc    Logout utente
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // In una implementazione più avanzata, potresti voler invalidare il token
  // O memorizzare in una blacklist i token invalidati
  
  res.status(200).json({
    success: true,
    message: 'Logout effettuato con successo'
  });
});

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
  
  // Genera token JWT
  const jwtToken = jwt.sign(
    { id: result.user._id, email: result.user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  if (result.isNew) {
    res.status(201).json({
      success: true,
      message: 'Utente sincronizzato con successo',
      token: jwtToken,
      user: result.user.toPublicJSON()
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'Utente già sincronizzato',
      token: jwtToken,
      user: result.user.toPublicJSON()
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
    user: req.user.toPublicJSON()
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
    user: newAdmin.toPublicJSON()
  });
});

module.exports = {
  register,
  login,
  logout,
  syncUser,
  verifyToken,
  createAdmin
}; 