const { asyncHandler } = require('../middleware/errorMiddleware');
const notificationService = require('../services/notificationService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');
const { normalizePagination } = require('../utils/validator');

/**
 * @desc    Ottiene le notifiche dell'utente
 * @route   GET /api/social/notifications
 * @access  Private
 */
const getUserNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = normalizePagination(req.query);
  const { unreadOnly } = req.query;
  
  const { notifications, total } = await notificationService.getUserNotifications(
    req.user._id, 
    {
      skip,
      limit,
      unreadOnly: unreadOnly === 'true'
    }
  );
  
  const totalPages = Math.ceil(total / limit);
  
  return sendPaginated(
    res, 
    200, 
    'Notifiche recuperate con successo', 
    notifications, 
    page, 
    totalPages, 
    total
  );
});

/**
 * @desc    Segna una notifica come letta
 * @route   PUT /api/social/notifications/:id/read
 * @access  Private
 */
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const notification = await notificationService.markNotificationAsRead(id, req.user._id);
  
  if (!notification) {
    return sendError(res, 404, 'Notifica non trovata');
  }
  
  return sendSuccess(res, 200, 'Notifica segnata come letta', notification);
});

/**
 * @desc    Segna tutte le notifiche come lette
 * @route   PUT /api/social/notifications/read-all
 * @access  Private
 */
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(req.user._id);
  
  return sendSuccess(res, 200, 'Tutte le notifiche segnate come lette', result);
});

/**
 * @desc    Elimina una notifica
 * @route   DELETE /api/social/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const success = await notificationService.deleteNotification(id, req.user._id);
  
  if (!success) {
    return sendError(res, 404, 'Notifica non trovata');
  }
  
  return sendSuccess(res, 200, 'Notifica eliminata con successo');
});

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
}; 