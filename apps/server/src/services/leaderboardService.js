const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');
const Track = require('../models/Track');
const mongoose = require('mongoose');
const { startOfWeek, endOfWeek, format, startOfMonth, endOfMonth, startOfYear, endOfYear } = require('date-fns');
const { it } = require('date-fns/locale');

/**
 * Ottiene una classifica esistente
 * @param {string} type - Tipo di classifica (total_distance, avg_speed, ecc.)
 * @param {string} period - Periodo (daily, weekly, monthly, yearly, all_time)
 * @param {string} periodId - Identificativo del periodo (2023-W42, 2023-05, ecc.)
 * @param {string} scope - Ambito geografico (global, national, regional, city)
 * @param {string} geoCode - Codice geografico (IT, IT-25, ecc.)
 * @returns {Promise<Object>} - Classifica trovata o null se non esiste
 */
const getLeaderboard = async (type, period, periodId, scope = 'global', geoCode = null) => {
  const query = {
    type,
    period,
    periodId,
    scope
  };
  
  if (geoCode) {
    query.geoCode = geoCode;
  }
  
  const leaderboard = await Leaderboard.findOne(query);
  return leaderboard;
};

/**
 * Ottiene o genera una classifica
 * @param {string} type - Tipo di classifica
 * @param {string} period - Periodo
 * @param {Date} date - Data di riferimento per determinare il periodo
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<Object>} - Classifica
 */
const getOrGenerateLeaderboard = async (type, period, date = new Date(), options = {}) => {
  const { scope = 'global', geoCode = null, forceRefresh = false } = options;
  
  // Determina l'ID del periodo e le date di inizio/fine
  const { periodId, startDate, endDate } = getPeriodDates(period, date);
  
  // Cerca una classifica esistente
  let leaderboard = null;
  
  if (!forceRefresh) {
    leaderboard = await getLeaderboard(type, period, periodId, scope, geoCode);
    
    // Se esiste, è valida e aggiornata, restituiscila
    if (leaderboard && leaderboard.isValid && period !== 'daily') {
      // Per periodi diversi da 'daily' consideriamo la classifica valida
      // a meno che non sia richiesto un aggiornamento forzato
      return leaderboard;
    }
  }
  
  // Genera una nuova classifica
  leaderboard = await generateLeaderboard(type, period, startDate, endDate, {
    periodId,
    scope,
    geoCode,
    existingLeaderboardId: leaderboard?._id
  });
  
  return leaderboard;
};

/**
 * Genera una nuova classifica
 * @param {string} type - Tipo di classifica
 * @param {string} period - Periodo
 * @param {Date} startDate - Data di inizio periodo
 * @param {Date} endDate - Data di fine periodo
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<Object>} - Classifica generata
 */
const generateLeaderboard = async (type, period, startDate, endDate, options = {}) => {
  const { 
    periodId, 
    scope = 'global', 
    geoCode = null, 
    limit = 100,
    existingLeaderboardId = null
  } = options;
  
  // Imposta la classifica come non valida durante l'aggiornamento
  if (existingLeaderboardId) {
    await Leaderboard.findByIdAndUpdate(existingLeaderboardId, {
      isValid: false
    });
  }
  
  // Ottieni i dati necessari per la classifica
  let entries = [];
  
  switch (type) {
    case 'total_distance':
      entries = await getTotalDistanceLeaderboard(startDate, endDate, scope, geoCode, limit);
      break;
    case 'total_tracks':
      entries = await getTotalTracksLeaderboard(startDate, endDate, scope, geoCode, limit);
      break;
    case 'avg_speed':
      entries = await getAvgSpeedLeaderboard(startDate, endDate, scope, geoCode, limit);
      break;
    case 'max_speed':
      entries = await getMaxSpeedLeaderboard(startDate, endDate, scope, geoCode, limit);
      break;
    // Aggiungi altri casi secondo necessità
    default:
      throw new Error(`Tipo di classifica non supportato: ${type}`);
  }
  
  // Crea o aggiorna la classifica
  let leaderboard;
  
  if (existingLeaderboardId) {
    // Calcola variazioni di posizione rispetto alla classifica precedente
    const previousLeaderboard = await Leaderboard.findById(existingLeaderboardId);
    
    if (previousLeaderboard && previousLeaderboard.entries && previousLeaderboard.entries.length > 0) {
      entries = calculateRankChanges(entries, previousLeaderboard.entries);
    }
    
    // Aggiorna la classifica esistente
    leaderboard = await Leaderboard.findByIdAndUpdate(
      existingLeaderboardId,
      {
        entries,
        startDate,
        endDate,
        updatedAt: new Date(),
        isValid: true
      },
      { new: true }
    );
  } else {
    // Crea una nuova classifica
    leaderboard = new Leaderboard({
      type,
      period,
      periodId,
      startDate,
      endDate,
      scope,
      geoCode,
      limit,
      entries,
      isValid: true
    });
    
    await leaderboard.save();
  }
  
  return leaderboard;
};

/**
 * Genera una classifica per distanza totale
 * @param {Date} startDate - Data di inizio periodo
 * @param {Date} endDate - Data di fine periodo
 * @param {string} scope - Ambito geografico
 * @param {string} geoCode - Codice geografico
 * @param {number} limit - Limite di risultati
 * @returns {Promise<Array>} - Entries della classifica
 */
const getTotalDistanceLeaderboard = async (startDate, endDate, scope, geoCode, limit) => {
  // Aggrega i dati delle tracce per calcolare la distanza totale per utente
  const pipeline = [
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
        // Aggiungi filtri geografici se necessario
      }
    },
    {
      $group: {
        _id: '$userId',
        totalDistance: { $sum: '$stats.distance' }
      }
    },
    {
      $sort: { totalDistance: -1 }
    },
    {
      $limit: limit
    }
  ];
  
  // Applica filtri geografici se necessario
  if (scope !== 'global' && geoCode) {
    // TODO: Implementa filtri geografici quando sarà disponibile questa informazione
  }
  
  const results = await Track.aggregate(pipeline);
  
  // Arricchisci i risultati con i dati degli utenti
  const enrichedEntries = await enrichLeaderboardEntries(results, '_id', 'totalDistance');
  
  return enrichedEntries;
};

/**
 * Genera una classifica per numero totale di tracce
 * @param {Date} startDate - Data di inizio periodo
 * @param {Date} endDate - Data di fine periodo
 * @param {string} scope - Ambito geografico
 * @param {string} geoCode - Codice geografico
 * @param {number} limit - Limite di risultati
 * @returns {Promise<Array>} - Entries della classifica
 */
const getTotalTracksLeaderboard = async (startDate, endDate, scope, geoCode, limit) => {
  // Aggrega i dati delle tracce per contare il numero di tracce per utente
  const pipeline = [
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
        // Aggiungi filtri geografici se necessario
      }
    },
    {
      $group: {
        _id: '$userId',
        totalTracks: { $sum: 1 }
      }
    },
    {
      $sort: { totalTracks: -1 }
    },
    {
      $limit: limit
    }
  ];
  
  // Applica filtri geografici se necessario
  if (scope !== 'global' && geoCode) {
    // TODO: Implementa filtri geografici quando sarà disponibile questa informazione
  }
  
  const results = await Track.aggregate(pipeline);
  
  // Arricchisci i risultati con i dati degli utenti
  const enrichedEntries = await enrichLeaderboardEntries(results, '_id', 'totalTracks');
  
  return enrichedEntries;
};

/**
 * Genera una classifica per velocità media
 * @param {Date} startDate - Data di inizio periodo
 * @param {Date} endDate - Data di fine periodo
 * @param {string} scope - Ambito geografico
 * @param {string} geoCode - Codice geografico
 * @param {number} limit - Limite di risultati
 * @returns {Promise<Array>} - Entries della classifica
 */
const getAvgSpeedLeaderboard = async (startDate, endDate, scope, geoCode, limit) => {
  // Aggrega i dati delle tracce per calcolare la velocità media per utente
  const pipeline = [
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
        // Filtra tracce con durata > 0 per evitare divisioni per zero
        duration: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: '$userId',
        totalDistance: { $sum: '$stats.distance' },
        totalDuration: { $sum: '$duration' },
        trackCount: { $sum: 1 }
      }
    },
    {
      // Calcola la velocità media complessiva
      $project: {
        _id: 1,
        avgSpeed: { 
          $cond: [
            { $gt: ['$totalDuration', 0] },
            { $divide: ['$totalDistance', '$totalDuration'] }, 
            0
          ]
        },
        trackCount: 1
      }
    },
    {
      // Filtra utenti con almeno 3 tracce (per dati più significativi)
      $match: {
        trackCount: { $gte: 3 }
      }
    },
    {
      $sort: { avgSpeed: -1 }
    },
    {
      $limit: limit
    }
  ];
  
  const results = await Track.aggregate(pipeline);
  
  // Arricchisci i risultati con i dati degli utenti
  const enrichedEntries = await enrichLeaderboardEntries(results, '_id', 'avgSpeed');
  
  return enrichedEntries;
};

/**
 * Genera una classifica per velocità massima
 * @param {Date} startDate - Data di inizio periodo
 * @param {Date} endDate - Data di fine periodo
 * @param {string} scope - Ambito geografico
 * @param {string} geoCode - Codice geografico
 * @param {number} limit - Limite di risultati
 * @returns {Promise<Array>} - Entries della classifica
 */
const getMaxSpeedLeaderboard = async (startDate, endDate, scope, geoCode, limit) => {
  // Aggrega i dati delle tracce per trovare la velocità massima per utente
  const pipeline = [
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$userId',
        maxSpeed: { $max: '$stats.maxSpeed' }
      }
    },
    {
      $sort: { maxSpeed: -1 }
    },
    {
      $limit: limit
    }
  ];
  
  const results = await Track.aggregate(pipeline);
  
  // Arricchisci i risultati con i dati degli utenti
  const enrichedEntries = await enrichLeaderboardEntries(results, '_id', 'maxSpeed');
  
  return enrichedEntries;
};

/**
 * Arricchisce le voci della classifica con i dati degli utenti
 * @param {Array} entries - Entries da arricchire
 * @param {string} userIdField - Nome del campo che contiene l'ID utente
 * @param {string} valueField - Nome del campo che contiene il valore
 * @returns {Promise<Array>} - Entries arricchite
 */
const enrichLeaderboardEntries = async (entries, userIdField, valueField) => {
  // Estrai gli ID utente
  const userIds = entries.map(entry => entry[userIdField]);
  
  // Ottieni i dati degli utenti
  const users = await User.find({ _id: { $in: userIds } })
    .select('_id username name profileImage');
  
  // Crea una mappa degli utenti per accesso rapido
  const userMap = {};
  users.forEach(user => {
    userMap[user._id.toString()] = user;
  });
  
  // Arricchisci le voci della classifica
  const enrichedEntries = entries.map((entry, index) => {
    const userId = entry[userIdField];
    const user = userMap[userId.toString()];
    
    if (!user) {
      return null; // Salta utenti non trovati
    }
    
    return {
      userId: user._id,
      username: user.username,
      name: user.name || '',
      profileImage: user.profileImage || '',
      rank: index + 1,
      value: entry[valueField],
      change: 0 // Verrà aggiornato con calculateRankChanges se necessario
    };
  }).filter(entry => entry !== null); // Rimuovi elementi null
  
  return enrichedEntries;
};

/**
 * Calcola le variazioni di posizione rispetto alla classifica precedente
 * @param {Array} currentEntries - Entries attuali
 * @param {Array} previousEntries - Entries precedenti
 * @returns {Array} - Entries con variazioni di posizione
 */
const calculateRankChanges = (currentEntries, previousEntries) => {
  // Crea una mappa delle posizioni precedenti
  const previousRanks = {};
  previousEntries.forEach(entry => {
    previousRanks[entry.userId.toString()] = entry.rank;
  });
  
  // Calcola le variazioni
  return currentEntries.map(entry => {
    const previousRank = previousRanks[entry.userId.toString()];
    
    if (previousRank) {
      // Differenza tra vecchia e nuova posizione
      // Nota: posizione più bassa = migliore
      // Quindi, se previousRank > entry.rank, l'utente è migliorato
      entry.change = previousRank - entry.rank;
    } else {
      // Nuovo nella classifica
      entry.change = 0;
    }
    
    return entry;
  });
};

/**
 * Determina l'ID del periodo e le date di inizio/fine
 * @param {string} period - Periodo (daily, weekly, monthly, yearly, all_time)
 * @param {Date} date - Data di riferimento
 * @returns {Object} - ID del periodo e date di inizio/fine
 */
const getPeriodDates = (period, date) => {
  let periodId, startDate, endDate;
  
  switch (period) {
    case 'daily':
      // Formato: 2023-05-15
      periodId = format(date, 'yyyy-MM-dd');
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'weekly':
      // Formato: 2023-W20
      const weekStart = startOfWeek(date, { locale: it, weekStartsOn: 1 }); // Settimana inizia lunedì
      const weekEnd = endOfWeek(date, { locale: it, weekStartsOn: 1 });
      periodId = `${format(weekStart, 'yyyy')}-W${format(weekStart, 'ww')}`;
      startDate = weekStart;
      endDate = weekEnd;
      break;
      
    case 'monthly':
      // Formato: 2023-05
      periodId = format(date, 'yyyy-MM');
      startDate = startOfMonth(date);
      endDate = endOfMonth(date);
      break;
      
    case 'yearly':
      // Formato: 2023
      periodId = format(date, 'yyyy');
      startDate = startOfYear(date);
      endDate = endOfYear(date);
      break;
      
    case 'all_time':
      // Formato: all-time
      periodId = 'all-time';
      startDate = new Date(0); // 1970-01-01
      endDate = new Date(); // Now
      break;
      
    default:
      throw new Error(`Periodo non supportato: ${period}`);
  }
  
  return { periodId, startDate, endDate };
};

module.exports = {
  getLeaderboard,
  getOrGenerateLeaderboard,
  generateLeaderboard
}; 