// Configurazione generale dell'applicazione
const AppConfig = {
  // Tema dell'applicazione
  theme: {
    // Tema scuro (come da mockup)
    dark: {
      primary: '#252525',       // Colore primario (sfondo principale)
      secondary: '#1E1E1E',     // Colore secondario (sfondo card)
      accent: '#FF4081',        // Colore accent (bottoni, evidenziazioni)
      text: '#FFFFFF',          // Colore testo principale
      textSecondary: '#BBBBBB', // Colore testo secondario
      success: '#4CAF50',       // Colore per messaggi di successo
      warning: '#FFC107',       // Colore per messaggi di avviso
      error: '#F44336',         // Colore per messaggi di errore
    },
    // Palette colori per visualizzazione velocità
    speedColors: [
      { threshold: 0, color: '#2196F3' },    // Blu - Bassa velocità
      { threshold: 30, color: '#4CAF50' },   // Verde - Velocità media
      { threshold: 60, color: '#FFC107' },   // Giallo - Velocità alta
      { threshold: 100, color: '#FF9800' },  // Arancione - Velocità molto alta
      { threshold: 150, color: '#F44336' },  // Rosso - Velocità estrema
    ],
  },
  
  // Configurazione dei tracciati
  tracking: {
    // Intervalli di aggiornamento (millisecondi)
    updateIntervals: {
      highAccuracy: 1000,    // Alta precisione
      balanced: 3000,        // Bilanciato
      batterySaving: 5000,   // Risparmio batteria
    },
    // Filtri distanza (metri) - per ottimizzare il tracking
    distanceFilters: {
      highAccuracy: 5,       // Alta precisione
      balanced: 10,          // Bilanciato
      batterySaving: 20,     // Risparmio batteria
    },
  },
  
  // Impostazioni predefinite per le unità di misura
  units: {
    distance: 'km',         // chilometri o miglia
    speed: 'km/h',          // chilometri/ora o miglia/ora
    timeFormat: '24h',      // 24h o 12h
  },
  
  // Configurazione timestampFormat
  dateFormat: 'DD/MM/YYYY', // Formato data
  
  // Limiti e dimensioni
  limits: {
    maxPhotosPerTrack: 20,   // Numero massimo di foto per tracciato
    maxTracksPerRequest: 50, // Numero massimo di tracciati per richiesta
  },
};

export default AppConfig; 