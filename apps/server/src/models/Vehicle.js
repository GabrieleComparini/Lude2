const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vehicleSchema = new Schema({
  // Riferimento all'utente proprietario
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Campi base
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['car', 'motorcycle', 'bicycle', 'other'],
    required: true
  },
  make: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  
  // Dati tecnici
  specs: {
    engineSize: {
      type: Number, // cc
      default: null
    },
    fuelType: {
      type: String,
      enum: ['gasoline', 'diesel', 'electric', 'hybrid', 'other', null],
      default: null
    },
    power: {
      type: Number, // hp
      default: null
    },
    weight: {
      type: Number, // kg
      default: null
    },
    transmission: {
      type: String,
      enum: ['manual', 'automatic', 'cvt', 'other', null],
      default: null
    }
  },
  
  // Statistiche
  stats: {
    totalDistance: {
      type: Number, // km
      default: 0
    },
    totalTime: {
      type: Number, // minuti
      default: 0
    },
    avgSpeed: {
      type: Number, // km/h
      default: 0
    },
    maxSpeed: {
      type: Number, // km/h
      default: 0
    },
    totalTracks: {
      type: Number,
      default: 0
    }
  },
  
  // Immagine
  image: {
    type: String,
    default: ''
  },
  
  // Flag veicolo predefinito
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Note
  notes: {
    type: String,
    maxlength: 1000,
    default: ''
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

// Indici
vehicleSchema.index({ userId: 1 });

// Hooks
vehicleSchema.pre('save', async function(next) {
  // Se questo veicolo è impostato come predefinito, rimuovi il flag dagli altri
  if (this.isDefault) {
    try {
      await this.constructor.updateMany(
        { userId: this.userId, _id: { $ne: this._id } },
        { $set: { isDefault: false } }
      );
    } catch (error) {
      next(error);
    }
  }
  next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle; 