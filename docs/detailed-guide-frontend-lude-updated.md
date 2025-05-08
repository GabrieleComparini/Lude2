Certamente. Ecco una guida concettuale passo-passo per l'implementazione del frontend mobile iOS con React Native/Expo, basata sulle API backend che abbiamo definito. Questa guida si concentra sugli *obiettivi* e sulle *funzionalità* da implementare in ogni fase, senza fornire codice specifico.

---

**Guida Dettagliata (Concettuale) - Frontend Mobile Lude (iOS/Expo) - v2 (Mapbox & Mockup-Driven)**

**Prerequisiti:**
*   Ambiente di sviluppo React Native/Expo configurato (Node.js, npm/yarn, Expo CLI).
*   Xcode installato (per simulatore iOS e build native).
*   Progetto Expo `apps/mobile` inizializzato (`npx create-expo-app mobile`).
*   Dipendenze base installate (`firebase`, `@react-navigation/...`, `axios`).
*   **Mapbox Account e Access Token:** Account Mapbox creato e Access Token ottenuto.
*   **Installazione Mapbox SDK:** Libreria Mapbox per React Native installata (es. `@rnmapbox/maps`).
*   Configurazione Firebase client (`src/config/firebase.js`) completata.
*   Configurazione API Client (`src/api/client.js`) completata.
*   File `.env` (`apps/mobile/.env`) popolato con le chiavi Firebase, l'URL del backend deployato e l'**Access Token Mapbox** (es. `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`).
*   `AuthProvider` (`src/context/AuthContext.js`) creato e integrato in `App.js`.

**Design Guideline:** L'implementazione UI/UX deve aderire strettamente al design presentato nel mockup fornito (`WhatsApp Image 2025-04-19 at 16.55.55.jpeg`), adottando un tema scuro, layout pulito, data visualization specifica (card, grafici), e tipografia definita.

---

**Fase 1: Setup Navigazione & Flusso di Autenticazione**

1.  **Struttura Navigazione Principale:**
    *   **Obiettivo:** Definire la navigazione radice che mostra lo stack di autenticazione o quello dell'app in base allo stato utente.
    *   **Componenti Concettuali (`RootNavigator`):** Utilizza `useAuth` per `user` e `loading`. Mostra `SplashScreen` durante il caricamento, altrimenti renderizza `AuthNavigator` (se `user` è null) o `AppNavigator` (se `user` esiste).
2.  **Navigatore di Autenticazione (`AuthNavigator`):**
    *   **Obiettivo:** Gestire le schermate di login e registrazione.
    *   **Tipo:** Stack Navigator.
    *   **Schermate:** `LoginScreen`, `RegisterScreen`.
3.  **Navigatore Principale dell'App (`AppNavigator`):**
    *   **Obiettivo:** Contenere la navigazione principale post-autenticazione, rispecchiando il tab bar del mockup.
    *   **Tipo:** Tab Navigator (`createBottomTabNavigator`) con stile personalizzato per aderire al tema scuro del mockup.
    *   **Schede (Tabs) - nuova struttura:**
        *   `Map`: Schermata principale con la mappa per il tracciamento, include un pulsante di impostazioni (icona ingranaggio) nell'header.
        *   `Search`: Schermata per cercare gli utenti tramite username o altri parametri.
        *   `Explore`: Schermata che contiene due sub-tab interne nella parte alta:
            * `Friends`: Mostra i feed condivisi dagli amici/following dell'utente.
            * `Global`: Mostra i feed globali più popolari (per visite, reazioni, commenti).
        *   `Profile`: Schermata del profilo utente che integra anche statistiche personali e storico tracciati.
    *   **Nesting:** Ogni scheda conterrà probabilmente uno Stack Navigator per gestire la navigazione interna (es. Profile -> Trip Detail).
4.  **Schermate di Autenticazione (UI & Logica):**
    *   **Obiettivo:** Implementare le UI di Login/Registrazione e collegarle ad `AuthContext`.
    *   **Componenti (`src/screens/Auth/...`):** Creare form standard per l'inserimento dati, pulsanti, gestione errori/loading da `useAuth`, e chiamare `login`/`register` da `useAuth`.
5.  **Testing Flusso Base:**
    *   Verificare la navigazione condizionale (Auth vs App stacks).
    *   Testare login/registrazione (con sync backend) e logout.
    *   Assicurarsi che il Tab Navigator principale venga mostrato dopo l'autenticazione.

---

**Fase 2: Funzionalità Base (Map, Search, Explore, Profile)**

6.  **Schermata Mappa/Tracciamento (`MapScreen`):**
    *   **Obiettivo:** Visualizzare la mappa, permettere l'avvio/stop del tracking, mostrare dati in tempo reale come nel mockup.
    *   **Componenti (`src/screens/MapScreen.js`):**
        *   Richiesta Permessi Localizzazione (`expo-location`).
        *   **Integrazione Mappa Mapbox:** Utilizza `@rnmapbox/maps` (`MapboxGL.MapView`) per visualizzare la mappa. Configura stile mappa (es. stile scuro predefinito o custom). Mostra la posizione attuale dell'utente.
        *   **UI (basata sul mockup):**
            *   Icona utente (GC nel mockup) in alto a sinistra.
            *   **Icona impostazioni (ingranaggio)** in alto a destra che apre `SettingsScreen`.
            *   Indicatore velocità attuale (cerchio scuro con velocità in km/h) visibile durante il tracking.
            *   Overlay inferiore:
                *   Stato Inattivo: Pulsante "Start Tracking".
                *   Stato Attivo: Timer (durata), Distanza (km), Velocità Media (km/h) visualizzati orizzontalmente. Pulsante "Stop Tracking".
        *   **Logica di Tracking:**
            *   Usa `expo-location` per ottenere aggiornamenti posizione (`watchPositionAsync`).
            *   Memorizza i punti rotta (lat, lng, speed, altitude, timestamp).
            *   Aggiorna dinamicamente la polyline sulla mappa Mapbox (`MapboxGL.ShapeSource` con `MapboxGL.LineLayer`).
            *   Calcola e aggiorna le statistiche live (durata, distanza, velocità media).
        *   **Salvataggio:** Al "Stop", presenta una modale o naviga a una schermata di riepilogo per aggiungere `description`, `tags`, `isPublic`, selezionare `vehicleId` e inviare i dati (`POST /api/tracks`).
7.  **Schermata Ricerca Utenti (`SearchScreen`):**
    *   **Obiettivo:** Permettere la ricerca di altri utenti dell'app.
    *   **Componenti (`src/screens/SearchScreen.js`):**
        *   Campo di ricerca con auto-completamento.
        *   Chiama `GET /api/users/search?q=query` per cercare utenti.
        *   Visualizza risultati in una `FlatList` con `UserSearchItem`.
        *   Al tocco su un risultato, naviga a `PublicProfileScreen` passando `username`.
        *   **Opzionale:** Filtri avanzati (es. cerca per veicolo, regione, interessi).
        *   **Recenti:** Mostra ricerche recenti salvate localmente.
8.  **Schermata Esplora (`ExploreScreen`):**
    *   **Obiettivo:** Mostrare i feed degli amici e quelli globali più popolari.
    *   **Componenti (`src/screens/ExploreScreen.js`):**
        *   **Tab Superiori:** Usa `createMaterialTopTabNavigator` per implementare le tab "Friends" e "Global".
        *   **Tab Friends (`FriendsFeedScreen`):**
            *   Chiama `GET /api/social/feed/friends` per recuperare i feed degli amici.
            *   Usa `FlatList` per visualizzare i tracciati condivisi dagli amici.
            *   Componente `TrackCard` per ogni tracciato (con mappa statica Mapbox preview).
            *   Pull-to-refresh per aggiornare i feed.
        *   **Tab Global (`GlobalFeedScreen`):**
            *   Chiama `GET /api/social/feed/popular` per recuperare i feed globali popolari.
            *   Stessa UI di `FriendsFeedScreen` ma con tracciati globali.
            *   **Opzionale:** Filtri per le diverse metriche di popularità (visite, reactions, commenti).
9.  **Schermata Profilo Utente (`ProfileScreen`):**
    *   **Obiettivo:** Integrare profilo utente, statistiche e storico tracciati in un'unica schermata.
    *   **Componenti (`src/screens/ProfileScreen.js`):**
        *   **Header Profilo:** Foto profilo, nome utente, bio, conteggio following/followers, ecc.
        *   **Pulsante Modifica Profilo:** Naviga a `EditProfileScreen`.
        *   **Sezione Statistiche:**
            *   Chiama `GET /api/analytics/summary` (o recupera da `useAuth().user.statistics`).
            *   **Grid Statistiche:** Visualizza le card per Total Distance, Total Time, Top Speed, Avg Speed. Formattare i valori in modo leggibile (es. km, ore/minuti, km/h).
            *   **Grafico Distribuzione Velocità:** Grafico a barre che mostra il tempo/distanza trascorso in diversi range di velocità.
        *   **Sezione Storico Tracciati:**
            *   Titolo "I miei tracciati" con conteggio.
        *   Chiama `GET /api/tracks/list` per recuperare i tracciati dell'utente.
            *   Usa `FlatList` con paginazione per visualizzare l'elenco dei tracciati.
            *   **Componente `TripHistoryItem`:** Mostra data/ora, durata, distanza (km), velocità media (km/h). Include una freccia/indicatore per la navigazione.
        *   Al tocco di un item, naviga a `TripDetailScreen` passando l'ID del tracciato.
        *   Implementa "Pull to Refresh".
10. **Schermata Dettaglio Tracciato (`TripDetailScreen`):**
    *   **Obiettivo:** Visualizzare i dettagli completi di un singolo tracciato, rispecchiando il mockup.
    *   **Componenti (`src/screens/TripDetailScreen.js`):**
        *   Riceve `trackId` come parametro di navigazione. Chiama `GET /api/tracks/:id`.
        *   **Mappa Mapbox:** Mostra la mappa (`MapboxGL.MapView`) con il percorso del tracciato (polyline), start/end markers.
        *   **Legenda Velocità (basata sul mockup):** Visualizza la legenda con i range di velocità colorati. La polyline sulla mappa dovrebbe essere colorata in base a questi range (richiede logica di segmentazione/styling della polyline Mapbox).
        *   **Card Dati (basate sul mockup):**
            *   "Travel Time Comparison" (se i dati attesi sono disponibili/calcolabili).
            *   Statistiche principali: Distanza, Avg Speed, Max Speed, High Speed Time (tempo sopra una certa soglia, es. 200 km/h).
        *   **Grafico Velocità (basato sul mockup):** Grafico "Speed Over Time" (usa una libreria di grafici come `react-native-chart-kit` o `victory-native`).
        *   **Pulsanti Interazione:** Like, Commento, Condivisione.
        *   **Opzionale:** Pulsanti Modifica/Elimina se l'utente è proprietario.
        *   **Sezione Commenti:** Lista commenti con input per aggiungerne di nuovi.
11. **Schermata Impostazioni (`SettingsScreen`):**
    *   **Obiettivo:** Fornire accesso a impostazioni, veicoli, preferenze e logout.
    *   **Componenti (`src/screens/SettingsScreen.js`):**
        *   Opzioni per navigare a:
            *   `VehicleNavigator` (per gestire i veicoli)
            *   `PreferencesScreen` (units, privacy, notifications)
            *   `AccountScreen` (gestione account, sicurezza)
        *   Pulsante "Logout" che chiama `useAuth().logout()`.

---

**Fase 3: Funzionalità Core di Tracciamento**

12. **Servizio di Geolocalizzazione (`src/services/locationService.js`):**
    *   **Obiettivo:** Creare un servizio centralizzato per la gestione della geolocalizzazione e ottimizzazione del tracciamento.
    *   **Componenti:**
        *   **Configurazione iniziale:** Funzioni per richiedere e verificare i permessi di localizzazione (`requestPermissions`, `checkPermissions`).
        *   **Modalità di tracciamento:** Implementare diverse modalità di tracciamento con configurazioni ottimizzate:
            *   `HIGH_ACCURACY`: Per tracciamento ad alta precisione (distanceFilter basso, maggiore frequenza aggiornamenti).
            *   `BALANCED`: Per equilibrio tra precisione e risparmio batteria.
            *   `BATTERY_SAVING`: Per tracciamento prolungato con minore impatto batteria.
        *   **Gestione Tracciamento:**
            *   `startTracking(mode, callback)`: Avvia il tracciamento con la precisione desiderata.
            *   `stopTracking()`: Ferma il tracciamento e rilascia le risorse.
            *   `pauseTracking()`: Sospende temporaneamente il tracciamento.
            *   `resumeTracking()`: Riprende un tracciamento sospeso.
        *   **Background Tracking:** Implementare il supporto per il tracciamento in background utilizzando `expo-task-manager` e configurando task di background appropriati.
        *   **Ottimizzazione Batteria:**
            *   Algoritmi per filtrare punti ridondanti (es. stationary detection).
            *   Dynamic accuracy adjustments in base al movimento e livello batteria.
            *   Smart waypoint detection per ridurre punti registrati durante movimento uniforme.
        *   **Gestione errori di localizzazione:** Strategie di fallback e notifiche all'utente.
    
13. **Context Tracciamento (`src/context/TrackingContext.js`):**
    *   **Obiettivo:** Fornire uno stato globale per le funzionalità di tracciamento accessibile da qualsiasi componente.
    *   **Componenti:**
        *   **Stato:** `isTracking`, `currentTrack`, `currentStats`, `trackingMode`
        *   **Azioni:** `startNewTrack()`, `pauseCurrentTrack()`, `resumeCurrentTrack()`, `finalizeTrack()`, `discardTrack()`
        *   **Utilità:** `getFormattedDuration()`, `getFormattedDistance()`, `getFormattedSpeed()`
        *   **Calcoli in tempo reale:** Funzioni per calcolare statistiche live come velocità media, durata, calorie consumate, ecc.
        *   **Integration:** Integrazione con `locationService` per la gestione degli aggiornamenti posizione.

14. **Schermata Tracciamento Avanzata (`src/screens/TrackingScreen.js`):**
    *   **Obiettivo:** Estendere `MapScreen` con funzionalità avanzate di tracciamento e visualizzazione dati in tempo reale.
    *   **Componenti:**
        *   **Integrazione `locationService`:** Sostituire la logica diretta di `expo-location` con il servizio creato.
        *   **Modalità di Tracciamento:**
            *   Standard: Tracciamento normale (bilancia precisione e consumo batteria).
            *   Preciso: Acquisizione più frequente per attività che richiedono dettaglio.
            *   Economico: Riduce acquisizioni per risparmiare batteria.
        *   **UI Avanzata:**
            *   Indicatore grafico stato GPS (precisione attuale).
            *   Indicatore stato batteria e avvisi livello critico.
            *   Visualizzazione altitudine corrente e grafico profilo altimetrico in tempo reale (opzionale).
            *   Mini-mappa overview (zoom out) con tracciato completo.
        *   **Interfaccia utente migliorata:**
            *   Modalità a schermo intero ottimizzata per il tracking.
            *   Pannello di informazioni collassabile con swipe gesture.
            *   Visualizzazione degli indicatori di performance (velocità, cadenza, altitudine) con grafica intuitiva.
            *   Barra del tempo trascorso con lap timer opzionale.
        *   **Controlli avanzati:**
            *   Pulsanti per pause/resume del tracciamento.
            *   Modalità di tracking rapido con presets (moto, bicicletta, auto).
            *   Aggiunta waypoint manuale durante il tracciamento.
            *   Opzione per registrare note vocali o testuali durante il tracking.
        *   **Mapbox Enhanced:**
            *   Visualizzazione colorata in tempo reale del percorso basata sulla velocità.
            *   Transizioni fluide della camera tra punti rilevanti.
            *   Modalità 3D per visualizzazione altitudine (ove supportato).
            *   Minimap per contesto geografico generale.
        *   **HUD (Head-Up Display):**
            *   Overlay semitrasparente con indicatori per:
                *   Velocità attuale con visualizzazione colorata in base al range.
                *   Indicatore di direzione e bussola.
                *   Altitudine e pendenza (se rilevanti).
                *   Distanza percorsa e tempo trascorso.
            *   Suggerimenti contestuali in base all'attività.
        *   **Funzionalità Auto:**
            *   Auto-pause quando il movimento si ferma (semafori, soste).
            *   Rilevamento automatico inizio/fine attività (opzionale).
            *   Notifiche vocali periodiche sulle performance (tramite Text-to-Speech).
        

15. **Schermata Dettaglio Tracciato Avanzata** (`src/screens/TrackDetailScreen.js`):
    *   **Obiettivo:** Estendere la visualizzazione dettagli con analisi avanzate e rendering ottimizzato.
    *   **Componenti:**
        *   **Analisi Avanzate:**
            *   Segmentazione automatica del percorso (basata su pausa, velocità, tipo di strada).
            *   Calcolo zone di velocità (tempo trascorso in ciascun range).
            *   Rilevamento automatico di pattern (accelerazioni, frenate, curve).
        *   **Visualizzazione Mappa Multi-Layer:**
            *   Layer base: percorso completo.
            *   Layer velocità: colorazione dinamica in base ai range di velocità.
            *   Layer altitudine: gradienti per visualizzare cambi di elevazione.
            *   Layer personalizzati: punti di interesse, waypoint manuali, foto.
        *   **Grafici Interattivi:**
            *   Grafico velocità/tempo con zoom e pan.
            *   Grafico altitudine/distanza con indicatore correlato alla posizione sulla mappa.
            *   Distribuzione velocità (istogramma).
            *   Comparativa tra segmenti simili (se disponibili).
        *   **Opzioni Avanzate Esportazione:**
            *   Export GPX/KML per compatibilità con altre app.
            *   Condivisione report PDF con statistiche e mappe.
            *   Export dati raw per analisi esterne.
        *   **Metadati Avanzati:**
            *   Condizioni meteo durante il tracciato (integrazione API meteo).
            *   Tipo di terreno (basato su dati Mapbox).
            *   Statistiche derivate (accelerazioni, tempo di recupero, ecc.).


16. **Schermata Dettaglio Tracciato Completa (`src/screens/TrackDetailScreen.js`):**
    *   **Obiettivo:** Implementare una visualizzazione completa e interattiva del tracciato completato.
    *   **Componenti:**
        *   **Visualizzazione Mappa Interattiva:**
            *   Percorso completo con segmentazione colorata basata sulla velocità.
            *   Pin di inizio/fine con animazioni.
            *   Highlight di punti significativi (soste, cambi direzione, velocità massima/minima).
            *   Controlli di zoom/pan ottimizzati per la visualizzazione del tracciato.
            *   Toggle per visualizzazione satellite/stradale/ibrida.
        *   **Statistiche Avanzate:**
            *   Grafici interattivi (scrollable, zoomable):
                *   Velocità vs Tempo
                *   Altitudine vs Distanza
                *   Accelerazione vs Tempo
                *   Distribuzione velocità (istogramma)
            *   Metriche calcolate:
                *   Tempi di segmento (divisi per km/miglia)
                *   Zone di velocità (tempo speso in diverse fasce)
                *   Accelerazione/decelerazione massima
                *   Comparazione con medie personali o storiche
        *   **Metadati e Tag:**
            *   Form di editing per descrizione e note.
            *   Sistema di tagging intelligente con suggestions.
            *   Weather data integration (recupero condizioni meteo al momento del tracking).
            *   Impostazioni di privacy (pubblico, amici, privato).
        *   **Interazioni Social Estese:**
            *   Sistema commenti avanzato con supporto per menzioni e risposte.
            *   Reazioni differenziate (wow, incredibile, dubbioso).
            *   Funzione "sfida" per invitare gli amici a battere i record.
            *   Opzioni di condivisione multiple (social media, export GPX/KML, link diretto).
        *   **Action Menu:**
            *   Opzioni per editing/crop del tracciato.
            *   Funzionalità di esportazione (GPX, CSV, immagine).
            *   Integrazione con calendari fitness o app di allenamento (opzionale).

17. **Lista Tracciati Avanzata (`src/screens/TracksListScreen.js`):**
    *   **Obiettivo:** Fornire una visualizzazione organizzata e filtrabile di tutti i tracciati dell'utente.
    *   **Componenti:**
        *   **Filtri Avanzati:**
            *   Filtro per data (timeline, range calendar).
            *   Filtro per tipo di veicolo/attività.
            *   Filtro per distanza/durata/velocità media.
            *   Ricerca testuale su descrizioni e tag.
            *   Filtro per località (area geografica).
        *   **Visualizzazioni Personalizzabili:**
            *   **Vista Lista:** Dettagliata con preview mini-mappa.
            *   **Vista Calendario:** Tracciati organizzati per giorno/settimana/mese.
            *   **Vista Mappa:** Heatmap di attività o punti singoli.
            *   **Vista Griglia:** Con thumbnail delle mappe e key metrics.
        *   **Ordinamento Intelligente:**
            *   Per data (recenti/vecchi).
            *   Per "impressività" (combinazione di distanza, velocità, reazioni).
            *   Per località (raggruppamento geografico).
            *   Per durata o distanza.
        *   **Anteprima Intelligente:**
            *   Card con mini preview mappa statica per ogni tracciato.
            *   Indicatori visivi per metriche chiave (icone personalizzate).
            *   Quick-action buttons (condividi, modifica, elimina).
            *   Swipe actions per operazioni rapide.
        *   **Statistiche Aggregate:**
            *   Header sezione con totali del periodo filtrato.
            *   Grafici trend (es. distanza settimanale/mensile).
            *   Record personali evidenziati.
            *   Comparazione con periodi precedenti.

---

**Fase 4: Funzionalità Social e Foto**

18. **Schermata Foto (`src/screens/PhotoScreen.js`):**
    *   **Obiettivo:** Implementare una funzionalità per catturare, geolocalizzare e condividere foto durante i tracciati.
    *   **Componenti:**
        *   **Integrazione Camera:**
            *   Utilizzo di `expo-camera` per accesso diretto alla fotocamera.
            *   Overlay UI con indicatori di geolocalizzazione (coordinate, altitudine).
            *   Controlli avanzati (flash, HDR, griglia, timer).
            *   Supporto per galleria (selezione foto esistenti) con `expo-image-picker`.
        *   **Geolocalizzazione Automatica:**
            *   Tag di posizione GPS su ogni foto scattata.
            *   Option per associare la foto al tracciato attivo (se presente).
            *   Overlay informativo che mostra la posizione attuale e direzione.
            *   Auto-tagging di località note (se vicine) tramite reverse geocoding.
        *   **Preview e Editing:**
            *   Preview immediata della foto scattata.
            *   Strumenti di editing base (crop, filtri, luminosità/contrasto).
            *   Aggiunta tag e descrizione con menzioni utente.
            *   Mini-mappa che mostra la posizione della foto.
        *   **Upload e Condivisione:**
            *   Upload ottimizzato con progress indicator.
            *   Opzioni di compressione intelligente.
            *   Privacy settings (pubblico, amici, privato).
            *   Share options integrate con piattaforme social.
            *   Funzionalità background upload per foto multiple.
        *   **Visualizzazione Timeline:**
            *   Modalità galleria organizzata cronologicamente.
            *   Visualizzazione mappa con cluster di foto per zona.
            *   Funzionalità di ricerca per località o data.

19. **Feed Activity (`src/screens/FeedScreen.js`):**
    *   **Obiettivo:** Creare un feed social ricco e interattivo che integri tracciati, foto e attività degli utenti seguiti.
    *   **Componenti:**
        *   **UI del Feed:**
            *   Design moderno con card personalizzate per diversi tipi di contenuto.
            *   Infinite scroll con skeleton loading placeholders.
            *   Pull-to-refresh con animazioni personalizzate.
            *   Notifiche di nuovi contenuti disponibili.
        *   **Tipi di Card:**
            *   **Track Card:** Preview mappa, statistiche chiave, reazioni.
            *   **Photo Card:** Foto con indicatore posizione, descrizione, tag.
            *   **Achievement Card:** Celebrazioni di obiettivi raggiunti.
            *   **Challenge Card:** Aggiornamenti su sfide in corso o completate.
            *   **Milestone Card:** Celebrazioni di traguardi significativi (es. 1000km totali).
        *   **Preview Tracciati Interattive:**
            *   Miniatura mappa con percorso evidenziato.
            *   Animazione play/rewind del percorso (time-lapse opzionale).
            *   Statistiche principali con visualizzazione grafica.
            *   Call-to-action per vedere dettagli completi.
        *   **Interazioni Social Complete:**
            *   Sistema commenti full-featured con supporto per rich media.
            *   Reazioni categorizzate (impressionato, ispirato, wow, etc.).
            *   Opzioni di bookmark/salvataggio per contenuti interessanti.
            *   Sharing diretto a contatti interni o piattaforme esterne.
        *   **Filtraggio Intelligente:**
            *   Toggle tra "All", "Tracks", "Photos", "Achievements".
            *   Filtro di rilevanza (most interesting first).
            *   Filtro geografico (attività vicino a me).
            *   Filtro temporale (today, this week, this month).

20. **Profilo Utente Avanzato (`src/screens/ProfileScreen.js`):**
    *   **Obiettivo:** Estendere il profilo utente con funzionalità sociali avanzate e visualizzazione personalizzata.
    *   **Componenti:**
        *   **Header Profilo Dinamico:**
            *   Cover photo personalizzabile con effetti parallax.
            *   Avatar con supporto per bordi personalizzati (achievement-driven).
            *   Badge/icons di achievement significativi.
            *   Quick stats con visualizzazione grafica minimalista.
        *   **Statistiche Personalizzate:**
            *   Dashboard personalizzabile con metriche preferite.
            *   Grafici interattivi per trend temporali.
            *   Comparazione con periodo precedente (miglioramento/peggioramento).
            *   Record personali con evidenziazione.
            *   Heatmap attività annuale (stile GitHub contributions).
        *   **Galleria Multimediale:**
            *   Grid view per tracciati e foto con filtri.
            *   Visualizzazione a mappa con cluster per zona.
            *   Ordinamento personalizzabile (recenti, popolari, preferiti).
            *   Quick-preview con gesture (long press per details).
        *   **Gestione Connections Avanzata:**
            *   Lista following/followers con ricerca e filtri.
            *   Suggerimenti amicizia basati su interessi/località.
            *   Livelli di privacy per contenuti condivisi (tutti, amici, selezionati).
            *   Activity feed filtrato per utente selezionato.
        *   **Customizzazione Profilo:**
            *   Temi e colori personalizzabili.
            *   Bio estesa con supporto per link e hashtag.
            *   Preferenze di condivisione automatica.
            *   Integrazione social accounts esterni.

21. **Esplorazione Avanzata (`src/screens/ExploreScreen.js`):**
    *   **Obiettivo:** Creare un'esperienza di esplorazione immersiva basata su mappa con contenuti geolocalizzati e suggerimenti personalizzati.
    *   **Componenti:**
        *   **Mappa Interattiva Esplorativa:**
            *   Visualizzazione full-screen con UI minimalista.
            *   Cluster di contenuti per zona con indicatori di densità.
            *   Filtri per tipo (tracciati, foto, POI, users).
            *   Radar view per contenuti nelle vicinanze con indicatori di distanza.
            *   3D terrain visualization (ove supportato da Mapbox).
        *   **Ricerca POI Avanzata:**
            *   Integrazione POI con categorie (ristoranti, attrazioni, punti panoramici).
            *   Suggerimenti basati sugli interessi dell'utente.
            *   Ricerca con filtri multipli (distanza, rating, categoria).
            *   Preview card con info essenziali e opzione navigazione.
        *   **Tracciati Pubblici Discovery:**
            *   Visualizzazione heatmap di zone popolari.
            *   Filtri specializzati (tipo veicolo, difficoltà, lunghezza).
            *   Suggerimenti personalizzati basati su preferenze/storia utente.
            *   Ordinamento per popolarità, data, valutazione.
        *   **Community Hotspots:**
            *   Evidenziazione zone con alta attività recente.
            *   Eventi comunitari geolocalizzati (meetup, gare, eventi).
            *   Challenges geografiche (completare percorsi specifici).
            *   Top users per zona con miniatura profilo e stats.
        *   **Navigation & Routing:**
            *   Funzione "Navigate to" per POI o start point di tracciati.
            *   Route preview con statistiche stimate.
            *   Opzioni percorso multiple (più veloce, più panoramico).
            *   Bookmark locations per accesso rapido.

---

**Fase 5: Altre Funzionalità Chiave**


22. **Gestione Veicoli** (`src/screens/VehiclesScreen.js`):
    *   **Obiettivo:** Permettere agli utenti di gestire i propri veicoli e visualizzare statistiche specifiche.
    *   **Componenti:**
        *   **Dashboard Veicoli:**
            *   Lista veicoli con thumbnail, nome, tipo, statistiche chiave.
            *   Indicatori stato (attivo, preferito, ultima attività).
            *   Quick toggle per veicolo predefinito.
        *   **Dettaglio Veicolo:**
            *   Galleria foto veicolo con possibilità aggiunta/rimozione.
            *   Scheda tecnica (marca, modello, anno, specifiche).
            *   Maintenance log (opzionale - promemoria tagliandi, etc).
            *   Timeline attività associate.
        *   **Aggiunta/Modifica:**
            *   Form step-by-step con validazione.
            *   Categorie predefinite + custom.
            *   Upload multiple foto con editor.
            *   Campi personalizzati per tipo veicolo.
        *   **Statistiche per Veicolo:**
            *   Dashboard dedicata per veicolo selezionato.
            *   Grafici comparativi tra veicoli.
            *   Heatmap utilizzo (giorni/orari).
            *   Record personali per veicolo.
        *   **Condivisione:**
            *   Generazione scheda veicolo condivisibile.
            *   Privacy setting per visibilità dettagli.
            *   Link a marketplace/community dedicate (opzionale).

23. **Impostazioni Avanzate** (`src/screens/SettingsScreen.js`):
    *   **Obiettivo:** Fornire controllo completo su preferenze, privacy e dati utente.
    *   **Componenti:**
        *   **Preferenze Utente:**
            *   Tema UI (dark/light/system).
            *   Unità di misura (metriche/imperiali).
            *   Format data/ora.
            *   Lingua app.
            *   Preferenze mappa (stile, dettaglio, orientamento).
        *   **Privacy e Visibilità:**
            *   Default privacy nuovi contenuti.
            *   Granularità posizione condivisa.
            *   Visibilità profilo (pubblico, solo follower, privato).
            *   Controlli interazioni social.
            *   Blocklist gestione.
        *   **Notifiche:**
            *   Matrice configurazione per tipo notifica/canale.
            *   Schedule notifiche (non disturbare).
            *   Preview notifiche recenti.
            *   Notifiche push vs in-app.
        *   **Account e Sicurezza:**
            *   Gestione email/password.
            *   Connessione account social.
            *   Download dati personali.
            *   Opzioni cancellazione account.
        *   **Esportazione Dati:**
            *   Export completo (JSON, CSV).
            *   Export selettivo (solo specifici tracciati).
            *   Integrazione con servizi terzi (Strava, Google Fit, etc).
            *   Scheduling backup automatici (cloud storage).
        *   **Avanzate:**
            *   Tracking settings (precisione, frequenza).
            *   Cache management.
            *   Debug mode (per supporto).
            *   Beta features toggle.

24. **Achievement/Gamification** (`src/screens/AchievementsScreen.js`):
    *   **Obiettivo:** Implementare sistema motivazionale basato su obiettivi e sfide.
    *   **Componenti:**
        *   **Dashboard Achievement:**
            *   Grid badge conquistati con dettaglio al tap.
            *   Categorie achievement (distanza, velocità, esplorazione, social).
            *   Percentuali completamento e next milestone.
            *   Timeline storica conquiste.
        *   **Sfide Attive:**
            *   Lista sfide correnti con progress tracker.
            *   Timer countdown per sfide a tempo limitato.
            *   Dettaglio requisiti e ricompense.
            *   Join/Leave sfide opzionali.
        *   **Leaderboard:**
            *   Classifiche globali, per amici e per area geografica.
            *   Filtri per categoria (distanza, velocità, esplorazione).
            *   Timeframe selezionabile (giornaliera, settimanale, mensile, all-time).
            *   Dettaglio performance per posizione.
        *   **Sistema Ricompense:**
            *   Badge permanenti per traguardi notevoli.
            *   Ricompense virtuali (personalizzazione UI, filtri foto esclusivi).
            *   XP e level system con vantaggi progressivi.
            *   Integrazione con possibili partnership (sconti, offerte).
        *   **Sfide Community:**
            *   Sfide create dagli utenti con regole personalizzate.
            *   Eventi tematici stagionali.
            *   Sfide di gruppo con obiettivi collettivi.
            *   Social sharing risultati con statistiche comparative.