# Guida Dettagliata (Concettuale) - Frontend Mobile Lude (iOS/Expo SDK 53) - v2 (Mapbox & Mockup-Driven)

## Prerequisiti:
- Ambiente di sviluppo React Native/Expo configurato (Node.js, npm/yarn, Expo CLI).
- Xcode installato (per simulatore iOS e build native).
- Progetto Expo SDK 53 inizializzato (`npx create-expo-app@latest mobile -t`).
- Dipendenze base installate (`firebase`, `@react-navigation/...`, `axios`).
- **Mapbox Account e Access Token:** Account Mapbox creato e Access Token ottenuto.
- **Installazione Mapbox SDK:** Libreria Mapbox per React Native installata (es. `@rnmapbox/maps`).
- Configurazione Firebase client (`app/config/firebase.js`) completata.
- Configurazione API Client (`app/api/client.js`) completata.
- File `.env` (`apps/mobile/.env`) popolato con le chiavi Firebase, l'URL del backend deployato e l'**Access Token Mapbox** (es. `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`).
- `AuthProvider` (`app/context/AuthContext.js`) creato e integrato in `_layout.js`.

**Design Guideline:** L'implementazione UI/UX deve aderire strettamente al design presentato nel mockup fornito (`WhatsApp Image 2025-04-19 at 16.55.55.jpeg`), adottando un tema scuro, layout pulito, data visualization specifica (card, grafici), e tipografia definita.

---

## Fase 1: Setup Navigazione & Flusso di Autenticazione

### 1. Struttura Navigazione Principale:
- **Obiettivo:** Definire la navigazione radice che mostra lo stack di autenticazione o quello dell'app in base allo stato utente.
- **Struttura directory**: Utilizzare il File-Based Router di Expo SDK 53 con cartelle e file sotto `app/`
- **Componenti Concettuali (`app/_layout.js`):** 
  - Utilizza `useAuth` per `user` e `loading`.
  - Mostra `SplashScreen` durante il caricamento.
  - Reindirizzamento condizionale: se l'utente non è autenticato, reindirizza a `/(auth)`.

### 2. Navigatore di Autenticazione:
- **Obiettivo:** Gestire le schermate di login e registrazione.
- **Struttura directory:**
  ```
  app/
    (auth)/
      _layout.js     # Configurazione specifica per lo stack di auth
      login.js       # Schermata di login
      register.js    # Schermata di registrazione
  ```

### 3. Navigatore Principale dell'App:
- **Obiettivo:** Contenere la navigazione principale post-autenticazione, rispecchiando il tab bar del mockup.
- **Struttura directory:**
  ```
  app/
    (app)/
      _layout.js     # Tab Navigator con stile personalizzato
      (tabs)/
        map/
          _layout.js
          index.js   # Schermata principale mappa
          settings.js # Schermata impostazioni accessibile dalla mappa
        search/
          _layout.js
          index.js   # Schermata di ricerca utenti
        explore/
          _layout.js
          index.js   # Container per i subtab
          friends.js # Feed condivisi dagli amici
          global.js  # Feed globali più popolari
        profile/
          _layout.js
          index.js   # Profilo utente con statistiche e storico
  ```

### 4. Schermate di Autenticazione (UI & Logica):
- **Obiettivo:** Implementare le UI di Login/Registrazione e collegarle ad `AuthContext`.
- **Componenti (`app/(auth)/login.js` e `register.js`):** 
  - Form standard per l'inserimento dati, pulsanti, gestione errori/loading da `useAuth`.
  - Chiamate `login`/`register` da `useAuth`.

### 5. Testing Flusso Base:
- Verificare la navigazione condizionale (Auth vs App stacks).
- Testare login/registrazione (con sync backend) e logout.
- Assicurarsi che il Tab Navigator principale venga mostrato dopo l'autenticazione.

---

## Fase 2: Funzionalità Base (Map, Search, Explore, Profile)

### 6. Schermata Mappa/Tracciamento (`app/(app)/(tabs)/map/index.js`):
- **Obiettivo:** Visualizzare la mappa, permettere l'avvio/stop del tracking, mostrare dati in tempo reale come nel mockup.
- **Componenti:**
  - Richiesta Permessi Localizzazione (`expo-location`).
  - **Integrazione Mappa Mapbox:** Utilizza `@rnmapbox/maps` (`MapboxGL.MapView`) per visualizzare la mappa.
  - **UI (basata sul mockup):**
    - Icona utente in alto a sinistra.
    - **Icona impostazioni (ingranaggio)** in alto a destra che apre `SettingsScreen`.
    - Indicatore velocità attuale (cerchio scuro con velocità in km/h) visibile durante il tracking.
    - Overlay inferiore:
      - Stato Inattivo: Pulsante "Start Tracking".
      - Stato Attivo: Timer (durata), Distanza (km), Velocità Media (km/h). Pulsante "Stop Tracking".
  - **Logica di Tracking:**
    - Usa `expo-location` per ottenere aggiornamenti posizione.
    - Memorizza i punti rotta (lat, lng, speed, altitude, timestamp).
    - Aggiorna la polyline sulla mappa Mapbox.
    - Calcola e aggiorna le statistiche live.
  - **Salvataggio:** Al "Stop", presenta una modale o naviga a schermata riepilogo.

### 7. Schermata Ricerca Utenti (`app/(app)/(tabs)/search/index.js`):
- **Obiettivo:** Permettere la ricerca di altri utenti dell'app.
- **Componenti:**
  - Campo di ricerca con auto-completamento.
  - Chiama `GET /api/users/search?q=query` per cercare utenti.
  - Visualizza risultati in una `FlatList` con `UserSearchItem`.
  - Al tocco su un risultato, naviga a `PublicProfileScreen` passando `username`.
  - **Opzionale:** Filtri avanzati (es. cerca per veicolo, regione, interessi).
  - **Recenti:** Mostra ricerche recenti salvate localmente.

### 8. Schermata Esplora (`app/(app)/(tabs)/explore/index.js`, `friends.js`, `global.js`):
- **Obiettivo:** Mostrare i feed degli amici e quelli globali più popolari.
- **Componenti:**
  - **Tab Superiori:** Utilizza `index.js` come hub con link a `friends.js` e `global.js`
  - **Tab Friends (`friends.js`):**
    - Chiama `GET /api/social/feed/friends` per recuperare i feed degli amici.
    - Usa `FlatList` per visualizzare i tracciati condivisi dagli amici.
    - Componente `TrackCard` per ogni tracciato (con mappa statica Mapbox preview).
    - Pull-to-refresh per aggiornare i feed.
  - **Tab Global (`global.js`):**
    - Chiama `GET /api/social/feed/popular` per recuperare i feed globali popolari.
    - Stessa UI di `friends.js` ma con tracciati globali.
    - **Opzionale:** Filtri per le diverse metriche di popularità.

### 9. Schermata Profilo Utente (`app/(app)/(tabs)/profile/index.js`):
- **Obiettivo:** Integrare profilo utente, statistiche e storico tracciati in un'unica schermata.
- **Componenti:**
  - **Header Profilo:** Foto profilo, nome utente, bio, conteggio following/followers, ecc.
  - **Pulsante Modifica Profilo:** Naviga a `edit.js`.
  - **Sezione Statistiche:**
    - Chiama `GET /api/analytics/summary` (o recupera da `useAuth().user.statistics`).
    - **Grid Statistiche:** Visualizza le card per Total Distance, Total Time, Top Speed, Avg Speed.
    - **Grafico Distribuzione Velocità:** Grafico a barre che mostra il tempo/distanza in range di velocità.
  - **Sezione Storico Tracciati:**
    - Titolo "I miei tracciati" con conteggio.
    - Chiama `GET /api/tracks/list` per recuperare i tracciati dell'utente.
    - Usa `FlatList` con paginazione per visualizzare l'elenco.
    - **Componente `TripHistoryItem`:** Mostra data/ora, durata, distanza, velocità media.
    - Al tocco di un item, naviga a `TripDetailScreen` passando l'ID del tracciato.
    - Implementa "Pull to Refresh".

### 10. Schermata Dettaglio Tracciato (`app/(app)/(tabs)/profile/trip/[id].js`):
- **Obiettivo:** Visualizzare i dettagli completi di un singolo tracciato, rispecchiando il mockup.
- **Componenti:**
  - Riceve `trackId` dai parametri di navigazione. Chiama `GET /api/tracks/:id`.
  - **Mappa Mapbox:** Mostra la mappa con il percorso del tracciato, start/end markers.
  - **Legenda Velocità:** Visualizza la legenda con i range di velocità colorati.
  - **Card Dati (basate sul mockup):**
    - "Travel Time Comparison" (se disponibile).
    - Statistiche principali: Distanza, Avg Speed, Max Speed, High Speed Time.
  - **Grafico Velocità:** Grafico "Speed Over Time".
  - **Pulsanti Interazione:** Like, Commento, Condivisione.
  - **Opzionale:** Pulsanti Modifica/Elimina se l'utente è proprietario.
  - **Sezione Commenti:** Lista commenti con input per aggiungerne di nuovi.

### 11. Schermata Impostazioni (`app/(app)/(tabs)/map/settings.js`):
- **Obiettivo:** Fornire accesso a impostazioni, veicoli, preferenze e logout.
- **Componenti:**
  - Opzioni per navigare a:
    - `vehicles/index.js` (per gestire i veicoli)
    - `preferences.js` (units, privacy, notifications)
    - `account.js` (gestione account, sicurezza)
  - Pulsante "Logout" che chiama `useAuth().logout()`.

---

## Fase 3: Funzionalità Core di Tracciamento

### 12. Servizio di Geolocalizzazione (`app/services/locationService.js`):
- **Obiettivo:** Creare un servizio centralizzato per la gestione della geolocalizzazione.
- **Componenti:**
  - **Configurazione iniziale:** Funzioni per permessi di localizzazione.
  - **Modalità di tracciamento:** Configurazioni ottimizzate:
    - `HIGH_ACCURACY`: Per tracciamento ad alta precisione.
    - `BALANCED`: Per equilibrio tra precisione e risparmio batteria.
    - `BATTERY_SAVING`: Per tracciamento prolungato con minore impatto batteria.
  - **Gestione Tracciamento:**
    - `startTracking(mode, callback)`, `stopTracking()`, `pauseTracking()`, `resumeTracking()`.
  - **Background Tracking:** Supporto per il tracciamento in background.
  - **Ottimizzazione Batteria:** Algoritmi per filtrare punti ridondanti.
  - **Gestione errori:** Strategie di fallback e notifiche all'utente.

### 13. Context Tracciamento (`app/context/TrackingContext.js`):
- **Obiettivo:** Fornire uno stato globale per le funzionalità di tracciamento.
- **Componenti:**
  - **Stato:** `isTracking`, `currentTrack`, `currentStats`, `trackingMode`
  - **Azioni:** `startNewTrack()`, `pauseCurrentTrack()`, `resumeCurrentTrack()`, `finalizeTrack()`, `discardTrack()`
  - **Utilità:** `getFormattedDuration()`, `getFormattedDistance()`, `getFormattedSpeed()`
  - **Calcoli in tempo reale:** Funzioni per calcolare statistiche live.
  - **Integration:** Integrazione con `locationService`.

### 14. Schermata Tracciamento Avanzata (`app/(app)/(tabs)/map/index.js`):
- **Obiettivo:** Estendere la schermata mappa con funzionalità avanzate.
- **Componenti:**
  - **Integrazione `locationService`**
  - **Modalità di Tracciamento:** Standard, Preciso, Economico
  - **UI Avanzata:**
    - Indicatore grafico stato GPS.
    - Indicatore stato batteria e avvisi.
    - Visualizzazione altitudine e grafico profilo altimetrico in tempo reale.
    - Mini-mappa overview con tracciato completo.
  - **Interfaccia utente migliorata:**
    - Modalità a schermo intero ottimizzata per il tracking.
    - Pannello di informazioni collassabile con swipe gesture.
    - Visualizzazione degli indicatori di performance.
    - Barra del tempo trascorso con lap timer opzionale.
  - **Controlli avanzati:**
    - Pulsanti pause/resume.
    - Modalità di tracking rapido con presets.
    - Aggiunta waypoint manuale.
    - Registrazione note vocali o testuali.
  - **Mapbox Enhanced:**
    - Visualizzazione colorata in tempo reale del percorso.
    - Transizioni fluide della camera.
    - Modalità 3D per visualizzazione altitudine.
    - Minimap per contesto geografico.
  - **HUD (Head-Up Display):**
    - Overlay semitrasparente con indicatori principali.
    - Suggerimenti contestuali.
  - **Funzionalità Auto:**
    - Auto-pause quando il movimento si ferma.
    - Rilevamento automatico inizio/fine attività.
    - Notifiche vocali periodiche sulle performance.

### 15. Schermata Dettaglio Tracciato Avanzata (`app/(app)/(tabs)/profile/trip/[id].js`):
- **Obiettivo:** Estendere la visualizzazione dettagli con analisi avanzate.
- **Componenti:**
  - **Analisi Avanzate:**
    - Segmentazione automatica del percorso.
    - Calcolo zone di velocità.
    - Rilevamento automatico di pattern.
  - **Visualizzazione Mappa Multi-Layer:**
    - Layer base, velocità, altitudine e personalizzati.
  - **Grafici Interattivi:**
    - Grafico velocità/tempo con zoom e pan.
    - Grafico altitudine/distanza.
    - Distribuzione velocità (istogramma).
    - Comparativa tra segmenti simili.
  - **Opzioni Avanzate Esportazione:**
    - Export GPX/KML, report PDF, dati raw.
  - **Metadati Avanzati:**
    - Condizioni meteo, tipo di terreno, statistiche derivate.

### 16. Schermata Dettaglio Tracciato Completa (`app/(app)/(tabs)/profile/trip/[id].js`):
- **Obiettivo:** Implementare una visualizzazione completa e interattiva.
- **Componenti:**
  - **Visualizzazione Mappa Interattiva:**
    - Percorso completo con segmentazione colorata.
    - Pin di inizio/fine con animazioni.
    - Highlight di punti significativi.
    - Controlli di zoom/pan ottimizzati.
    - Toggle per visualizzazione satellite/stradale/ibrida.
  - **Statistiche Avanzate:**
    - Grafici interattivi (scrollable, zoomable).
    - Metriche calcolate dettagliate.
  - **Metadati e Tag:**
    - Form di editing per descrizione e note.
    - Sistema di tagging intelligente con suggestions.
    - Weather data integration.
    - Impostazioni di privacy.
  - **Interazioni Social Estese:**
    - Sistema commenti avanzato.
    - Reazioni differenziate.
    - Funzione "sfida".
    - Opzioni di condivisione multiple.
  - **Action Menu:**
    - Editing/crop del tracciato.
    - Esportazione in vari formati.
    - Integrazione con altre app.

### 17. Lista Tracciati Avanzata (`app/(app)/(tabs)/profile/tracks/index.js`):
- **Obiettivo:** Fornire una visualizzazione organizzata e filtrabile.
- **Componenti:**
  - **Filtri Avanzati:**
    - Filtri per data, veicolo, distanza, testo, località.
  - **Visualizzazioni Personalizzabili:**
    - Vista Lista, Calendario, Mappa, Griglia.
  - **Ordinamento Intelligente:**
    - Per data, "impressività", località, durata, distanza.
  - **Anteprima Intelligente:**
    - Card con mini preview mappa per ogni tracciato.
    - Indicatori visivi per metriche chiave.
    - Quick-action buttons.
    - Swipe actions.
  - **Statistiche Aggregate:**
    - Header sezione con totali del periodo.
    - Grafici trend.
    - Record personali evidenziati.
    - Comparazione con periodi precedenti.

---

## Fase 4: Funzionalità Social e Foto

### 18. Schermata Foto (`app/(app)/(tabs)/map/photo.js`):
- **Obiettivo:** Implementare funzionalità per catturare e condividere foto geolocalizzate.
- **Componenti:**
  - **Integrazione Camera:**
    - `expo-camera` per accesso diretto alla fotocamera.
    - Overlay UI con indicatori di geolocalizzazione.
    - Controlli avanzati (flash, HDR, griglia, timer).
    - Supporto per galleria (`expo-image-picker`).
  - **Geolocalizzazione Automatica:**
    - Tag di posizione GPS su ogni foto.
    - Associazione al tracciato attivo.
    - Overlay informativo di posizione.
    - Auto-tagging di località note.
  - **Preview e Editing:**
    - Preview immediata della foto.
    - Strumenti di editing base.
    - Aggiunta tag e descrizione.
    - Mini-mappa di posizione.
  - **Upload e Condivisione:**
    - Upload ottimizzato con progress indicator.
    - Opzioni di compressione.
    - Privacy settings.
    - Share options.
    - Background upload.
  - **Visualizzazione Timeline:**
    - Galleria cronologica.
    - Visualizzazione mappa con cluster.
    - Ricerca per località o data.

### 19. Feed Activity (`app/(app)/(tabs)/explore/[type].js`):
- **Obiettivo:** Creare un feed social ricco e interattivo.
- **Componenti:**
  - **UI del Feed:**
    - Design moderno con card personalizzate.
    - Infinite scroll con skeleton loading.
    - Pull-to-refresh con animazioni.
    - Notifiche di nuovi contenuti.
  - **Tipi di Card:**
    - Track Card, Photo Card, Achievement Card, Challenge Card, Milestone Card
  - **Preview Tracciati Interattive:**
    - Miniatura mappa con percorso.
    - Animazione play/rewind.
    - Statistiche principali.
    - Call-to-action.
  - **Interazioni Social Complete:**
    - Sistema commenti full-featured.
    - Reazioni categorizzate.
    - Bookmark/salvataggio.
    - Sharing diretto.
  - **Filtraggio Intelligente:**
    - Toggle per tipi di contenuto.
    - Filtri di rilevanza, geografico, temporale.

### 20. Profilo Utente Avanzato (`app/(app)/(tabs)/profile/index.js`):
- **Obiettivo:** Estendere il profilo con funzionalità sociali avanzate.
- **Componenti:**
  - **Header Profilo Dinamico:**
    - Cover photo personalizzabile.
    - Avatar con bordi personalizzati.
    - Badge/icons di achievement.
    - Quick stats.
  - **Statistiche Personalizzate:**
    - Dashboard personalizzabile.
    - Grafici interattivi per trend.
    - Comparazione con periodi precedenti.
    - Record personali.
    - Heatmap attività annuale.
  - **Galleria Multimediale:**
    - Grid view con filtri.
    - Visualizzazione a mappa con cluster.
    - Ordinamento personalizzabile.
    - Quick-preview con gesture.
  - **Gestione Connections Avanzata:**
    - Liste following/followers.
    - Suggerimenti amicizia.
    - Livelli di privacy.
    - Activity feed filtrato.
  - **Customizzazione Profilo:**
    - Temi e colori personalizzabili.
    - Bio estesa.
    - Preferenze di condivisione.
    - Integrazione social accounts.

### 21. Esplorazione Avanzata (`app/(app)/(tabs)/explore/map.js`):
- **Obiettivo:** Creare un'esperienza di esplorazione immersiva basata su mappa.
- **Componenti:**
  - **Mappa Interattiva Esplorativa:**
    - Visualizzazione full-screen.
    - Cluster di contenuti.
    - Filtri per tipo.
    - Radar view per vicinanze.
    - 3D terrain visualization.
  - **Ricerca POI Avanzata:**
    - Integrazione POI con categorie.
    - Suggerimenti basati su interessi.
    - Ricerca con filtri.
    - Preview card.
  - **Tracciati Pubblici Discovery:**
    - Heatmap di zone popolari.
    - Filtri specializzati.
    - Suggerimenti personalizzati.
    - Ordinamento multiplo.
  - **Community Hotspots:**
    - Zone con alta attività.
    - Eventi comunitari.
    - Challenges geografiche.
    - Top users per zona.
  - **Navigation & Routing:**
    - "Navigate to" per POI o tracciati.
    - Route preview.
    - Opzioni percorso multiple.
    - Bookmark locations.

---

## Fase 5: Altre Funzionalità Chiave

### 22. Gestione Veicoli (`app/(app)/(tabs)/map/vehicles/index.js`):
- **Obiettivo:** Permettere la gestione veicoli con statistiche specifiche.
- **Componenti:**
  - **Dashboard Veicoli:**
    - Lista con thumbnail, nome, tipo, statistiche.
    - Indicatori stato.
    - Quick toggle per veicolo predefinito.
  - **Dettaglio Veicolo (`[id].js`):**
    - Galleria foto.
    - Scheda tecnica.
    - Maintenance log.
    - Timeline attività.
  - **Aggiunta/Modifica (`new.js`, `edit/[id].js`):**
    - Form step-by-step.
    - Categorie predefinite + custom.
    - Upload multiple foto.
    - Campi personalizzati.
  - **Statistiche per Veicolo:**
    - Dashboard dedicata.
    - Grafici comparativi.
    - Heatmap utilizzo.
    - Record personali.
  - **Condivisione:**
    - Scheda veicolo condivisibile.
    - Privacy setting.
    - Link a marketplace/community.

### 23. Impostazioni Avanzate (`app/(app)/(tabs)/map/settings/index.js`):
- **Obiettivo:** Fornire controllo completo su preferenze e privacy.
- **Componenti:**
  - **Preferenze Utente:**
    - Tema UI, unità di misura, format data/ora, lingua, preferenze mappa.
  - **Privacy e Visibilità:**
    - Default privacy, granularità posizione, visibilità profilo, controlli interazioni, blocklist.
  - **Notifiche:**
    - Matrice configurazione, schedule, preview, push vs in-app.
  - **Account e Sicurezza:**
    - Gestione credenziali, connessione social, download dati, cancellazione.
  - **Esportazione Dati:**
    - Export completo, selettivo, integrazioni, backup automatici.
  - **Avanzate:**
    - Tracking settings, cache, debug mode, beta features.

### 24. Achievement/Gamification (`app/(app)/(tabs)/profile/achievements.js`):
- **Obiettivo:** Implementare sistema motivazionale.
- **Componenti:**
  - **Dashboard Achievement:**
    - Grid badge, categorie, percentuali completamento, timeline.
  - **Sfide Attive:**
    - Lista con progress tracker, timer, dettagli requisiti, join/leave.
  - **Leaderboard:**
    - Classifiche multiple, filtri, timeframe, dettaglio performance.
  - **Sistema Ricompense:**
    - Badge permanenti, ricompense virtuali, XP e level system, partnership.
  - **Sfide Community:**
    - Sfide user-created, eventi tematici, sfide di gruppo, social sharing.
