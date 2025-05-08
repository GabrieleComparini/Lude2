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

**Fase 3: Funzionalità Avanzate & Integrazioni**

12. **Integrazione Upload Immagini:**
    *   **Obiettivo:** Permettere il caricamento di immagini per profilo e veicoli.
    *   **Componenti:** Integra `expo-image-picker` nelle schermate `EditProfileScreen` e `Add/EditVehicleScreen`.
    *   **Logica:** Prima di chiamare le API PUT/POST per aggiornare/creare, carica l'immagine selezionata su Cloudinary (potrebbe richiedere una chiamata separata a un endpoint backend dedicato all'upload o una gestione diretta con l'SDK Cloudinary client-side, meno sicura per le chiavi). Passa l'URL Cloudinary risultante alle API di salvataggio profilo/veicolo.
13. **Profilo Pubblico & Interazioni Sociali:**
    *   **Obiettivo:** Permettere la visualizzazione di profili pubblici e interazioni tra utenti.
    *   **Componenti (`src/screens/PublicProfileScreen.js`):**
        *   Simile a `ProfileScreen` ma con dati di altri utenti.
        *   Chiama `GET /api/users/:username` per recuperare dati profilo.
        *   Pulsanti Follow/Unfollow (se non è già seguito).
        *   Visualizza tracciati pubblici dell'utente.
    *   **Componenti (`src/screens/ConnectionsScreen.js`):**
        *   Tab "Following" e "Followers".
        *   Visualizza lista di utenti con pulsanti per seguire/smettere di seguire.
14. **Gamification UI:**
    *   Implementare `AchievementsScreen`, `LeaderboardsScreen`, `ChallengesScreen` con chiamate alle rispettive API backend, visualizzando i dati in modo chiaro e coinvolgente, seguendo lo stile generale dell'app.
15. **Analytics UI:**
    *   Implementare visualizzazione grafici avanzati (`react-native-chart-kit` o simile) per i trend e la distribuzione velocità nella sezione statistiche del profilo. Implementare la funzione di export dati.

---

**Fase 4: UI/UX Refinement, Testing & Ottimizzazione**

16. **Polish UI/UX:** Raffinare l'interfaccia, animazioni, feedback utente per aderire al mockup e migliorare l'esperienza.
17. **Gestione Errori:** Implementare gestione robusta degli errori API e di sistema.
18. **Ottimizzazione:** Ottimizzare performance di liste, mappe, calcoli.
19. **Testing:** Testare su simulatore iOS e dispositivi fisici. Aggiungere unit/integration/E2E test.

---

Questa guida aggiornata dovrebbe darti una direzione più precisa per lo sviluppo frontend, tenendo conto dell'uso di Mapbox e del design del mockup fornito. La struttura di navigazione è stata rivista come richiesto, con le 4 tab principali (Map, Search, Explore, Profile) e la riorganizzazione delle funzionalità associate.
