const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { asyncHandler, createError } = require('../middleware/errorMiddleware');

/**
 * Placeholder per le rotte admin che verranno implementate in futuro
 */
router.get('/', protect, adminOnly, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin routes placeholder'
  });
});

module.exports = router; 