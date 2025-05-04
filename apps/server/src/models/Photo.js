const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// GeoJSON Point Schema per la posizione della foto
const locationSchema = new mongoose.Schema({
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

// Schema per i dati EXIF
const exifSchema = new mongoose.Schema({
  make: String,
  model: String,
  exposureTime: String,
  fNumber: Number,
  iso: Number,
  focalLength: String,
  flash: Boolean,
  software: String
});

// Schema per le interazioni social
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

const photoSchema = new Schema({
  // Riferimenti
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trackId: {
    type: Schema.Types.ObjectId,
    ref: 'Track'
  },
  
  // Media
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  publicId: {
    type: String,  // Cloudinary public ID
    required: true
  },
  
  // Geo data
  location: {
    type: locationSchema,
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
  tags: [{
    type: String,
    trim: true
  }],
  
  // Data e ora in cui è stata scattata la foto (può essere diversa dal createdAt)
  takenAt: {
    type: Date,
    default: Date.now
  },
  
  // Metadata EXIF
  exif: {
    type: exifSchema
  },
  
  // Impostazioni privacy
  privacy: {
    type: String,
    enum: ['private', 'followers', 'public'],
    default: 'private'
  },
  
  // Interazioni social
  social: {
    type: socialInteractionSchema,
    default: () => ({})
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
photoSchema.index({ userId: 1 });
photoSchema.index({ trackId: 1 });
photoSchema.index({ "location.coordinates": "2dsphere" });
photoSchema.index({ privacy: 1 });
photoSchema.index({ takenAt: -1 });
photoSchema.index({ createdAt: -1 });
photoSchema.index({ tags: 1 });

// Hooks
photoSchema.pre('save', async function(next) {
  try {
    // Se è una nuova foto, aggiorna le statistiche dell'utente
    if (this.isNew) {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(this.userId, {
        $inc: {
          'statistics.totalPhotos': 1
        }
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pulire le risorse su Cloudinary quando una foto viene eliminata
photoSchema.pre('remove', async function(next) {
  try {
    // Implementare la logica per eliminare l'immagine da Cloudinary
    // utilizzando il publicId
    // Esempio: await deleteImage(this.publicId);
    next();
  } catch (error) {
    next(error);
  }
});

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo; 