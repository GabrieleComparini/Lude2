const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const challengeSchema = new Schema({
  // Informazioni di base
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // URL dell'immagine della sfida (Cloudinary)
  imageUrl: {
    type: String
  },
  
  // Tipo di sfida
  type: {
    type: String,
    enum: ['distanza', 'velocità', 'durata', 'luoghi', 'frequenza', 'sociale'],
    required: true
  },
  
  // Periodo della sfida
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    // Se la sfida è sempre attiva (es. sfide onboarding)
    isAlwaysActive: {
      type: Boolean,
      default: false
    }
  },
  
  // Obiettivo della sfida
  goal: {
    // Valore target (es. 100km, 10 tracce, ecc.)
    targetValue: {
      type: Number,
      required: true
    },
    // Unità di misura (km, min, tracce, ecc.)
    unit: {
      type: String,
      required: true
    },
    // Campo su cui si basa l'obiettivo (totalDistance, avgSpeed, ecc.)
    metricField: {
      type: String,
      required: true
    }
  },
  
  // Ricompense al completamento
  reward: {
    xpPoints: {
      type: Number,
      default: 50
    },
    achievementId: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    // Badge speciale o altro premio
    specialReward: {
      type: String
    }
  },
  
  // Difficoltà della sfida
  difficulty: {
    type: String,
    enum: ['principiante', 'intermedio', 'avanzato', 'esperto'],
    default: 'intermedio'
  },
  
  // Stato della sfida (attiva, completata, archiviata)
  status: {
    type: String,
    enum: ['bozza', 'attiva', 'completata', 'archiviata'],
    default: 'bozza'
  },
  
  // Regole speciali o istruzioni aggiuntive
  rules: {
    type: String
  },
  
  // Se la sfida è limitata a specifici veicoli
  vehicleTypes: [{
    type: String,
    enum: ['bicicletta', 'monopattino', 'pattini', 'skateboard', 'corsa', 'qualsiasi']
  }],
  
  // Numero massimo di partecipanti (opzionale)
  maxParticipants: {
    type: Number
  },
  
  // Flag per sfide di onboarding o speciali
  isSpecial: {
    type: Boolean,
    default: false
  },
  
  // Eventuali tag per categorizzazione
  tags: [{
    type: String
  }],
  
  // Utente che ha creato la sfida (se generata dagli utenti)
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamp standard
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indici per query efficienti
challengeSchema.index({ 'period.startDate': 1 });
challengeSchema.index({ 'period.endDate': 1 });
challengeSchema.index({ status: 1 });
challengeSchema.index({ type: 1 });
challengeSchema.index({ difficulty: 1 });
challengeSchema.index({ tags: 1 });

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge; 