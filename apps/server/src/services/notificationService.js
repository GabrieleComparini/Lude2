const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Crea una nuova notifica
 * @param {Object} data - I dati della notifica
 * @returns {Promise<Object>} La notifica creata
 */
const createNotification = async (data) => {
  // Verifica le preferenze dell'utente per questo tipo di notifica
  const recipient = await User.findById(data.recipient);
  
  if (!recipient) {
    throw new Error('Utente destinatario non trovato');
  }
  
  // Controlla le preferenze dell'utente per questo tipo di notifica
  let shouldNotify = true;
  
  switch (data.type) {
    case 'follow':
      shouldNotify = recipient.preferences?.notifications?.newFollower ?? true;
      break;
    case 'comment':
      shouldNotify = recipient.preferences?.notifications?.trackComment ?? true;
      break;
    case 'reaction':
      shouldNotify = recipient.preferences?.notifications?.trackReaction ?? true;
      break;
    case 'achievement':
      shouldNotify = recipient.preferences?.notifications?.achievementUnlocked ?? true;
      break;
    // Per 'mention' e 'system' notifica sempre
    default:
      shouldNotify = true;
  }
  
  // Se l'utente non vuole essere notificato, esci
  if (!shouldNotify) {
    return null;
  }
  
  // Non notificare se l'utente manda una notifica a se stesso
  if (data.sender && data.sender.toString() === data.recipient.toString()) {
    return null;
  }
  
  // Crea la notifica
  const notification = new Notification(data);
  await notification.save();
  
  return notification;
};

/**
 * Ottiene le notifiche di un utente
 * @param {string} userId - L'ID dell'utente
 * @param {Object} options - Opzioni di paginazione e filtri
 * @returns {Promise<Object>} { notifications, total }
 */
const getUserNotifications = async (userId, options) => {
  const { skip = 0, limit = 20, unreadOnly = false } = options;
  
  const query = { recipient: userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  const notifications = await Notification.find(query)
    .populate('sender', 'username name profileImage')
    .populate('content.trackId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Notification.countDocuments(query);
  
  return { notifications, total };
};

/**
 * Segna una notifica come letta
 * @param {string} notificationId - L'ID della notifica
 * @param {string} userId - L'ID dell'utente
 * @returns {Promise<Object>} La notifica aggiornata
 */
const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );
  
  return notification;
};

/**
 * Segna tutte le notifiche di un utente come lette
 * @param {string} userId - L'ID dell'utente
 * @returns {Promise<Object>} Risultato dell'operazione
 */
const markAllNotificationsAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
  
  return {
    success: true,
    modifiedCount: result.nModified
  };
};

/**
 * Elimina una notifica
 * @param {string} notificationId - L'ID della notifica
 * @param {string} userId - L'ID dell'utente
 * @returns {Promise<boolean>} True se l'eliminazione ha avuto successo
 */
const deleteNotification = async (notificationId, userId) => {
  const result = await Notification.deleteOne({
    _id: notificationId,
    recipient: userId
  });
  
  return result.deletedCount > 0;
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
}; 