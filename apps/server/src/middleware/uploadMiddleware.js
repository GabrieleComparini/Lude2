const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');
const { createError } = require('./errorMiddleware');
const { uploadImage } = require('../config/cloudinary');

// Crea directory temporanea se non esiste
const tmpDir = path.join(__dirname, '../../tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Configurazione di Cloudinary (dovrebbe essere già configurato in config/cloudinary.js)
// Utilizzo diretto qui in caso di deploy dove potrebbe non caricare la configurazione in tempo

// Configurazione dello storage per Multer che usa Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lude/photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' }, // Immagine principale
    ],
    eager: [
      { width: 300, height: 300, crop: 'fill' } // Thumbnail
    ]
  }
});

// Configurazione alternativa con storage locale temporaneo (fallback)
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../tmp/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro per i file
const fileFilter = (req, file, cb) => {
  // Accetta solo immagini
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo immagini sono permesse!'), false);
  }
};

// Middleware Multer con storage Cloudinary
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Middleware Multer con storage locale (fallback)
const localUpload = multer({
  storage: localStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

/**
 * Middleware per l'upload di immagini su Cloudinary
 * @param {string} fieldName - Nome del campo del form
 * @param {Object} options - Opzioni per l'upload su Cloudinary
 */
const uploadToCloudinary = (fieldName, options = {}) => {
  return async (req, res, next) => {
    // Usa 'upload' configurato con Cloudinary
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: `Errore di upload: ${err.message}`
          });
        }
        return res.status(500).json({
          success: false,
          message: `Errore del server: ${err.message}`
        });
      }

      // Nessun file caricato
      if (!req.file) {
        return next();
      }

      // Il file è già stato caricato su Cloudinary da multer-storage-cloudinary
      // req.file contiene già i metadati di Cloudinary
      req.cloudinaryResult = {
        secure_url: req.file.path,
        public_id: req.file.filename,
        eager: req.file.eager || []
      };

      next();
    });
  };
};

module.exports = {
  upload,
  localUpload,
  uploadToCloudinary
}; 