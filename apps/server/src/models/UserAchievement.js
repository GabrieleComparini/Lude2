const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userAchievementSchema = new Schema({
  // Utente che ha ottenuto l'achievement
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Achievement ottenuto
  achievementId: {
    type: Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  
  // Codice achievement (per riferimento rapido)
  achievementCode: {
    type: String,
    required: true
  },
  
  // Quando è stato ottenuto
  earnedAt: {
    type: Date,
    default: Date.now
  },
  
  // Evento che ha triggerato l'achievement (ID della traccia, utente seguito, ecc.)
  triggerEvent: {
    type: {
      type: String,
      enum: ['track', 'follow', 'photo', 'login', 'other'],
      default: 'other'
    },
    id: {
      type: Schema.Types.ObjectId
    },
    details: {
      type: String
    }
  },
  
  // Se l'achievement è stato visualizzato dall'utente
  isSeen: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indici per query efficienti
userAchievementSchema.index({ userId: 1 });
userAchievementSchema.index({ userId: 1, achievementCode: 1 }, { unique: true });
userAchievementSchema.index({ earnedAt: -1 });

// Assicura che ogni utente possa avere lo stesso achievement solo una volta
userAchievementSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      const exists = await this.constructor.findOne({
        userId: this.userId,
        achievementCode: this.achievementCode
      });
      
      if (exists) {
        throw new Error(`L'utente ha già ottenuto questo achievement`);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = UserAchievement; 