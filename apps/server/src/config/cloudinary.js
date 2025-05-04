const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Carica variabili d'ambiente
dotenv.config();

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Usa HTTPS
});

/**
 * Carica un'immagine su Cloudinary
 * @param {string} imagePath - Path locale o URL dell'immagine da caricare
 * @param {Object} options - Opzioni di upload come folder, crop, etc.
 * @returns {Promise} - Promise che si risolve nei dettagli dell'upload
 */
const uploadImage = async (imagePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: options.folder || 'lude',
      resource_type: 'auto',
      ...options
    });
    return result;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};

/**
 * Elimina un'immagine da Cloudinary
 * @param {string} publicId - ID pubblico dell'immagine
 * @returns {Promise} - Promise che si risolve nei dettagli dell'eliminazione
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage
}; 