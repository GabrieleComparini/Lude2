# Lude (Track Master) - Piano Dettagliato di Implementazione

## Panoramica

Lude (Track Master) è un'applicazione social multipiattaforma focalizzata sul tracciamento di percorsi in auto/moto, con funzionalità per condividere itinerari e foto geolocalizzate. L'applicazione permette agli utenti di registrare i propri spostamenti e decidere se mantenere i percorsi privati, condividerli con i propri follower o renderli pubblici. Questo documento fornisce un piano dettagliato per l'implementazione dell'applicazione dalla prototipazione iniziale alla versione completamente funzionante su AWS.

## Fase 1: Configurazione Ambiente di Sviluppo

### 1.1 Setup Progetto Base

1. **Struttura del progetto** (monorepo):
   ```
   lude/
   ├── apps/
   │   ├── server/        # Backend Node.js/Express
   │   ├── admin/         # Admin Panel (Next.js)
   │   ├── mobile/        # App mobile React Native/Expo
   │   └── web/           # Frontend Web Next.js
   ├── packages/          # Pacchetti condivisi
   │   ├── config/        # Configurazioni comuni
   │   └── ui/            # Componenti UI condivisi
   └── docs/              # Documentazione
   ```

2. **Inizializzazione del repository**:
   ```bash
   mkdir -p lude/{apps/{server,admin,mobile,web},packages/{config,ui},docs}
   cd lude
   git init
   npm init -y
   # Configurazione di .gitignore per Node.js, React Native ed environment files
   ```

### 1.2 Setup Servizi per Prototipazione

1. **Database**: 
   - MongoDB Atlas (tier gratuito - 512MB)
   - Creare un cluster condiviso gratuito
   - Configurare l'IP whitelist per consentire l'accesso da qualsiasi posizione durante lo sviluppo

2. **Autenticazione**:
   - Firebase Authentication (piano gratuito Spark)
   - Abilitare autenticazione email/password e autenticazione con Google

3. **Storage**:
   - Cloudinary (piano gratuito per immagini)
   - Registrare un account e ottenere le credenziali API

4. **Hosting Backend**:
   - Render (piano gratuito per web service)
   - Registrare un account per il deployment del backend

5. **Hosting Mobile App**:
   - Expo (piano gratuito)
   - EAS per build e distribuzione

6. **Mappe e Geolocalizzazione**:
   - React Native Maps per integrazione nativa con Expo
   - Preferire componenti nativamente supportati da Expo

7. **CI/CD**:
   - GitHub Actions
   - Configurare workflow per test e deployment automatizzato

## Fase 2: Implementazione del Backend (Node.js/Express)

### 2.1 Setup Iniziale Backend

1. **Navigare nella directory del server**:
   ```bash
   cd apps/server
   npm init -y
   ```

2. **Installare dipendenze core**:
   ```bash
   npm install express mongoose dotenv cors firebase-admin cloudinary express-validator jsonwebtoken helmet compression
   npm install -D nodemon
   ```

3. **Struttura directory backend**:
   ```
   server/
   ├── src/
   │   ├── config/        # Configurazioni (DB, Firebase, ecc.)
   │   ├── controllers/   # Logica di gestione richieste
   │   ├── middleware/    # Middleware (auth, validation, ecc.)
   │   ├── models/        # Modelli dati MongoDB
   │   ├── routes/        # Definizioni route API
   │   ├── services/      # Logica business separata
   │   ├── utils/         # Funzioni helper
   │   └── server.js      # Entry point dell'applicazione
   ├── .env               # Variabili d'ambiente (non committare)
   └── package.json
   ```

### 2.2 Configurazione Database e Servizi

1. **Configurazione MongoDB**:
   - Creare file `src/config/database.js` per la connessione MongoDB Atlas
   - Utilizzare la stringa di connessione da .env

2. **Configurazione Firebase Admin**:
   - Scaricare il service account JSON da Firebase Console
   - Creare `src/config/firebaseAdmin.js` per l'inizializzazione

3. **Configurazione Cloudinary**:
   - Creare `src/config/cloudinary.js` per inizializzare l'SDK
   - Utilizzare chiavi da .env

### 2.3 Modelli Dati MongoDB

1. **User Model** (`src/models/User.js`):
   - Campi base: `firebaseUid`, `email`, `username`, `name`, `profileImage`, `bio`
   - Campo `role` per distinzione tra utenti normali e admin (`enum: ['user', 'admin']`)
   - Preferenze utente: `preferences` (unità di misura, privacy, notifiche)
   - Statistiche: `statistics` (distanza totale, tempo, velocità media/max)
   - Relazioni social: `connections`, `followers`

2. **Vehicle Model** (`src/models/Vehicle.js`):
   - Campi base: `userId`, `name`, `type`, `make`, `model`, `year`
   - Dati tecnici: `specs` (cilindrata, carburante, potenza)
   - Statistiche: `stats` (distanza, tempo, velocità media/max)
   - Immagine: `image` (URL Cloudinary)

3. **Track Model** (`src/models/Track.js`):
   - Riferimenti: `userId`, `vehicleId`
   - Dati geografici: `route` (GeoJSON LineString), `startPoint`, `endPoint` (GeoJSON Point)
   - Tempi: `startTime`, `endTime`, `duration`
   - Statistiche: `stats` (distanza, velocità, elevazione)
   - Dati contestuali: `weather`
   - Social: `privacy`, `likes`, `comments`

4. **Photo Model** (`src/models/Photo.js`):
   - Riferimenti: `userId`, `trackId` (opzionale)
   - Media: `imageUrl`, `thumbnailUrl`
   - Geo: `location` (GeoJSON Point)
   - Metadata: `title`, `description`, `takenAt`, `exif`
   - Social: `privacy`, `likes`, `comments`

5. **POI Model** (`src/models/POI.js`):
   - Riferimento: `userId`
   - Geo: `location` (GeoJSON Point)
   - Info: `name`, `description`, `type`, `category`
   - Media: `images`
   - Review: `rating`, `reviews`

### 2.4 Implementazione API Routes

1. **Auth Routes** (`src/routes/authRoutes.js`):
   - POST `/api/auth/sync` - Sincronizzazione utente Firebase con DB
   - GET `/api/auth/verify` - Verifica token e sessione
   - POST `/api/auth/create-admin` - Creazione utente admin (protetto)

2. **User Routes** (`src/routes/userRoutes.js`):
   - GET/PUT `/api/users/profile` - Gestione profilo utente
   - GET `/api/users/:username` - Profilo pubblico utente
   - GET `/api/users/search` - Ricerca utenti
   - POST/DELETE `/api/users/:id/follow` - Seguire/smettere di seguire utenti
   - GET `/api/users` - Lista utenti (solo admin)
   - PUT `/api/users/:id/role` - Modifica ruolo utente (solo admin)

3. **Vehicle Routes** (`src/routes/vehicleRoutes.js`):
   - GET/POST `/api/vehicles` - Lista veicoli / Aggiunge nuovo veicolo
   - GET/PUT/DELETE `/api/vehicles/:id` - Operazioni su veicolo specifico
   - GET `/api/vehicles/stats` - Statistiche per veicolo

4. **Track Routes** (`src/routes/trackRoutes.js`):
   - POST `/api/tracks` - Salvataggio percorso completo
   - GET `/api/tracks/:id` - Dettagli percorso
   - GET `/api/tracks/list` - Lista percorsi utente (con filtri)
   - GET `/api/tracks/public` - Percorsi pubblici (con filtri spaziali)
   - GET `/api/tracks/nearby` - Percorsi vicini a una posizione
   - PUT/DELETE `/api/tracks/:id` - Aggiorna/elimina percorso

5. **Photo Routes** (`src/routes/photoRoutes.js`):
   - POST `/api/photos` - Upload nuova foto geolocalizzata
   - GET `/api/photos/list` - Foto dell'utente (con filtri)
   - GET `/api/photos/nearby` - Foto vicine a una localizzazione
   - GET/PUT/DELETE `/api/photos/:id` - Operazioni su foto specifica

6. **POI Routes** (`src/routes/poiRoutes.js`):
   - GET `/api/pois/nearby` - POI vicini a una localizzazione
   - POST `/api/pois` - Aggiunta nuovo POI
   - GET/PUT/DELETE `/api/pois/:id` - Operazioni su POI specifico

7. **Social Routes** (`src/routes/socialRoutes.js`):
   - GET `/api/social/feed` - Feed attività dei following
   - POST `/api/social/comments/:resourceId` - Commenti su risorse
   - GET `/api/social/comments/:resourceId` - Ottiene commenti
   - POST/DELETE `/api/social/reactions/:resourceId` - Gestione reazioni

8. **Analytics Routes** (`src/routes/analyticsRoutes.js`):
   - GET `/api/analytics/summary` - Statistiche generali utente
   - GET `/api/analytics/trends` - Analisi trend temporali
   - GET `/api/analytics/heatmap` - Dati per heatmap percorsi
   - GET `/api/analytics/export` - Esportazione dati utente

9. **Admin Routes** (`src/routes/adminRoutes.js`):
   - GET `/api/admin/stats` - Statistiche generali piattaforma
   - GET `/api/admin/users` - Lista completa utenti con filtri
   - GET `/api/admin/tracks` - Lista completa percorsi con filtri
   - GET `/api/admin/photos` - Lista completa foto con filtri
   - DELETE `/api/admin/content/:type/:id` - Eliminazione contenuti

### 2.5 Middleware Essenziali

1. **Auth Middleware** (`src/middleware/authMiddleware.js`):
   - `protect`: Verifica token Firebase e ottiene utente
   - `adminOnly`: Verifica che l'utente abbia ruolo admin
   - `ownerOrAdmin`: Verifica proprietà risorsa o ruolo admin

2. **Upload Middleware** (`src/middleware/uploadMiddleware.js`):
   - Gestione upload immagini con multer
   - Integrazione con Cloudinary
   - Ottimizzazione e compressione immagini

3. **Geo Middleware** (`src/middleware/geoMiddleware.js`):
   - Validazione coordinate geografiche
   - Conversione formati geografici
   - Helper per query geografiche

4. **Error Handling** (`src/middleware/errorMiddleware.js`):
   - Gestione errori centralizzata
   - Formattazione risposte di errore
   - Logging errori

### 2.6 Servizi Specializzati

1. **Track Processing Service** (`src/services/trackProcessingService.js`):
   - Preprocessing dati grezzi (normalizzazione, validazione)
   - Rimozione outlier e smoothing percorso
   - Calcolo statistiche (distanza, velocità, tempo)
   - Analisi pattern di guida

2. **Photo Service** (`src/services/photoService.js`):
   - Upload e ottimizzazione immagini
   - Estrazione metadata EXIF
   - Generazione thumbnail
   - Associazione foto a percorsi

3. **Geo Service** (`src/services/geoService.js`):
   - Geocoding inverso
   - Ricerca POI vicini
   - Generazione mappe statiche
   - Informazioni meteo storiche

4. **Admin Service** (`src/services/adminService.js`):
   - Creazione utenti admin
   - Gestione permessi avanzati
   - Monitoraggio attività piattaforma

### 2.7 Setup Admin User Iniziale

1. **Script per Admin Iniziale** (`src/scripts/createInitialAdmin.js`):
   - Script per creare il primo utente admin nel database
   - Verifica esistenza admin e crea se necessario
   - Eseguibile manualmente dopo il primo deploy

2. **Implementazione creazione admin**:
   ```javascript
   // src/scripts/createInitialAdmin.js
   const mongoose = require('mongoose');
   const User = require('../models/User');
   const admin = require('../config/firebaseAdmin');
   require('dotenv').config();

   const createInitialAdmin = async () => {
     try {
       // Connetti al database
       await mongoose.connect(process.env.DATABASE_URL);
       
       // Verifica se esiste già un admin
       const adminExists = await User.findOne({ role: 'admin' });
       
       if (adminExists) {
         console.log('Un utente admin esiste già:', adminExists.email);
         process.exit(0);
       }
       
       // Crea utente in Firebase
       const userRecord = await admin.auth().createUser({
         email: process.env.INITIAL_ADMIN_EMAIL,
         password: process.env.INITIAL_ADMIN_PASSWORD,
         displayName: 'Admin',
       });
       
       // Crea utente nel database locale
       const newAdmin = await User.create({
         firebaseUid: userRecord.uid,
         email: process.env.INITIAL_ADMIN_EMAIL,
         username: 'admin',
         name: 'Administrator',
         role: 'admin',
         lastLogin: new Date()
       });
       
       console.log('Utente admin creato con successo:', newAdmin);
       process.exit(0);
     } catch (error) {
       console.error('Errore nella creazione admin:', error);
       process.exit(1);
     }
   };

   createInitialAdmin();
   ```

3. **Aggiungere script in package.json**:
   ```json
   "scripts": {
     "create-admin": "node src/scripts/createInitialAdmin.js"
   }
   ```

### 2.8 Deployment su Render

1. **Preparazione progetto**:
   - Assicurarsi che tutte le dipendenze siano nel package.json
   - Configurare gli script di avvio (`npm start`)

2. **Setup su Render**:
   - Creare un nuovo Web Service
   - Collegare repository GitHub
   - Specificare root directory: `apps/server`
   - Build command: `npm install`
   - Start command: `npm start`

3. **Configurare variabili d'ambiente**:
   - DATABASE_URL (MongoDB Atlas connection string)
   - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
   - INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD (solo per setup)

4. **Eseguire creazione admin iniziale**:
   - Dopo il deploy, eseguire `npm run create-admin`

## Fase 3: Implementazione Admin Panel (Next.js)

### 3.1 Setup Iniziale Admin Panel

1. **Creazione progetto Next.js**:
   ```bash
   cd apps
   npx create-next-app admin --typescript
   cd admin
   ```

2. **Installazione dipendenze**:
   ```bash
   npm install firebase axios react-hook-form zod @hookform/resolvers
   npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
   npm install react-table recharts
   ```

3. **Struttura directory admin**:
   ```
   admin/
   ├── src/
   │   ├── app/           # App directory di Next.js
   │   ├── components/    # Componenti UI riutilizzabili
   │   ├── hooks/         # Custom hooks
   │   ├── lib/           # Librerie e servizi
   │   ├── services/      # Client API per il backend
   │   └── utils/         # Funzioni helper
   └── public/            # Asset statici
   ```

### 3.2 Funzionalità Core Admin

1. **Autenticazione Admin**:
   - Login con Firebase (email/password)
   - Verifica ruolo admin con backend
   - Protezione route lato client e server

2. **Dashboard Admin**:
   - Overview statistiche piattaforma
   - Utenti attivi, nuove registrazioni
   - Percorsi creati, foto caricate
   - Grafici di attività

3. **Gestione Utenti**:
   - Lista utenti con filtri e ricerca
   - Visualizzazione dettagli utente
   - Modifica ruolo (promozione a admin)
   - Disabilitazione/eliminazione account

4. **Gestione Contenuti**:
   - Visualizzazione percorsi con filtri
   - Visualizzazione foto con filtri
   - Moderazione contenuti inappropriati
   - Eliminazione contenuti

5. **Gestione POI**:
   - Approvazione nuovi POI
   - Modifica/eliminazione POI esistenti
   - Visualizzazione su mappa

6. **Strumenti Admin**:
   - Testing API in ambiente live
   - Creazione nuovi admin
   - Configurazione parametri sistema

### 3.3 Implementazione Interfaccia Admin

1. **Layout Admin**:
   - Sidebar di navigazione
   - Header con info utente loggato
   - Area contenuti principale

2. **Tabelle Dati**:
   - Implementazione con react-table
   - Paginazione, ordinamento, filtri
   - Export dati CSV/JSON

3. **Form e Validazione**:
   - Utilizzo react-hook-form con zod
   - Feedback errori in tempo reale
   - Submit ottimizzati

4. **Visualizzazione Mappe**:
   - Visualizzatore percorsi
   - Heatmap attività
   - Cluster POI e foto

### 3.4 Deployment Admin Panel

1. **Preparazione progetto**:
   - Ottimizzazione build Next.js
   - Configurazione variabili d'ambiente

2. **Deployment su Vercel**:
   - Collegare repository GitHub
   - Specificare root directory: `apps/admin`
   - Configurare variabili d'ambiente

## Fase 4: Implementazione Mobile App (React Native/Expo)

### 4.1 Setup Iniziale App Mobile

1. **Creazione progetto Expo**:
   ```bash
   cd apps
   npx create-expo-app mobile
   cd mobile
   ```

2. **Installazione dipendenze**:
   ```bash
   npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
   npx expo install react-native-screens react-native-safe-area-context
   npx expo install react-native-maps
   npm install firebase axios zustand
   npx expo install expo-location expo-image-picker expo-sensors
   npm install date-fns lodash
   ```

3. **Struttura directory mobile**:
   ```
   mobile/
   ├── src/
   │   ├── api/           # Client API per il backend
   │   ├── assets/        # Immagini, font, ecc.
   │   ├── components/    # Componenti UI riutilizzabili
   │   ├── hooks/         # Custom hooks
   │   ├── navigation/    # Configurazione navigazione
   │   ├── screens/       # Schermate dell'app
   │   ├── services/      # Servizi (geolocation, storage, ecc.)
   │   ├── store/         # State management (Zustand)
   │   ├── theme/         # Stili, colori, dimensioni
   │   └── utils/         # Funzioni helper
   ├── App.js             # Entry point
   └── app.json           # Configurazione Expo
   ```

### 4.2 Funzionalità Core di Tracciamento

1. **Servizio di Geolocalizzazione** (`src/services/locationService.js`):
   - Tracciamento posizione con expo-location
   - Ottimizzazione batteria
   - Gestione permessi

2. **Schermata Tracciamento** (`src/screens/TrackingScreen.js`):
   - Visualizzazione mappa in tempo reale con react-native-maps
   - Controlli start/stop tracciamento
   - Indicatori statistiche (velocità, distanza, tempo)

3. **Dettaglio Tracciato** (`src/screens/TrackDetailScreen.js`):
   - Visualizzazione percorso completo su mappa
   - Statistiche dettagliate
   - Grafici velocità/altitudine
   - Condivisione e privacy settings

4. **Lista Tracciati** (`src/screens/TracksListScreen.js`):
   - Filtri e ordinamento
   - Anteprima tracciati sulla mappa
   - Statistiche aggregate

### 4.3 Funzionalità Social e Foto

1. **Schermata Foto** (`src/screens/PhotoScreen.js`):
   - Integrazione con expo-image-picker
   - Geolocalizzazione automatica
   - Preview mappa con posizione
   - Upload al backend

2. **Feed Activity** (`src/screens/FeedScreen.js`):
   - Timeline attività dei contatti
   - Preview tracciati e foto
   - Interazioni social (commenti, like)

3. **Profilo Utente** (`src/screens/ProfileScreen.js`):
   - Statistiche personalizzate
   - Galleria tracciati e foto
   - Gestione connections

4. **Esplorazione** (`src/screens/ExploreScreen.js`):
   - Mappa interattiva con tracciati pubblici
   - Ricerca POI nelle vicinanze
   - Filtri per tipo di percorso e veicolo

### 4.4 Altre Funzionalità Chiave

1. **Gestione Veicoli** (`src/screens/VehiclesScreen.js`):
   - Aggiunta e modifica veicoli
   - Foto veicoli
   - Statistiche per veicolo

2. **Impostazioni** (`src/screens/SettingsScreen.js`):
   - Preferenze utente
   - Privacy e notifiche
   - Esportazione dati

3. **Achievement/Gamification** (`src/screens/AchievementsScreen.js`):
   - Lista achievement
   - Progressi e sfide
   - Leaderboard

### 4.5 Test con Expo CLI

1. **Avvio in modalità sviluppo**:
   ```bash
   npx expo start
   ```

2. **Testing su dispositivi fisici**:
   - Utilizzare Expo Go su smartphone
   - Scansionare QR code da terminale

3. **Testing su emulatori**:
   - Android Studio Emulator
   - iOS Simulator (solo su macOS)

## Fase 5: Implementazione Web Frontend (Next.js)

### 5.1 Setup Iniziale Web

1. **Creazione progetto Next.js**:
   ```bash
   cd apps
   npx create-next-app web --typescript
   cd web
   ```

2. **Installazione dipendenze**:
   ```bash
   npm install firebase axios zustand
   npm install react-map-gl mapbox-gl
   npm install @mui/material @emotion/react @emotion/styled
   npm install react-hook-form zod @hookform/resolvers
   ```

3. **Struttura directory web**:
   ```
   web/
   ├── src/
   │   ├── app/           # App directory di Next.js
   │   ├── components/    # Componenti UI riutilizzabili
   │   ├── hooks/         # Custom hooks
   │   ├── lib/           # Librerie e servizi
   │   ├── services/      # Client API per il backend
   │   └── utils/         # Funzioni helper
   └── public/            # Asset statici
   ```

### 5.2 Funzionalità Core

1. **Dashboard Utente**:
   - Visualizzazione statistiche
   - Ultimi tracciati
   - Attività recenti

2. **Visualizzatore Percorsi**:
   - Mappa interattiva con percorsi completi
   - Timeline con dati temporali
   - Grafici di statistiche
   - Foto associate al percorso

3. **Profilo Pubblico**:
   - Percorsi pubblici dell'utente
   - Badge e achievement
   - Statistiche aggregate

4. **Feed Sociale**:
   - Attività della community
   - Filtri per tipo di contenuto
   - Interazioni

### 5.3 Deployment Web App

1. **Preparazione progetto**:
   - Ottimizzazione build
   - Configurazione variabili d'ambiente

2. **Deployment su Vercel**:
   - Collegare repository GitHub
   - Specificare root directory: `apps/web`
   - Configurare variabili d'ambiente

## Fase 6: Migrare su AWS

### 6.1 Preparazione Infrastruttura AWS

1. **Creare Account AWS**:
   - Registrarsi per un account AWS
   - Configurare utente IAM con permessi appropriati

2. **Configurare Servizi Necessari**:
   - **Amazon EC2** o **AWS Elastic Beanstalk** per il backend
   - **Amazon S3** per storage
   - **Amazon DocumentDB** per database (alternativa a MongoDB Atlas)
   - **Amazon CloudFront** per CDN
   - **AWS Lambda** per funzioni serverless

### 6.2 Strategia di Migrazione

1. **Backend**:
   - Migrazione da Render a Elastic Beanstalk
   - Configurare load balancer e auto-scaling
   - Impostare security groups

2. **Database**:
   - Migrazione da MongoDB Atlas a DocumentDB
   - Configurare VPC e security groups
   - Implementare strategia di backup

3. **Storage**:
   - Migrazione da Cloudinary a S3 + CloudFront
   - Configurare bucket policies
   - Ottimizzare per accesso globale rapido

### 6.3 Deploy e Configurazione

1. **Backend su Elastic Beanstalk**:
   - Creare ambiente EB
   - Configurare variabili d'ambiente
   - Deploy applicazione

2. **Setup CloudFront**:
   - Distribuire contenuti statici e media
   - Configurare cache behavior
   - Integrare con certificati SSL

3. **Monitoring e Logging**:
   - Configurare CloudWatch
   - Implementare allarmi per metriche chiave
   - Setup di X-Ray per tracciamento

## Roadmap di Implementazione

### Sprint 1-2: Setup Infrastruttura Base e Backend
- Configurazione ambiente sviluppo
- Setup repository e CI/CD
- Configurazione servizi cloud (MongoDB Atlas, Firebase, Cloudinary)
- Implementazione autenticazione e modelli dati
- API CRUD base

### Sprint 3-4: Admin Panel Web
- Sviluppo interfaccia admin
- Implementazione CRUD per tutte le entità
- Testing API tramite admin panel
- Gestione utenti e ruoli
- Dashboard statistiche

### Sprint 5-6: Backend Avanzato
- Implementazione servizi specializzati
- Middleware essenziali
- Gestione upload avanzata
- API per tracciamento e geolocalizzazione

### Sprint 7-8: Mobile App Core
- UI/UX base
- Implementazione sistema di tracciamento
- Visualizzazione percorsi su mappa
- Autenticazione e profilo utente

### Sprint 9-10: Funzionalità Social Mobile
- Profili e connections
- Feed attività
- Commenti e reazioni
- Upload foto geolocalizzate

### Sprint 11-12: Mobile App Avanzata
- Gestione veicoli
- Sistema POI
- Gamification e achievement
- Dashboard statistiche

### Sprint 13-14: Frontend Web Core
- Autenticazione e profilo
- Visualizzazione percorsi
- Interazioni social
- Dashboard utente

### Sprint 15-16: Web Avanzato
- Esplorazione percorsi pubblici
- Analisi statistiche avanzate
- Mappe interattive
- Ottimizzazioni SEO

### Sprint 17-18: Migrazione AWS e Ottimizzazioni
- Setup infrastruttura AWS
- Migrazione dati
- Ottimizzazioni performance
- Sicurezza avanzata

### Sprint 19-20: Release e Marketing
- Testing finale
- Risoluzione bug
- Preparazione materiali marketing
- Launch pubblico
