const express = require('express');
const router = express.Router();
const { protect, ownerOrAdmin } = require('../middleware/authMiddleware');
const { asyncHandler, createError } = require('../middleware/errorMiddleware');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');
const Vehicle = require('../models/Vehicle');

/**
 * @route   GET /api/vehicles
 * @desc    Ottiene tutti i veicoli dell'utente
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ userId: req.user._id });
  
  res.status(200).json({
    success: true,
    count: vehicles.length,
    vehicles
  });
}));

/**
 * @route   POST /api/vehicles
 * @desc    Aggiunge un nuovo veicolo
 * @access  Private
 */
router.post(
  '/',
  protect,
  uploadToCloudinary('vehicleImage', { folder: 'lude/vehicles' }),
  asyncHandler(async (req, res) => {
    const {
      name,
      type,
      make,
      model,
      year,
      specs,
      isDefault,
      notes
    } = req.body;
    
    // Validazione base
    if (!name || !type) {
      throw createError('Nome e tipo del veicolo sono obbligatori', 400);
    }
    
    // Crea nuovo veicolo
    const vehicle = new Vehicle({
      userId: req.user._id,
      name,
      type,
      make,
      model,
      year: year ? parseInt(year) : undefined,
      specs: specs ? JSON.parse(specs) : undefined,
      isDefault: isDefault === 'true',
      notes
    });
    
    // Aggiunge immagine se caricata
    if (req.cloudinaryResult) {
      vehicle.image = req.cloudinaryResult.secure_url;
    }
    
    // Salva il veicolo
    await vehicle.save();
    
    res.status(201).json({
      success: true,
      message: 'Veicolo aggiunto con successo',
      vehicle
    });
  })
);

/**
 * @route   GET /api/vehicles/:id
 * @desc    Ottiene un veicolo specifico
 * @access  Private
 */
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({
    _id: req.params.id,
    userId: req.user._id
  });
  
  if (!vehicle) {
    throw createError('Veicolo non trovato', 404);
  }
  
  res.status(200).json({
    success: true,
    vehicle
  });
}));

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Aggiorna un veicolo
 * @access  Private
 */
router.put(
  '/:id',
  protect,
  uploadToCloudinary('vehicleImage', { folder: 'lude/vehicles' }),
  asyncHandler(async (req, res) => {
    const {
      name,
      type,
      make,
      model,
      year,
      specs,
      isDefault,
      notes
    } = req.body;
    
    // Trova il veicolo
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!vehicle) {
      throw createError('Veicolo non trovato', 404);
    }
    
    // Aggiorna i campi
    if (name) vehicle.name = name;
    if (type) vehicle.type = type;
    if (make) vehicle.make = make;
    if (model) vehicle.model = model;
    if (year) vehicle.year = parseInt(year);
    if (specs) vehicle.specs = JSON.parse(specs);
    if (isDefault !== undefined) vehicle.isDefault = isDefault === 'true';
    if (notes) vehicle.notes = notes;
    
    // Aggiunge immagine se caricata
    if (req.cloudinaryResult) {
      vehicle.image = req.cloudinaryResult.secure_url;
    }
    
    // Salva le modifiche
    await vehicle.save();
    
    res.status(200).json({
      success: true,
      message: 'Veicolo aggiornato con successo',
      vehicle
    });
  })
);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Elimina un veicolo
 * @access  Private
 */
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  // Trova il veicolo
  const vehicle = await Vehicle.findOne({
    _id: req.params.id,
    userId: req.user._id
  });
  
  if (!vehicle) {
    throw createError('Veicolo non trovato', 404);
  }
  
  // Elimina il veicolo
  await vehicle.remove();
  
  res.status(200).json({
    success: true,
    message: 'Veicolo eliminato con successo'
  });
}));

/**
 * @route   GET /api/vehicles/stats
 * @desc    Ottiene statistiche per veicolo
 * @access  Private
 */
router.get('/stats', protect, asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ userId: req.user._id })
    .select('name type stats');
  
  res.status(200).json({
    success: true,
    vehicles
  });
}));

/**
 * @route   PUT /api/vehicles/:id/default
 * @desc    Imposta un veicolo come predefinito
 * @access  Private
 */
router.put('/:id/default', protect, asyncHandler(async (req, res) => {
  // Trova il veicolo
  const vehicle = await Vehicle.findOne({
    _id: req.params.id,
    userId: req.user._id
  });
  
  if (!vehicle) {
    throw createError('Veicolo non trovato', 404);
  }
  
  // Imposta questo veicolo come predefinito (e disattiva gli altri)
  vehicle.isDefault = true;
  await vehicle.save();
  
  res.status(200).json({
    success: true,
    message: 'Veicolo impostato come predefinito',
    vehicle
  });
}));

module.exports = router; 