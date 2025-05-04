const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// GeoJSON Point Schema per la posizione del POI
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

// Schema per le recensioni
const reviewSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  text: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const poiSchema = new Schema({
  // Utente che ha creato il POI
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Dati geografici
  location: {
    type: locationSchema,
    required: true
  },
  
  // Informazioni di base
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Categorizzazione
  type: {
    type: String,
    enum: ['attraction', 'restaurant', 'cafe', 'gas_station', 'viewpoint', 'hotel', 'rest_area', 'store', 'mechanic', 'other'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Dettagli di contatto
  contactInfo: {
    phone: String,
    website: String,
    email: String,
    address: String
  },
  
  // Media
  images: [{
    url: String,
    thumbnailUrl: String,
    publicId: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Recensioni e valutazioni
  reviews: [reviewSchema],
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Stato di moderazione
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
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
poiSchema.index({ "location.coordinates": "2dsphere" });
poiSchema.index({ type: 1 });
poiSchema.index({ status: 1 });
poiSchema.index({ "rating.average": -1 });
poiSchema.index({ userId: 1 });
poiSchema.index({ tags: 1 });

// Metodi
poiSchema.methods.calculateRating = function() {
  if (!this.reviews || this.reviews.length === 0) {
    this.rating = {
      average: 0,
      count: 0
    };
    return;
  }
  
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating = {
    average: parseFloat((sum / this.reviews.length).toFixed(1)),
    count: this.reviews.length
  };
};

// Hooks
poiSchema.pre('save', function(next) {
  // Calcola la valutazione media
  if (this.isModified('reviews')) {
    this.calculateRating();
  }
  next();
});

const POI = mongoose.model('POI', poiSchema);

module.exports = POI; 