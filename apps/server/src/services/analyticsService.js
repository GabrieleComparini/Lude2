const Track = require('../models/Track');
const User = require('../models/User');
const mongoose = require('mongoose');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, format, startOfMonth, endOfMonth, addWeeks, addMonths, subMonths } = require('date-fns');
const { it } = require('date-fns/locale');

/**
 * Ottiene statistiche di riepilogo per un utente
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Object>} - Statistiche di riepilogo
 */
const getUserSummaryStats = async (userId) => {
  // Ottieni l'utente con statistiche già calcolate
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('Utente non trovato');
  }
  
  // Se le statistiche sono già nel modello, restituiscile
  if (user.statistics) {
    return user.statistics;
  }
  
  // Altrimenti calcola le statistiche dalle tracce
  const stats = await calculateUserStats(userId);
  return stats;
};

/**
 * Calcola statistiche dettagliate per un utente dalle sue tracce
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Object>} - Statistiche calcolate
 */
const calculateUserStats = async (userId) => {
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: null,
        totalDistance: { $sum: '$stats.distance' },
        totalTime: { $sum: '$duration' },
        totalTracks: { $sum: 1 },
        maxSpeed: { $max: '$stats.maxSpeed' },
        // Altri aggregati secondo necessità
      }
    },
    {
      $project: {
        _id: 0,
        totalDistance: 1,
        totalTime: 1,
        totalTracks: 1,
        maxSpeed: 1,
        avgSpeed: {
          $cond: [
            { $eq: ['$totalTime', 0] },
            0,
            { $divide: ['$totalDistance', '$totalTime'] }
          ]
        }
      }
    }
  ];
  
  const results = await Track.aggregate(pipeline);
  
  return results.length > 0 ? results[0] : {
    totalDistance: 0,
    totalTime: 0,
    totalTracks: 0,
    maxSpeed: 0,
    avgSpeed: 0
  };
};

/**
 * Ottiene i dati per i grafici di trend (distanza, velocità, ecc.) per un periodo specifico
 * @param {string} userId - ID dell'utente
 * @param {string} period - Periodo ('week', 'month', 'year')
 * @param {Date} endDate - Data di fine per il periodo (default: oggi)
 * @returns {Promise<Object>} - Dati per i grafici
 */
const getUserTrends = async (userId, period = 'week', endDate = new Date()) => {
  // Determina intervalli e formato in base al periodo
  let intervalField, format, numIntervals, intervalFunc, startDate;
  
  switch (period) {
    case 'week':
      // Dati giornalieri per una settimana
      intervalField = { $dayOfWeek: '$startTime' };
      format = '%Y-%m-%d';
      numIntervals = 7;
      intervalFunc = addWeeks;
      startDate = startOfWeek(endDate, { locale: it, weekStartsOn: 1 });
      break;
      
    case 'month':
      // Dati settimanali per un mese
      intervalField = { $week: '$startTime' };
      format = '%Y-W%U';
      numIntervals = 4; // Circa 4 settimane
      intervalFunc = addMonths;
      startDate = startOfMonth(endDate);
      break;
      
    case 'year':
      // Dati mensili per un anno
      intervalField = { $month: '$startTime' };
      format = '%Y-%m';
      numIntervals = 12;
      intervalFunc = (date, amount) => addMonths(date, amount * 12);
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 11); // 12 mesi, incluso il mese corrente
      startDate.setDate(1);
      break;
      
    default:
      throw new Error(`Periodo non supportato: ${period}`);
  }
  
  // Pipeline di aggregazione per ottenere i dati di trend
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        startTime: { $gte: startDate, $lte: endOfDay(endDate) }
      }
    },
    {
      $group: {
        _id: {
          interval: intervalField,
          date: { $dateToString: { format, date: '$startTime' } }
        },
        totalDistance: { $sum: '$stats.distance' },
        totalTime: { $sum: '$duration' },
        totalTracks: { $sum: 1 },
        avgSpeed: { $avg: '$stats.avgSpeed' },
        maxSpeed: { $max: '$stats.maxSpeed' }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ];
  
  const results = await Track.aggregate(pipeline);
  
  // Formatta i risultati in serie temporali
  return formatTrendData(results, period, startDate, endDate);
};

/**
 * Formatta i dati di trend per renderli utilizzabili dai grafici
 * @param {Array} results - Risultati dell'aggregazione
 * @param {string} period - Periodo ('week', 'month', 'year')
 * @param {Date} startDate - Data di inizio
 * @param {Date} endDate - Data di fine
 * @returns {Object} - Dati formattati per i grafici
 */
const formatTrendData = (results, period, startDate, endDate) => {
  // Prepara struttura dati
  const trendData = {
    distance: {
      labels: [],
      data: []
    },
    time: {
      labels: [],
      data: []
    },
    tracks: {
      labels: [],
      data: []
    },
    speed: {
      labels: [],
      data: []
    }
  };
  
  // Crea un indice per accesso rapido ai risultati
  const resultMap = {};
  results.forEach(item => {
    resultMap[item._id.date] = item;
  });
  
  // Genera etichette e riempie i dati in base al periodo
  let currentDate = new Date(startDate);
  
  switch (period) {
    case 'week':
      // Etichette giornaliere: "Lun", "Mar", ...
      for (let i = 0; i < 7; i++) {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        const dayLabel = format(currentDate, 'EEE', { locale: it }).charAt(0).toUpperCase() + format(currentDate, 'EEE', { locale: it }).slice(1, 3);
        
        trendData.distance.labels.push(dayLabel);
        trendData.time.labels.push(dayLabel);
        trendData.tracks.labels.push(dayLabel);
        trendData.speed.labels.push(dayLabel);
        
        const result = resultMap[dateString];
        
        trendData.distance.data.push(result ? result.totalDistance : 0);
        trendData.time.data.push(result ? result.totalTime / 60 : 0); // Conversione in minuti
        trendData.tracks.data.push(result ? result.totalTracks : 0);
        trendData.speed.data.push(result ? result.avgSpeed : 0);
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      break;
      
    case 'month':
      // Etichette settimanali: "Sett 1", "Sett 2", ...
      for (let i = 0; i < 4; i++) {
        const weekNum = format(currentDate, 'w');
        const weekLabel = `Sett ${weekNum}`;
        const weekKey = format(currentDate, 'yyyy') + '-W' + weekNum;
        
        trendData.distance.labels.push(weekLabel);
        trendData.time.labels.push(weekLabel);
        trendData.tracks.labels.push(weekLabel);
        trendData.speed.labels.push(weekLabel);
        
        const result = resultMap[weekKey];
        
        trendData.distance.data.push(result ? result.totalDistance : 0);
        trendData.time.data.push(result ? result.totalTime / 60 : 0); // Conversione in minuti
        trendData.tracks.data.push(result ? result.totalTracks : 0);
        trendData.speed.data.push(result ? result.avgSpeed : 0);
        
        currentDate.setDate(currentDate.getDate() + 7);
      }
      break;
      
    case 'year':
      // Etichette mensili: "Gen", "Feb", ...
      for (let i = 0; i < 12; i++) {
        const monthKey = format(currentDate, 'yyyy-MM');
        const monthLabel = format(currentDate, 'MMM', { locale: it }).charAt(0).toUpperCase() + format(currentDate, 'MMM', { locale: it }).slice(1, 3);
        
        trendData.distance.labels.push(monthLabel);
        trendData.time.labels.push(monthLabel);
        trendData.tracks.labels.push(monthLabel);
        trendData.speed.labels.push(monthLabel);
        
        const result = resultMap[monthKey];
        
        trendData.distance.data.push(result ? result.totalDistance : 0);
        trendData.time.data.push(result ? result.totalTime / 60 : 0); // Conversione in minuti
        trendData.tracks.data.push(result ? result.totalTracks : 0);
        trendData.speed.data.push(result ? result.avgSpeed : 0);
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      break;
  }
  
  return trendData;
};

/**
 * Ottiene i dati per la heatmap delle posizioni
 * @param {string} userId - ID dell'utente
 * @param {Object} bounds - Limiti geografici (opzionale)
 * @param {Object} filters - Filtri aggiuntivi
 * @returns {Promise<Array>} - Punti per la heatmap
 */
const getHeatmapData = async (userId, bounds = null, filters = {}) => {
  const query = { userId: mongoose.Types.ObjectId(userId) };
  
  // Applica filtri temporali se presenti
  if (filters.startDate) {
    query.startTime = { $gte: new Date(filters.startDate) };
  }
  
  if (filters.endDate) {
    if (!query.startTime) query.startTime = {};
    query.startTime.$lte = new Date(filters.endDate);
  }
  
  // Prepara pipeline per estrazione punti geospaziali 
  const pipeline = [
    { $match: query },
    // Estrae solo i punti necessari (inizio, fine, e punti ogni N secondi)
    {
      $project: {
        _id: 1,
        title: 1,
        startPoint: 1,
        endPoint: 1,
        // Implementa sottocampionamento dei punti della rotta per efficienza
        // Questo dipende fortemente dalla struttura dei tuoi dati di rotta
        samplePoints: { $slice: ['$route.coordinates', 0, -1, 10] } // Prende 1 punto ogni 10
      }
    }
  ];
  
  // Aggiungi filtri geografici se i bounds sono forniti
  if (bounds && bounds.northEast && bounds.southWest) {
    // Implementa filtro geografico
  }
  
  const tracks = await Track.aggregate(pipeline);
  
  // Elabora i risultati in un formato adatto per heatmap
  const heatmapPoints = [];
  
  tracks.forEach(track => {
    // Aggiungi punto di inizio (peso maggiore)
    if (track.startPoint && track.startPoint.coordinates) {
      heatmapPoints.push({
        lat: track.startPoint.coordinates[1],
        lng: track.startPoint.coordinates[0],
        weight: 10 // Peso maggiore
      });
    }
    
    // Aggiungi punto di fine (peso maggiore)
    if (track.endPoint && track.endPoint.coordinates) {
      heatmapPoints.push({
        lat: track.endPoint.coordinates[1],
        lng: track.endPoint.coordinates[0],
        weight: 10 // Peso maggiore
      });
    }
    
    // Aggiungi punti campionati dalla rotta (peso minore)
    if (track.samplePoints && Array.isArray(track.samplePoints)) {
      track.samplePoints.forEach(point => {
        if (Array.isArray(point) && point.length >= 2) {
          heatmapPoints.push({
            lat: point[1],
            lng: point[0],
            weight: 3 // Peso minore
          });
        }
      });
    }
  });
  
  return heatmapPoints;
};

/**
 * Esporta i dati di un utente
 * @param {string} userId - ID dell'utente
 * @param {string} format - Formato di esportazione ('json', 'csv', 'gpx')
 * @param {Object} filters - Filtri sui dati da esportare
 * @returns {Promise<Object>} - Dati esportati
 */
const exportUserData = async (userId, format = 'json', filters = {}) => {
  // Ottieni i dati dell'utente
  const user = await User.findById(userId).select('-firebaseUid -role');
  
  if (!user) {
    throw new Error('Utente non trovato');
  }
  
  // Costruisci query per le tracce
  const trackQuery = { userId };
  
  if (filters.startDate) {
    trackQuery.startTime = { $gte: new Date(filters.startDate) };
  }
  
  if (filters.endDate) {
    if (!trackQuery.startTime) trackQuery.startTime = {};
    trackQuery.startTime.$lte = new Date(filters.endDate);
  }
  
  // Ottieni le tracce dell'utente
  const tracks = await Track.find(trackQuery)
    .sort({ startTime: -1 })
    .limit(filters.limit || 1000); // Limita il numero di tracce per performance
  
  // Esporta in base al formato richiesto
  switch (format.toLowerCase()) {
    case 'json':
      return formatExportJson(user, tracks);
      
    case 'csv':
      return formatExportCsv(user, tracks);
      
    case 'gpx':
      return formatExportGpx(user, tracks);
      
    default:
      throw new Error(`Formato di esportazione non supportato: ${format}`);
  }
};

/**
 * Formatta l'esportazione in JSON
 * @param {Object} user - Dati utente
 * @param {Array} tracks - Tracce dell'utente
 * @returns {Object} - Dati formattati
 */
const formatExportJson = (user, tracks) => {
  // Semplice conversione in JSON dell'oggetto
  return {
    user: user.toObject(),
    tracks: tracks.map(track => track.toObject()),
    exportDate: new Date(),
    format: 'json'
  };
};

/**
 * Formatta l'esportazione in CSV (per tracce)
 * @param {Object} user - Dati utente
 * @param {Array} tracks - Tracce dell'utente
 * @returns {Object} - Dati CSV
 */
const formatExportCsv = (user, tracks) => {
  // Intestazioni CSV per i dati delle tracce
  let csv = 'ID,Titolo,Data,Distanza (km),Durata (min),Velocità Media (km/h),Velocità Massima (km/h)\n';
  
  // Aggiungi righe per ogni traccia
  tracks.forEach(track => {
    csv += `${track._id},`;
    csv += `"${(track.title || '').replace(/"/g, '""')}",`;
    csv += `${track.startTime.toISOString()},`;
    csv += `${track.stats.distance},`;
    csv += `${track.duration / 60},`; // Conversione in minuti
    csv += `${track.stats.avgSpeed},`;
    csv += `${track.stats.maxSpeed}\n`;
  });
  
  return {
    content: csv,
    filename: `tracks_${user.username}_${format(new Date(), 'yyyy-MM-dd')}.csv`,
    contentType: 'text/csv',
    format: 'csv'
  };
};

/**
 * Formatta l'esportazione in GPX (per tracce)
 * @param {Object} user - Dati utente
 * @param {Array} tracks - Tracce dell'utente
 * @returns {Object} - Dati GPX
 */
const formatExportGpx = (user, tracks) => {
  // Intestazione XML e documento GPX
  let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
  gpx += '<gpx version="1.1" creator="Lude Track Master" xmlns="http://www.topografix.com/GPX/1/1">\n';
  gpx += `<metadata><name>Lude Export - ${user.username}</name><time>${new Date().toISOString()}</time></metadata>\n`;
  
  // Aggiungi ogni traccia
  tracks.forEach(track => {
    gpx += `<trk><name>${escapeXml(track.title || `Track ${track._id}`)}</name>\n`;
    gpx += `<desc>Distance: ${track.stats.distance}km, Duration: ${Math.round(track.duration / 60)}min</desc>\n`;
    gpx += '<trkseg>\n';
    
    // Aggiungi i punti della rotta
    if (track.route && track.route.coordinates && Array.isArray(track.route.coordinates)) {
      track.route.coordinates.forEach(point => {
        if (Array.isArray(point) && point.length >= 2) {
          gpx += `<trkpt lat="${point[1]}" lon="${point[0]}">\n`;
          if (point.length >= 3) {
            gpx += `<ele>${point[2]}</ele>\n`;
          }
          gpx += '</trkpt>\n';
        }
      });
    }
    
    gpx += '</trkseg></trk>\n';
  });
  
  gpx += '</gpx>';
  
  return {
    content: gpx,
    filename: `tracks_${user.username}_${format(new Date(), 'yyyy-MM-dd')}.gpx`,
    contentType: 'application/gpx+xml',
    format: 'gpx'
  };
};

/**
 * Funzione di utilità per l'escape di caratteri XML
 * @param {string} str - Stringa da processare
 * @returns {string} - Stringa con caratteri XML escaped
 */
const escapeXml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

module.exports = {
  getUserSummaryStats,
  getUserTrends,
  getHeatmapData,
  exportUserData
};