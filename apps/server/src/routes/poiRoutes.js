const express = require('express');
const router = express.Router();
const { protect, ownerOrAdmin } = require('../middleware/authMiddleware');
const { asyncHandler, createError } = require('../middleware/errorMiddleware');

/**
 * Placeholder per le rotte POI che verranno implementate in futuro
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'POI routes placeholder'
  });
});

module.exports = router; 