const jwt = require('jsonwebtoken');
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');

/**
 * Middleware per proteggere le rotte e verificare il token JWT
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Ottiene il token dall'header Authorization
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Non autorizzato, token non fornito',
        });
      }

      try {
        // Verifica JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ottiene l'utente dal database
        const user = await User.findById(decoded.id);

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Utente non trovato',
          });
        }

        // Aggiorna l'ultimo accesso
        user.lastLogin = new Date();
        await user.save();

        // Aggiunge l'utente alla request
        req.user = user;
        next();
      } catch (error) {
        console.error('Auth error:', error);
        
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Token non valido',
          });
        }
        
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token scaduto',
          });
        }
        
        return res.status(401).json({
          success: false,
          message: 'Non autorizzato, errore di autenticazione',
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Non autorizzato, token non fornito',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore di autenticazione',
    });
  }
};

/**
 * Middleware legacy per supporto Firebase (compatibilità)
 */
const firebaseProtect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Ottiene il token dall'header Authorization
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Non autorizzato, token non fornito',
        });
      }

      try {
        // Verifica il token con Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Ottiene l'utente dal database
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Utente non registrato nel sistema',
          });
        }

        // Aggiorna l'ultimo accesso
        user.lastLogin = new Date();
        await user.save();

        // Aggiunge l'utente alla request
        req.user = user;
        next();
      } catch (error) {
        console.error('Firebase auth error:', error);
        return res.status(401).json({
          success: false,
          message: 'Non autorizzato, token Firebase non valido',
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Non autorizzato, token non fornito',
      });
    }
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore di autenticazione Firebase',
    });
  }
};

/**
 * Middleware per verificare che l'utente sia un admin
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Accesso negato, richiesti privilegi di admin',
    });
  }
};

/**
 * Middleware per verificare che l'utente sia proprietario della risorsa o admin
 */
const ownerOrAdmin = (resourceModel) => async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    
    // Salta il controllo se l'utente è admin
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Carica la risorsa
    const resource = await resourceModel.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Risorsa non trovata',
      });
    }
    
    // Verifica che l'ID utente corrisponda al proprietario
    const resourceUserId = resource.userId || resource.user;
    
    if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Non autorizzato ad accedere a questa risorsa',
      });
    }
  } catch (error) {
    console.error('Owner check error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella verifica dei permessi',
    });
  }
};

module.exports = {
  protect,
  firebaseProtect,
  adminOnly,
  ownerOrAdmin,
}; 