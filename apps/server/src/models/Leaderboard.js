const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leaderboardEntrySchema = new Schema({
  // Utente nella classifica
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Informazioni denormalizzate dell'utente per performance
  username: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  profileImage: {
    type: String
  },
  
  // Posizione in classifica
  rank: {
    type: Number,
    required: true
  },
  
  // Valore della metrica (distanza, numero tracce, ecc.)
  value: {
    type: Number,
    required: true
  },
  
  // Flag per indicare se ci sono stati miglioramenti rispetto alla classifica precedente
  change: {
    type: Number, // Differenza rispetto al ranking precedente (es. -2 = migliorato di 2 posizioni)
    default: 0
  }
});

const leaderboardSchema = new Schema({
  // Tipo di classifica
  type: {
    type: String,
    enum: [
      'total_distance', // distanza totale
      'total_tracks', // numero di tracce
      'avg_speed', // velocità media
      'max_speed', // velocità massima
      'total_duration', // durata totale
      'total_elevation', // dislivello totale
      'challenge' // specifica per una challenge
    ],
    required: true
  },
  
  // Periodo di riferimento
  period: {
    type: String,
    enum: [
      'daily', // giornaliero
      'weekly', // settimanale
      'monthly', // mensile
      'yearly', // annuale
      'all_time', // di tutti i tempi
      'custom' // periodo personalizzato
    ],
    default: 'weekly'
  },
  
  // Identificativo del periodo (es. '2023-W42' per la settimana 42 del 2023)
  periodId: {
    type: String,
    required: true
  },
  
  // Date di inizio e fine del periodo
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Riferimento a una challenge (se type = 'challenge')
  challengeId: {
    type: Schema.Types.ObjectId,
    ref: 'Challenge'
  },
  
  // Classificazione geografica (globale, nazionale, regionale, ecc.)
  scope: {
    type: String,
    enum: ['global', 'national', 'regional', 'city'],
    default: 'global'
  },
  
  // Codice geografico (es. 'IT' per Italia, 'IT-25' per Lombardia, ecc.)
  geoCode: {
    type: String
  },
  
  // Limite massimo di utenti nella classifica
  limit: {
    type: Number,
    default: 100
  },
  
  // Entries della classifica
  entries: [leaderboardEntrySchema],
  
  // Timestamp di creazione e aggiornamento
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Flag per indicare se la classifica è valida o in fase di aggiornamento
  isValid: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indici per query efficienti
leaderboardSchema.index({ type: 1, period: 1, periodId: 1, scope: 1 }, { unique: true });
leaderboardSchema.index({ startDate: 1 });
leaderboardSchema.index({ endDate: 1 });
leaderboardSchema.index({ updatedAt: 1 });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard; 