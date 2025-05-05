const Challenge = require('../models/Challenge');
const UserChallenge = require('../models/UserChallenge');
const User = require('../models/User');
const achievementService = require('./achievementService');
const notificationService = require('./notificationService');
const mongoose = require('mongoose');

/**
 * Ottiene le sfide filtrate per vari parametri
 * @param {Object} filters - Filtri (stato, tipo, difficoltà, ecc.)
 * @param {Object} options - Opzioni di paginazione e ordinamento
 * @returns {Promise<Object>} - Sfide e conteggio totale
 */
const getChallenges = async (filters = {}, options = {}) => {
  const { skip = 0, limit = 20, sort = { startDate: -1 } } = options;
  
  const query = {};
  
  // Filtri di base
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.type) {
    query.type = filters.type;
  }
  
  if (filters.difficulty) {
    query.difficulty = filters.difficulty;
  }
  
  if (filters.isSpecial !== undefined) {
    query.isSpecial = filters.isSpecial;
  }
  
  // Filtra per periodo attivo
  if (filters.activeNow) {
    const now = new Date();
    query.$and = [
      { 'period.startDate': { $lte: now } },
      { 'period.endDate': { $gte: now } }
    ];
  }
  
  // Filtra per veicolo
  if (filters.vehicleType) {
    query.$or = [
      { vehicleTypes: filters.vehicleType },
      { vehicleTypes: 'qualsiasi' }
    ];
  }
  
  // Cerca per tag
  if (filters.tag) {
    query.tags = filters.tag;
  }
  
  // Cerca per creatore
  if (filters.createdBy) {
    query.createdBy = filters.createdBy;
  }
  
  const challenges = await Challenge.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'username name profileImage');
  
  const total = await Challenge.countDocuments(query);
  
  return { challenges, total };
};

/**
 * Ottiene le sfide a cui un utente partecipa
 * @param {string} userId - ID dell'utente
 * @param {string} status - Stato di partecipazione (attiva, completata, ecc.)
 * @param {Object} options - Opzioni di paginazione
 * @returns {Promise<Object>} - Partecipazioni alle sfide e conteggio
 */
const getUserChallenges = async (userId, status = null, options = {}) => {
  const { skip = 0, limit = 20 } = options;
  
  const query = { userId };
  
  if (status) {
    query.status = status;
  }
  
  const userChallenges = await UserChallenge.find(query)
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'challengeId',
      populate: {
        path: 'createdBy',
        select: 'username name profileImage'
      }
    });
  
  const total = await UserChallenge.countDocuments(query);
  
  return { userChallenges, total };
};

/**
 * Ottiene i dettagli di una specifica sfida
 * @param {string} challengeId - ID della sfida
 * @returns {Promise<Object>} - Dettagli della sfida
 */
const getChallengeById = async (challengeId) => {
  if (!mongoose.Types.ObjectId.isValid(challengeId)) {
    throw new Error('ID sfida non valido');
  }
  
  const challenge = await Challenge.findById(challengeId)
    .populate('createdBy', 'username name profileImage');
  
  if (!challenge) {
    throw new Error('Sfida non trovata');
  }
  
  return challenge;
};

/**
 * Partecipa a una sfida
 * @param {string} userId - ID dell'utente
 * @param {string} challengeId - ID della sfida
 * @returns {Promise<Object>} - Partecipazione creata
 */
const joinChallenge = async (userId, challengeId) => {
  const challenge = await getChallengeById(challengeId);
  
  // Verifica che la sfida sia attiva
  if (challenge.status !== 'attiva') {
    throw new Error('Non è possibile partecipare a una sfida non attiva');
  }
  
  // Verifica che la sfida non sia già finita
  const now = new Date();
  if (now > challenge.period.endDate && !challenge.period.isAlwaysActive) {
    throw new Error('La sfida è già terminata');
  }
  
  // Verifica che non abbia già raggiunto il numero massimo di partecipanti
  if (challenge.maxParticipants) {
    const currentParticipants = await UserChallenge.countDocuments({ challengeId });
    if (currentParticipants >= challenge.maxParticipants) {
      throw new Error('La sfida ha già raggiunto il numero massimo di partecipanti');
    }
  }
  
  // Verifica che l'utente non sia già iscritto
  const existingParticipation = await UserChallenge.findOne({
    userId,
    challengeId
  });
  
  if (existingParticipation) {
    throw new Error('Sei già iscritto a questa sfida');
  }
  
  // Crea la partecipazione
  const userChallenge = new UserChallenge({
    userId,
    challengeId,
    joinedAt: now,
    status: 'attiva',
    lastActivity: now
  });
  
  await userChallenge.save();
  
  return userChallenge;
};

/**
 * Abbandona una sfida
 * @param {string} userId - ID dell'utente
 * @param {string} challengeId - ID della sfida
 * @returns {Promise<Object>} - Risultato dell'operazione
 */
const leaveChallenge = async (userId, challengeId) => {
  const userChallenge = await UserChallenge.findOne({
    userId,
    challengeId
  });
  
  if (!userChallenge) {
    throw new Error('Non sei iscritto a questa sfida');
  }
  
  if (userChallenge.status === 'completata') {
    throw new Error('Non puoi abbandonare una sfida già completata');
  }
  
  userChallenge.status = 'abbandonata';
  await userChallenge.save();
  
  return { success: true, message: 'Hai abbandonato la sfida con successo' };
};

/**
 * Aggiorna il progresso di una sfida per un utente
 * @param {string} userId - ID dell'utente
 * @param {string} challengeId - ID della sfida
 * @param {Object} trackData - Dati della traccia che contribuisce al progresso
 * @returns {Promise<Object>} - Progresso aggiornato
 */
const updateChallengeProgress = async (userId, challengeId, trackData) => {
  const userChallenge = await UserChallenge.findOne({
    userId,
    challengeId,
    status: 'attiva'
  });
  
  if (!userChallenge) {
    // La sfida non è attiva per questo utente
    return null;
  }
  
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error('Sfida non trovata');
  }
  
  // Calcola il contributo di questa traccia al progresso
  let contribution = 0;
  
  // Estraiamo il valore dalla traccia in base al campo da misurare
  switch (challenge.goal.metricField) {
    case 'distance':
      contribution = trackData.distance || 0;
      break;
    case 'duration':
      contribution = trackData.duration || 0;
      break;
    case 'count':
      contribution = 1; // Ogni traccia conta come 1
      break;
    case 'maxSpeed':
      contribution = trackData.maxSpeed || 0;
      break;
    // Aggiungi altri casi secondo necessità
    default:
      contribution = 0;
  }
  
  if (contribution <= 0) {
    return userChallenge; // Nessun contributo, nessun aggiornamento
  }
  
  // Aggiorna il progresso nella sfida
  await userChallenge.updateProgress({
    trackId: trackData._id,
    contribution
  }, challenge.goal);
  
  // Se la sfida è stata completata, assegna la ricompensa
  if (userChallenge.status === 'completata' && !userChallenge.rewardClaimed) {
    await awardChallengeReward(userId, challengeId);
    userChallenge.rewardClaimed = true;
    await userChallenge.save();
  }
  
  return userChallenge;
};

/**
 * Assegna la ricompensa di una sfida completata
 * @param {string} userId - ID dell'utente
 * @param {string} challengeId - ID della sfida
 * @returns {Promise<Object>} - Ricompensa assegnata
 */
const awardChallengeReward = async (userId, challengeId) => {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error('Sfida non trovata');
  }
  
  const rewards = { xpPoints: 0, achievements: [] };
  
  // Assegna punti XP
  if (challenge.reward.xpPoints) {
    // Implementa logica per assegnare XP all'utente
    rewards.xpPoints = challenge.reward.xpPoints;
    // TODO: Aggiornare i punti XP dell'utente quando il modello User avrà questo campo
  }
  
  // Assegna achievement se presente
  if (challenge.reward.achievementId) {
    try {
      const userAchievement = await achievementService.awardAchievement(
        userId,
        challenge.reward.achievementId,
        {
          type: 'challenge',
          id: challengeId,
          details: `Completamento sfida: ${challenge.title}`
        }
      );
      
      rewards.achievements.push(userAchievement);
    } catch (error) {
      console.error('Errore nell\'assegnazione dell\'achievement:', error);
    }
  }
  
  // Crea notifica di completamento sfida
  try {
    await notificationService.createNotification({
      recipient: userId,
      sender: userId, // Auto-notification
      type: 'system',
      content: {
        text: `Hai completato la sfida "${challenge.title}" e ricevuto ${rewards.xpPoints} XP!`
      }
    });
  } catch (error) {
    console.error('Errore nella creazione della notifica:', error);
  }
  
  return rewards;
};

/**
 * Ottiene la classifica di una sfida
 * @param {string} challengeId - ID della sfida
 * @param {Object} options - Opzioni di paginazione
 * @returns {Promise<Object>} - Classifica della sfida
 */
const getChallengeLeaderboard = async (challengeId, options = {}) => {
  const { skip = 0, limit = 20 } = options;
  
  // Verifica che la sfida esista
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error('Sfida non trovata');
  }
  
  // Ottieni i partecipanti ordinati per progresso
  const participants = await UserChallenge.find({ challengeId })
    .sort({ 'progress.percentage': -1, 'progress.currentValue': -1, completedAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'username name profileImage');
  
  const total = await UserChallenge.countDocuments({ challengeId });
  
  // Formatta i risultati
  const leaderboard = participants.map((p, index) => ({
    rank: skip + index + 1,
    user: p.userId,
    progress: p.progress,
    completedAt: p.completedAt,
    status: p.status
  }));
  
  return { leaderboard, total };
};

module.exports = {
  getChallenges,
  getUserChallenges,
  getChallengeById,
  joinChallenge,
  leaveChallenge,
  updateChallengeProgress,
  awardChallengeReward,
  getChallengeLeaderboard
}; 