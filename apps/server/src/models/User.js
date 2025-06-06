const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  // Campi base
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true  // Permette valori null/undefined e mantiene unicità
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // Aggiungi campo password per autenticazione diretta
  password: {
    type: String,
    // Non 'required' per supportare utenti sincronizzati da Firebase
    select: false  // Non includere password nelle query per sicurezza
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  
  // Ruolo utente
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Preferenze utente
  preferences: {
    unitSystem: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    },
    privacySettings: {
      defaultTrackPrivacy: {
        type: String,
        enum: ['private', 'followers', 'public'],
        default: 'private'
      },
      defaultPhotoPrivacy: {
        type: String,
        enum: ['private', 'followers', 'public'],
        default: 'private'
      },
      showLocationInProfile: {
        type: Boolean,
        default: false
      }
    },
    notifications: {
      newFollower: {
        type: Boolean,
        default: true
      },
      newComment: {
        type: Boolean,
        default: true
      },
      newLike: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Statistiche
  statistics: {
    totalDistance: {
      type: Number,
      default: 0
    },
    totalTime: {
      type: Number,
      default: 0
    },
    avgSpeed: {
      type: Number,
      default: 0
    },
    maxSpeed: {
      type: Number,
      default: 0
    },
    totalTracks: {
      type: Number,
      default: 0
    },
    totalPhotos: {
      type: Number,
      default: 0
    }
  },
  
  // Relazioni social
  connections: {
    following: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    followers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Tracking dell'ultimo accesso
  lastLogin: {
    type: Date,
    default: Date.now
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
  timestamps: true // Crea automaticamente createdAt e updatedAt
});

// Aggiungi metodi personalizzati
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  
  // Rimuovi dati sensibili
  delete user.firebaseUid;
  delete user.password;
  
  // Restituisci solo ciò che è pubblico
  return {
    id: user._id,
    username: user.username,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    bio: user.bio,
    statistics: user.statistics,
    preferences: user.preferences,
    followersCount: user.connections?.followers?.length || 0,
    followingCount: user.connections?.following?.length || 0,
    createdAt: user.createdAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User; 