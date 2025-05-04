const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createError } = require('./errorMiddleware');
const { uploadImage } = require('../config/cloudinary');

// Crea directory temporanea se non esiste
const tmpDir = path.join(__dirname, '../../tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Configurazione storage per Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro file per accettare solo immagini
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError('Tipo di file non supportato. Caricare solo immagini (JPEG, PNG, GIF, WEBP).', 400), false);
  }
};

// Inizializza multer con le configurazioni
const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB 
  }
});

/**
 * Middleware per l'upload di immagini su Cloudinary
 * @param {string} fieldName - Nome del campo del form
 * @param {Object} options - Opzioni per l'upload su Cloudinary
 */
const uploadToCloudinary = (fieldName, options = {}) => {
  return async (req, res, next) => {
    // Prima utilizza multer per salvare temporaneamente il file
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Errore di Multer (file troppo grande, ecc.)
          return next(createError(`Errore upload: ${err.message}`, 400));
        }
        return next(err);
      }
      
      // Se non c'è nessun file, continua
      if (!req.file) {
        return next();
      }
      
      try {
        // Opzioni di upload specifiche per il tipo di immagine
        const uploadOptions = {
          folder: options.folder || 'lude',
          ...options
        };
        
        // Carica il file su Cloudinary
        const result = await uploadImage(req.file.path, uploadOptions);
        
        // Aggiunge i dati di Cloudinary alla request
        req.cloudinaryResult = result;
        
        // Rimuove il file temporaneo
        fs.unlinkSync(req.file.path);
        
        next();
      } catch (error) {
        // Rimuove il file temporaneo in caso di errore
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        next(createError(`Errore nel caricamento dell'immagine: ${error.message}`, 500));
      }
    });
  };
};

module.exports = {
  upload,
  uploadToCloudinary
}; 