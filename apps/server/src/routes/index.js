const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const trackRoutes = require('./trackRoutes');
const photoRoutes = require('./photoRoutes');
const poiRoutes = require('./poiRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const socialRoutes = require('./socialRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const adminRoutes = require('./adminRoutes');
const challengeRoutes = require('./challengeRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');
const achievementRoutes = require('./achievementRoutes');

// Rotte per autenticazione
router.use('/auth', authRoutes);

// Rotte per utenti
router.use('/users', userRoutes);

// Rotte per tracce
router.use('/tracks', trackRoutes);

// Rotte per foto
router.use('/photos', photoRoutes);

// Rotte per punti di interesse
router.use('/pois', poiRoutes);

// Rotte per veicoli
router.use('/vehicles', vehicleRoutes);

// Rotte per social
router.use('/social', socialRoutes);

// Rotte per analytics
router.use('/analytics', analyticsRoutes);

// Rotte per admin
router.use('/admin', adminRoutes);

// Rotte per sfide
router.use('/challenges', challengeRoutes);

// Rotte per classifiche
router.use('/leaderboards', leaderboardRoutes);

// Rotte per achievements
router.use('/achievements', achievementRoutes);

module.exports = router; 