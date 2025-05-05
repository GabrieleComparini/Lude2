const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const achievementSchema = new Schema({
  // Codice unico per identificare l'achievement
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Informazioni di base
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // URL dell'icona dell'achievement (Cloudinary)
  iconUrl: {
    type: String
  },
  
  // Categoria dell'achievement
  category: {
    type: String,
    enum: ['distanza', 'velocità', 'durata', 'frequenza', 'social', 'luoghi', 'speciale'],
    required: true
  },
  
  // Requisiti per ottenere l'achievement
  requirements: {
    // Valore numerico per completare l'achievement (es. 100km, 10 tracce, ecc.)
    value: {
      type: Number,
      required: true
    },
    
    // Campo su cui si basa il requisito (es. totalDistance, avgSpeed, ecc.)
    field: {
      type: String,
      required: true
    },
    
    // Operazione di confronto (es. >, >=, =, <=, <)
    operation: {
      type: String,
      enum: ['greater', 'greaterEqual', 'equal', 'lessEqual', 'less'],
      default: 'greaterEqual'
    },
    
    // Eventuali condizioni aggiuntive in formato stringa (per logiche più complesse)
    additionalConditions: {
      type: String
    }
  },
  
  // Rarità dell'achievement (influisce sul punteggio)
  rarity: {
    type: String,
    enum: ['comune', 'insolito', 'raro', 'epico', 'leggendario'],
    default: 'comune'
  },
  
  // Punti esperienza conferiti al completamento
  xpPoints: {
    type: Number,
    default: 10
  },
  
  // Flag per achievement nascosti (scoperti solo al completamento)
  isHidden: {
    type: Boolean,
    default: false
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

achievementSchema.index({ category: 1 });
achievementSchema.index({ rarity: 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement; 