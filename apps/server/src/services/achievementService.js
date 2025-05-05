const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const notificationService = require('./notificationService');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Ottiene tutti gli achievement disponibili
 * @param {Object} filters - Filtri opzionali
 * @returns {Promise<Array>} - Lista degli achievement
 */
const getAllAchievements = async (filters = {}) => {
  const query = {};
  
  // Applica filtri se disponibili
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.rarity) {
    query.rarity = filters.rarity;
  }
  
  if (filters.isHidden === false) {
    query.isHidden = false;
  }
  
  const achievements = await Achievement.find(query).sort({ category: 1, rarity: 1 });
  return achievements;
};

/**
 * Ottiene gli achievement di un utente
 * @param {string} userId - ID dell'utente
 * @param {Object} options - Opzioni di paginazione
 * @returns {Promise<Object>} - Achievement dell'utente e conteggio
 */
const getUserAchievements = async (userId, options = {}) => {
  const { skip = 0, limit = 50 } = options;
  
  const userAchievements = await UserAchievement.find({ userId })
    .sort({ earnedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('achievementId');
  
  const total = await UserAchievement.countDocuments({ userId });
  
  return { achievements: userAchievements, total };
};

/**
 * Verifica se l'utente soddisfa i requisiti per ottenere un achievement
 * @param {string} userId - ID dell'utente
 * @param {Object} achievement - Achievement da verificare
 * @param {Object} stats - Statistiche dell'utente
 * @returns {Promise<boolean>} - True se l'utente soddisfa i requisiti
 */
const checkAchievementRequirements = async (userId, achievement, stats) => {
  // Ottieni il valore rilevante dalle statistiche
  const userValue = getValueFromPath(stats, achievement.requirements.field);
  
  if (userValue === undefined) {
    return false;
  }
  
  // Confronta in base all'operazione
  switch (achievement.requirements.operation) {
    case 'greater':
      return userValue > achievement.requirements.value;
    case 'greaterEqual':
      return userValue >= achievement.requirements.value;
    case 'equal':
      return userValue === achievement.requirements.value;
    case 'lessEqual':
      return userValue <= achievement.requirements.value;
    case 'less':
      return userValue < achievement.requirements.value;
    default:
      return false;
  }
};

/**
 * Assegna un achievement a un utente
 * @param {string} userId - ID dell'utente
 * @param {string} achievementId - ID dell'achievement 
 * @param {Object} triggerEvent - Informazioni sull'evento che ha triggerato l'achievement
 * @returns {Promise<Object>} - Achievement assegnato
 */
const awardAchievement = async (userId, achievementId, triggerEvent = { type: 'other' }) => {
  const achievement = await Achievement.findById(achievementId);
  if (!achievement) {
    throw new Error('Achievement non trovato');
  }
  
  // Verifica se l'utente ha già ottenuto questo achievement
  const existingAchievement = await UserAchievement.findOne({
    userId,
    achievementCode: achievement.code
  });
  
  if (existingAchievement) {
    return existingAchievement;
  }
  
  // Crea il nuovo achievement utente
  const userAchievement = new UserAchievement({
    userId,
    achievementId,
    achievementCode: achievement.code,
    earnedAt: new Date(),
    triggerEvent
  });
  
  await userAchievement.save();
  
  // Crea una notifica per l'utente
  try {
    await notificationService.createNotification({
      recipient: userId,
      sender: userId, // Auto-notification
      type: 'achievement',
      content: {
        text: `Hai sbloccato l'achievement "${achievement.name}"`,
        achievementId: achievement._id
      }
    });
  } catch (error) {
    console.error('Errore durante la creazione della notifica:', error);
  }
  
  return userAchievement;
};

/**
 * Controlla gli achievement per un utente
 * @param {string} userId - ID dell'utente
 * @param {Object} stats - Statistiche dell'utente (opzionale)
 * @returns {Promise<Array>} - Achievement sbloccati
 */
const checkAchievementsForUser = async (userId, stats = null) => {
  // Se stats non è fornito, ottieni le statistiche dell'utente
  if (!stats) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utente non trovato');
    }
    stats = user.statistics;
  }
  
  // Ottieni tutti gli achievement disponibili
  const achievements = await Achievement.find({ isHidden: false });
  
  // Ottieni gli achievement già ottenuti dall'utente
  const userAchievements = await UserAchievement.find({ userId }).select('achievementCode');
  const earnedCodes = userAchievements.map(ua => ua.achievementCode);
  
  const newlyEarnedAchievements = [];
  
  // Controlla ogni achievement non ancora ottenuto
  for (const achievement of achievements) {
    if (!earnedCodes.includes(achievement.code)) {
      const isEarned = await checkAchievementRequirements(userId, achievement, stats);
      
      if (isEarned) {
        const userAchievement = await awardAchievement(userId, achievement._id, {
          type: 'other',
          details: 'Controllo automatico'
        });
        
        newlyEarnedAchievements.push(userAchievement);
      }
    }
  }
  
  return newlyEarnedAchievements;
};

/**
 * Marca un achievement come visualizzato dall'utente
 * @param {string} userId - ID dell'utente
 * @param {string} userAchievementId - ID dell'achievement dell'utente
 * @returns {Promise<Object>} - Achievement aggiornato
 */
const markAchievementAsSeen = async (userId, userAchievementId) => {
  const userAchievement = await UserAchievement.findOne({
    _id: userAchievementId,
    userId
  });
  
  if (!userAchievement) {
    throw new Error('Achievement non trovato');
  }
  
  userAchievement.isSeen = true;
  await userAchievement.save();
  
  return userAchievement;
};

/**
 * Utility per ottenere un valore da un oggetto usando una path
 * @param {Object} obj - Oggetto da cui estrarre il valore
 * @param {string} path - Path nel formato "prop1.prop2.prop3"
 * @returns {*} - Valore trovato o undefined
 */
const getValueFromPath = (obj, path) => {
  if (!obj || !path) {
    return undefined;
  }
  
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return undefined;
    }
    value = value[key];
  }
  
  return value;
};

module.exports = {
  getAllAchievements,
  getUserAchievements,
  checkAchievementRequirements,
  awardAchievement,
  checkAchievementsForUser,
  markAchievementAsSeen
}; 