const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// GeoJSON LineString Schema per il percorso
const routeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['LineString'],
    required: true
  },
  coordinates: {
    type: [[Number]], // Array di punti [longitude, latitude, (optional)elevation]
    required: true
  }
});

// GeoJSON Point Schema per punti specifici
const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
});

// Schema per i dati meteorologici
const weatherSchema = new mongoose.Schema({
  temperature: Number,
  conditions: String,
  windSpeed: Number,
  humidity: Number,
  source: String
});

// Schema per interazioni social
const socialInteractionSchema = new mongoose.Schema({
  likes: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const trackSchema = new Schema({
  // Riferimenti
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  
  // Dati geografici
  route: {
    type: routeSchema,
    required: true
  },
  startPoint: {
    type: pointSchema,
    required: true
  },
  endPoint: {
    type: pointSchema,
    required: true
  },
  
  // Tempi
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Durata in secondi
    required: true
  },
  
  // Metadata
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Statistiche
  stats: {
    distance: {
      type: Number, // km
      required: true
    },
    avgSpeed: {
      type: Number, // km/h
      required: true
    },
    maxSpeed: {
      type: Number, // km/h
      required: true
    },
    minElevation: Number, // m
    maxElevation: Number, // m
    elevationGain: Number, // m
    avgCadence: Number, // rpm (solo per bici)
    calories: Number // kcal (stima)
  },
  
  // Dati contestuali
  weather: {
    type: weatherSchema
  },
  
  // Impostazioni social e privacy
  privacy: {
    type: String,
    enum: ['private', 'followers', 'public'],
    default: 'private'
  },
  social: {
    type: socialInteractionSchema,
    default: () => ({})
  },
  
  // Flag per tracciare lo stato del percorso
  isProcessed: {
    type: Boolean,
    default: true
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

// Indici per query geografiche
trackSchema.index({ userId: 1 });
trackSchema.index({ "startPoint.coordinates": "2dsphere" });
trackSchema.index({ "endPoint.coordinates": "2dsphere" });
trackSchema.index({ privacy: 1 });
trackSchema.index({ createdAt: -1 });

// Hooks
trackSchema.pre('save', async function(next) {
  try {
    // Se è un nuovo track, aggiorna le statistiche dell'utente e del veicolo
    if (this.isNew) {
      const User = mongoose.model('User');
      // Aggiorna statistiche utente
      await User.findByIdAndUpdate(this.userId, {
        $inc: {
          'statistics.totalDistance': this.stats.distance,
          'statistics.totalTime': this.duration / 60, // converti in minuti
          'statistics.totalTracks': 1
        },
        $max: {
          'statistics.maxSpeed': this.stats.maxSpeed
        }
      });
      
      // Se c'è un veicolo associato, aggiorna anche le sue statistiche
      if (this.vehicleId) {
        const Vehicle = mongoose.model('Vehicle');
        await Vehicle.findByIdAndUpdate(this.vehicleId, {
          $inc: {
            'stats.totalDistance': this.stats.distance,
            'stats.totalTime': this.duration / 60, // converti in minuti
            'stats.totalTracks': 1
          },
          $max: {
            'stats.maxSpeed': this.stats.maxSpeed
          }
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Track = mongoose.model('Track', trackSchema);

module.exports = Track; 