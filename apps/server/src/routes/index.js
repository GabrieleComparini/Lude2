const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const trackRoutes = require('./trackRoutes');
const photoRoutes = require('./photoRoutes');

// Rotte per autenticazione
router.use('/auth', authRoutes);

// Rotte per utenti
router.use('/users', userRoutes);

// Rotte per tracce
router.use('/tracks', trackRoutes);

// Rotte per foto
router.use('/photos', photoRoutes);

module.exports = router; 