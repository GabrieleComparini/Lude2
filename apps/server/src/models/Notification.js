const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  // Utente che riceve la notifica
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Utente che ha generato la notifica
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tipo di notifica
  type: {
    type: String,
    enum: ['follow', 'comment', 'reaction', 'mention', 'achievement', 'system'],
    required: true
  },
  
  // Contenuto specifico per il tipo di notifica
  content: {
    text: {
      type: String
    },
    // Riferimento alla traccia (se presente)
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track'
    },
    // Riferimento al commento (se presente)
    commentId: {
      type: Schema.Types.ObjectId
    },
    // Tipo di reazione (se presente)
    reactionType: {
      type: String,
      enum: ['like', 'love', 'wow']
    }
  },
  
  // Stato lettura
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Timestamp standard
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indici per query efficienti
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 