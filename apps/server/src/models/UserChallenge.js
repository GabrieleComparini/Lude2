const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userChallengeSchema = new Schema({
  // Sfida a cui l'utente partecipa
  challengeId: {
    type: Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  
  // Utente partecipante
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Data di iscrizione alla sfida
  joinedAt: {
    type: Date,
    default: Date.now
  },
  
  // Progresso attuale verso l'obiettivo
  progress: {
    currentValue: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    // Tracce che hanno contribuito al progresso
    contributingTracks: [{
      trackId: {
        type: Schema.Types.ObjectId,
        ref: 'Track'
      },
      contribution: {
        type: Number // Quanto questa traccia ha contribuito al progresso
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Data di completamento (se è stata completata)
  completedAt: {
    type: Date
  },
  
  // Stato della partecipazione dell'utente
  status: {
    type: String,
    enum: ['attiva', 'completata', 'abbandonata', 'fallita'],
    default: 'attiva'
  },
  
  // Se l'utente ha ricevuto la ricompensa
  rewardClaimed: {
    type: Boolean,
    default: false
  },
  
  // Timestamp dell'ultima attività dell'utente per questa sfida
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indici per query efficienti
userChallengeSchema.index({ userId: 1, status: 1 });
userChallengeSchema.index({ challengeId: 1, status: 1 });
userChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
userChallengeSchema.index({ completedAt: 1 });

// Metodo per aggiornare il progresso
userChallengeSchema.methods.updateProgress = async function(trackData, challengeGoal) {
  const contribution = trackData.contribution || 0;
  
  if (contribution <= 0) {
    return;
  }
  
  // Verifica se la traccia è già stata conteggiata
  const existingTrackIndex = this.progress.contributingTracks.findIndex(
    track => track.trackId.toString() === trackData.trackId.toString()
  );
  
  // Se la traccia esiste già, aggiorna il contributo
  if (existingTrackIndex !== -1) {
    this.progress.contributingTracks[existingTrackIndex].contribution = contribution;
    this.progress.contributingTracks[existingTrackIndex].addedAt = new Date();
  } else {
    // Altrimenti aggiungi la nuova traccia
    this.progress.contributingTracks.push({
      trackId: trackData.trackId,
      contribution,
      addedAt: new Date()
    });
  }
  
  // Calcola il progresso totale
  const totalContribution = this.progress.contributingTracks.reduce(
    (sum, track) => sum + track.contribution, 
    0
  );
  
  this.progress.currentValue = totalContribution;
  
  // Calcola la percentuale di completamento
  const targetValue = challengeGoal.targetValue || 1;
  this.progress.percentage = Math.min(100, Math.round((totalContribution / targetValue) * 100));
  
  // Aggiorna lo stato se completato
  if (this.progress.percentage >= 100 && this.status === 'attiva') {
    this.status = 'completata';
    this.completedAt = new Date();
  }
  
  this.lastActivity = new Date();
  
  return this.save();
};

const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);

module.exports = UserChallenge; 