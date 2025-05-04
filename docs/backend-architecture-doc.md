# Lude (Track Master) - Architettura Backend Dettagliata

## Panoramica dell'Architettura Backend

Questo documento definisce l'architettura backend dettagliata per l'applicazione Lude (Track Master), un'app social per il tracciamento di percorsi auto/moto con funzionalità di condivisione di itinerari e foto geolocalizzate.

## Architettura Generale

### Stack Tecnologico

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MongoDB (con mongoose come ORM)
- **Autenticazione**: Firebase Authentication
- **Storage**: Cloudinary (prototipo) → Amazon S3 (produzione)
- **Geolocalizzazione**: MapBox SDK
- **Deployment**: Render (prototipo) → AWS Elastic Beanstalk (produzione)

### Architettura MVC Estesa

Il backend è organizzato secondo un pattern MVC esteso con l'aggiunta di layer di servizi:

```
Controllers → Services → Models → Database
     ↑           ↑         ↓
     └───────────┴─────────┘
```

- **Controllers**: Gestiscono le richieste HTTP, la validazione input e le risposte
- **Services**: Implementano la logica di business, orchestrano le operazioni
- **Models**: Definiscono schema dati e interazioni con il database
- **Middleware**: Funzionalità trasversali come auth, error handling, logging

### Architettura Microservizi Lite

Sebbene l'implementazione iniziale sia monolitica, il backend è strutturato in modo da facilitare la transizione verso microservizi in futuro:

```
┌───────────────────────────────────────────────────────┐
│                API Gateway (Express)                  │
└───────────┬───────────┬───────────┬───────────────────┘
            │           │           │
┌───────────▼─┐ ┌───────▼─┐ ┌───────▼─┐ ┌───────────────┐
│ Auth Service│ │ Track    │ │ Social  │ │ Analytics    │
│             │ │ Service  │ │ Service │ │ Service      │
└─────────────┘ └─────────┘ └─────────┘ └───────────────┘
```

Ogni "servizio" è attualmente implementato come un modulo separato all'interno del monolite, ma con interfacce chiare per un'eventuale separazione in microservizi indipendenti.

## Schema del Database

### Modelli Dati Principali

#### User Schema

```javascript
{
  _id: ObjectId,
  firebaseUid: String,           // Firebase user ID
  username: String,              // Username univoco
  email: String,                 // Email utente
  fullName: String,              // Nome completo
  bio: String,                   // Biografia/descrizione profilo
  profilePicture: String,        // URL immagine profilo
  
  // Preferenze utente
  preferences: {
    mapStyle: String,            // Stile mappa preferito
    unitSystem: String,          // 'metric' o 'imperial'
    privacyDefault: String,      // 'private', 'followers', 'public'
    notificationsEnabled: Boolean,
    darkMode: Boolean
  },
  
  // Statistiche
  stats: {
    totalDistance: Number,       // Distanza totale percorsa (km)
    totalTime: Number,           // Tempo totale (minuti)
    totalTracks: Number,         // Numero totale percorsi
    totalPhotos: Number,         // Numero totale foto
    favoriteTracks: [ObjectId],  // Percorsi preferiti
    achievements: [ObjectId]     // Achievement sbloccati
  },
  
  // Relazioni
  following: [ObjectId],         // Utenti seguiti
  followers: [ObjectId],         // Follower
  
  // Meta
  lastActive: Date,              // Ultimo accesso
  isVerified: Boolean,           // Email verificata
  createdAt: Date,
  updatedAt: Date
}
```

#### Vehicle Schema

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Riferimento all'utente proprietario
  name: String,                  // Nome del veicolo
  type: String,                  // 'car', 'motorcycle', 'bicycle', etc.
  make: String,                  // Marca
  model: String,                 // Modello
  year: Number,                  // Anno
  image: String,                 // URL immagine
  
  // Dati tecnici
  specs: {
    engineSize: Number,          // Cilindrata (cc)
    fuelType: String,            // Tipo carburante
    power: Number,               // Potenza (HP/kW)
    weight: Number               // Peso (kg)
  },
  
  // Statistiche
  stats: {
    totalDistance: Number,       // Distanza totale (km)
    totalTime: Number,           // Tempo totale (minuti)
    totalTracks: Number,         // Numero percorsi
    averageSpeed: Number,        // Velocità media (km/h)
    maxSpeed: Number             // Velocità massima (km/h)
  },
  
  isActive: Boolean,             // Veicolo attualmente in uso
  createdAt: Date,
  updatedAt: Date
}
```

#### Track Schema (GeoJSON Enhanced)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Riferimento all'utente proprietario
  vehicleId: ObjectId,           // Riferimento al veicolo
  title: String,                 // Titolo del percorso
  description: String,           // Descrizione
  
  // Dati geografici con formato GeoJSON
  route: {
    type: {
      type: String,
      enum: ['LineString'],
      required: true
    },
    coordinates: [               // Array di punti [longitude, latitude, elevation, timestamp]
      [Number, Number, Number, Number]
    ]
  },
  
  // Meta percorso
  startPoint: {                  // Punto di partenza (GeoJSON Point)
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: [Number, Number] // [longitude, latitude]
  },
  endPoint: {                    // Punto di arrivo (GeoJSON Point)
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: [Number, Number] // [longitude, latitude]
  },
  
  // Informazioni temporali
  startTime: Date,               // Orario di partenza
  endTime: Date,                 // Orario di arrivo
  duration: Number,              // Durata in secondi
  
  // Statistiche
  stats: {
    distance: Number,            // Distanza (km)
    averageSpeed: Number,        // Velocità media (km/h)
    maxSpeed: Number,            // Velocità massima (km/h)
    elevation: {
      gain: Number,              // Dislivello positivo (m)
      loss: Number,              // Dislivello negativo (m)
      max: Number,               // Altitudine massima (m)
      min: Number                // Altitudine minima (m)
    },
    movingTime: Number,          // Tempo in movimento (secondi)
    stoppedTime: Number          // Tempo fermi (secondi)
  },
  
  // Dati contestuali
  weather: {
    temperature: Number,         // Temperatura media (°C)
    conditions: String,          // Condizioni ('sunny', 'cloudy', 'rainy', etc.)
    windSpeed: Number,           // Velocità vento (km/h)
    humidity: Number             // Umidità %
  },
  
  // Collegamenti
  photos: [ObjectId],            // Foto associate al percorso
  pois: [ObjectId],              // Punti di interesse nel percorso
  
  // Dati social
  privacy: String,               // 'private', 'followers', 'public'
  likes: [ObjectId],             // Utenti che hanno messo like
  comments: [ObjectId],          // Commenti
  
  // Meta
  createdAt: Date,
  updatedAt: Date,
  
  // Indici
  // Indice spaziale 2dsphere sulla route per query geografiche
  // Indice su userId + privacy per query di feed
}
```

#### Photo Schema

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Riferimento all'utente
  trackId: ObjectId,             // Riferimento al percorso (opzionale)
  
  // Media
  imageUrl: String,              // URL Cloudinary/S3
  thumbnailUrl: String,          // URL thumbnail
  
  // Geo
  location: {                    // Posizione foto (GeoJSON Point)
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: [Number, Number] // [longitude, latitude]
  },
  
  // Meta
  title: String,                 // Titolo foto
  description: String,           // Descrizione
  takenAt: Date,                 // Data/ora scatto
  
  // EXIF (quando disponibili)
  exif: {
    camera: String,              // Modello fotocamera
    lens: String,                // Obiettivo
    focalLength: Number,         // Lunghezza focale
    aperture: String,            // Apertura
    iso: Number,                 // ISO
    shutterSpeed: String         // Tempo di esposizione
  },
  
  // Social
  privacy: String,               // 'private', 'followers', 'public'
  likes: [ObjectId],             // Like
  comments: [ObjectId],          // Commenti
  tags: [String],                // Hashtag
  mentions: [ObjectId],          // Menzioni utenti
  
  // Meta
  createdAt: Date,
  updatedAt: Date
  
  // Indici
  // Indice spaziale 2dsphere sulla location
  // Indice su userId + privacy
  // Indice su trackId quando presente
}
```

#### POI Schema (Points of Interest)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Utente che ha creato il POI
  
  // Geo
  location: {                    // Posizione POI (GeoJSON Point)
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: [Number, Number] // [longitude, latitude]
  },
  
  // Info
  name: String,                  // Nome del POI
  description: String,           // Descrizione
  type: String,                  // Tipo di POI (restaurant, viewpoint, pit-stop, etc.)
  category: String,              // Categoria (food, nature, gas, etc.)
  
  // Media
  images: [String],              // URL immagini
  
  // Review
  rating: Number,                // Valutazione (1-5)
  reviews: [                     // Recensioni
    {
      userId: ObjectId,          // Utente recensore
      rating: Number,            // Valutazione (1-5)
      comment: String,           // Commento
      createdAt: Date            // Data recensione
    }
  ],
  
  // Meta
  isPublic: Boolean,             // POI pubblico o privato
  isVerified: Boolean,           // POI verificato
  createdAt: Date,
  updatedAt: Date
  
  // Indici
  // Indice spaziale 2dsphere sulla location
  // Indice su type e category per filtri
}
```

#### Achievement Schema

```javascript
{
  _id: ObjectId,
  name: String,                  // Nome achievement
  description: String,           // Descrizione
  icon: String,                  // URL icona
  category: String,              // Categoria (distance, speed, explorer, etc.)
  
  // Criteri
  criteria: {
    type: String,                // Tipo di criterio (distance, tracks, photos, etc.)
    threshold: Number,           // Valore soglia
    timeframe: String            // Timeframe (all-time, monthly, weekly)
  },
  
  // Meta
  difficulty: String,            // Difficoltà (easy, medium, hard)
  points: Number,                // Punti assegnati
  isHidden: Boolean,             // Achievement nascosto fino allo sblocco
  createdAt: Date,
  updatedAt: Date
}
```

#### UserAchievement Schema (Join Table)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Riferimento all'utente
  achievementId: ObjectId,       // Riferimento all'achievement
  unlockedAt: Date,              // Data di sblocco
  progress: Number,              // Progresso attuale (percentuale)
  isCompleted: Boolean,          // Achievement completato
  
  // Meta
  createdAt: Date,
  updatedAt: Date
}
```

### Indici per Performance e Scalabilità

```javascript
// User
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "firebaseUid": 1 }, { unique: true });

// Vehicle
db.vehicles.createIndex({ "userId": 1 });

// Track
db.tracks.createIndex({ "route": "2dsphere" });
db.tracks.createIndex({ "userId": 1, "privacy": 1 });
db.tracks.createIndex({ "privacy": 1, "createdAt": -1 });
db.tracks.createIndex({ "startPoint": "2dsphere" });
db.tracks.createIndex({ "endPoint": "2dsphere" });

// Photo
db.photos.createIndex({ "location": "2dsphere" });
db.photos.createIndex({ "userId": 1, "privacy": 1 });
db.photos.createIndex({ "trackId": 1 });
db.photos.createIndex({ "tags": 1 });

// POI
db.pois.createIndex({ "location": "2dsphere" });
db.pois.createIndex({ "type": 1, "category": 1 });
db.pois.createIndex({ "userId": 1, "isPublic": 1 });

// Achievement
db.achievements.createIndex({ "category": 1 });
db.userAchievements.createIndex({ "userId": 1, "achievementId": 1 }, { unique: true });
```

## Architettura API

### Autenticazione e Sicurezza

#### Flusso di Autenticazione

1. **Client-side auth**: L'utente si registra/accede tramite Firebase Auth in app
2. **Token exchange**: Il client ottiene un token JWT da Firebase
3. **API auth**: Il token viene incluso in ogni richiesta nell'header `Authorization`
4. **Verifica**: Il backend verifica il token con Firebase Admin SDK
5. **Sincronizzazione**: Alla prima autenticazione, un profilo utente viene creato nel DB MongoDB

#### Middleware di Autenticazione

```javascript
// authMiddleware.js (pseudo-codice)
const admin = require('firebase-admin');

const authMiddleware = async (req, res, next) => {
  try {
    // Estrarre il token dall'header
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) throw new Error('Token non fornito');
    
    // Verificare il token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Ottenere l'utente dal DB locale
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // Allegare l'utente alla richiesta
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }
};
```

#### Middleware di Autorizzazione

```javascript
// Per proteggere risorse specifiche dell'utente
const ownershipCheck = (modelName) => async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const Model = require(`../models/${modelName}`);
    
    const resource = await Model.findById(resourceId);
    if (!resource) return res.status(404).json({ error: 'Risorsa non trovata' });
    
    // Verifica proprietà
    if (resource.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }
    
    req.resource = resource;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Errore server' });
  }
};
```

### Gestione Percorsi (Tracks)

#### Salvataggio Percorso

```javascript
// trackController.js (pseudo-codice)
const saveTrack = async (req, res) => {
  try {
    const { trackData, metadata } = req.body;
    const userId = req.user._id;
    
    // Processare i dati grezzi del percorso
    const processedTrack = await trackProcessingService.processRawTrack(trackData);
    
    // Arricchire con metadata
    const enrichedTrack = await geoService.enrichTrackData(processedTrack);
    
    // Creare record nel DB
    const track = new Track({
      userId,
      ...enrichedTrack,
      ...metadata,
      privacy: metadata.privacy || req.user.preferences.privacyDefault
    });
    
    await track.save();
    
    // Aggiornare statistiche utente
    await userService.updateUserStats(userId);
    
    // Verificare achievement
    await achievementService.checkAchievements(userId);
    
    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### Recupero Percorsi con Filtri Geografici

```javascript
// trackController.js (pseudo-codice)
const getNearbyTracks = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance, limit = 20 } = req.query;
    
    const location = [parseFloat(longitude), parseFloat(latitude)];
    
    const tracks = await Track.find({
      privacy: 'public',
      route: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location
          },
          $maxDistance: parseInt(maxDistance) || 10000 // metri
        }
      }
    })
    .populate('userId', 'username profilePicture')
    .limit(parseInt(limit))
    .exec();
    
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Gestione Foto Geolocalizzate

#### Upload e Processamento Foto

```javascript
// photoController.js (pseudo-codice)
const uploadPhoto = async (req, res) => {
  try {
    const { image, location, metadata } = req.body;
    const userId = req.user._id;
    
    // Upload su Cloudinary/S3
    const uploadResult = await photoService.uploadImage(image);
    
    // Estrarre metadata EXIF se disponibili
    const exifData = await photoService.extractExif(image);
    
    // Creare record nel DB
    const photo = new Photo({
      userId,
      imageUrl: uploadResult.secure_url,
      thumbnailUrl: uploadResult.thumbnail_url,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      },
      takenAt: metadata.takenAt || new Date(),
      title: metadata.title,
      description: metadata.description,
      privacy: metadata.privacy || req.user.preferences.privacyDefault,
      exif: exifData
    });
    
    // Associare al percorso se fornito
    if (metadata.trackId) {
      const track = await Track.findById(metadata.trackId);
      if (track && track.userId.toString() === userId.toString()) {
        photo.trackId = metadata.trackId;
        await Track.findByIdAndUpdate(metadata.trackId, {
          $push: { photos: photo._id }
        });
      }
    }
    
    await photo.save();
    
    // Aggiornare statistiche utente
    await userService.updateUserStats(userId);
    
    res.status(201).json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### Ricerca Foto Vicine

```javascript
// photoController.js (pseudo-codice)
const getNearbyPhotos = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance, limit = 20 } = req.query;
    
    const location = [parseFloat(longitude), parseFloat(latitude)];
    
    const photos = await Photo.find({
      privacy: 'public',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location
          },
          $maxDistance: parseInt(maxDistance) || 1000 // metri
        }
      }
    })
    .populate('userId', 'username profilePicture')
    .limit(parseInt(limit))
    .exec();
    
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Servizi Funzionali 

#### Track Processing Service

Responsabile dell'elaborazione dei dati grezzi del percorso:

```javascript
// trackProcessingService.js (pseudo-codice)
const processRawTrack = async (rawTrackData) => {
  // Convertire i punti in formato GeoJSON
  const coordinates = rawTrackData.points.map(point => [
    point.longitude,
    point.latitude,
    point.elevation || 0,
    point.timestamp
  ]);
  
  // Rimuovere outlier
  const filteredCoordinates = removeOutliers(coordinates);
  
  // Smoothing del percorso se necessario
  const smoothedCoordinates = applySmoothing(filteredCoordinates);
  
  // Calcolare statistiche
  const stats = calculateTrackStats(smoothedCoordinates);
  
  // Estrarre punti iniziale e finale
  const startPoint = {
    type: 'Point',
    coordinates: [smoothedCoordinates[0][0], smoothedCoordinates[0][1]]
  };
  
  const endPoint = {
    type: 'Point',
    coordinates: [
      smoothedCoordinates[smoothedCoordinates.length-1][0],
      smoothedCoordinates[smoothedCoordinates.length-1][1]
    ]
  };
  
  return {
    route: {
      type: 'LineString',
      coordinates: smoothedCoordinates
    },
    startPoint,
    endPoint,
    stats,
    startTime: new Date(smoothedCoordinates[0][3]),
    endTime: new Date(smoothedCoordinates[smoothedCoordinates.length-1][3]),
    duration: calculateDuration(smoothedCoordinates)
  };
};
```

#### Geo Service

Responsabile dell'arricchimento dei dati geografici:

```javascript
// geoService.js (pseudo-codice)
const mapboxClient = require('@mapbox/mapbox-sdk');
const geocodingService = mapboxClient.geocoding({ accessToken: process.env.MAPBOX_TOKEN });

const enrichTrackData = async (trackData) => {
  // Reverse geocoding dei punti iniziale e finale
  const startLocation = await reverseGeocode(
    trackData.startPoint.coordinates[1],
    trackData.startPoint.coordinates[0]
  );
  
  const endLocation = await reverseGeocode(
    trackData.endPoint.coordinates[1],
    trackData.endPoint.coordinates[0]
  );
  
  // Recupero dati meteo per il percorso
  const weatherData = await getHistoricalWeather(
    trackData.startPoint.coordinates[1],
    trackData.startPoint.coordinates[0],
    trackData.startTime
  );
  
  return {
    ...trackData,
    metadata: {
      startLocationName: startLocation.placeName,
      endLocationName: endLocation.placeName,
      region: startLocation.region,
      country: startLocation.country
    },
    weather: weatherData
  };
};

const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await geocodingService.reverseGeocode({
      query: [longitude, latitude],
      limit: 1
    }).send();
    
    const feature = response.body.features[0];
    
    return {
      placeName: feature.place_name,
      region: feature.context.find(c => c.id.includes('region'))?.text,
      country: feature.context.find(c => c.id.includes('country'))?.text
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      placeName: 'Unknown location',
      region: 'Unknown region',
      country: 'Unknown country'
    };
  }
};
```

#### Achievement Service

Responsabile della verifica e assegnazione degli achievement:

```javascript
// achievementService.js (pseudo-codice)
const checkAchievements = async (userId) => {
  // Recuperare tutti gli achievement disponibili
  const achievements = await Achievement.find();
  
  // Recuperare statistiche utente
  const user = await User.findById(userId);
  
  // Verificare ogni achievement
  for (const achievement of achievements) {
    // Verificare se l'utente ha già l'achievement
    const existingAchievement = await UserAchievement.findOne({
      userId,
      achievementId: achievement._id,
      isCompleted: true
    });
    
    if (existingAchievement) continue;
    
    // Verificare se l'utente soddisfa i criteri
    const progress = await calculateAchievementProgress(userId, achievement);
    
    // Creare o aggiornare record UserAchievement
    await UserAchievement.findOneAndUpdate(
      { userId, achievementId: achievement._id },
      {
        progress,
        isCompleted: progress >= 100,
        $setOnInsert: { createdAt: new Date() },
        ...(progress >= 100 ? { unlockedAt: new Date() } : {})
      },
      { upsert: true, new: true }
    );
    
    // Se completato, inviare notifica
    if (progress >= 100) {
      await notificationService.sendAchievementNotification(userId, achievement);
    }
  }
};
```

### API Endpoints Completi

#### Auth API

```
POST /api/auth/sync
- Sincronizza utente Firebase con il DB interno
- Richiede token Firebase valido
- Crea o aggiorna profilo utente

GET /api/auth/verify
- Verifica validità token
- Restituisce dati utente se autenticato
```

#### User API

```
GET /api/users/profile
- Ottiene profilo dell'utente corrente
- Include statistiche e preferenze

PUT /api/users/profile
- Aggiorna profilo utente
- Supporta aggiornamento partial

GET /api/users/:username
- Ottiene profilo pubblico di un utente
- Filtra contenuti in base a privacy

POST /api/users/:id/follow
- Segue un utente
- Aggiorna relazioni di follow

DELETE /api/users/:id/follow
- Smette di seguire un utente

GET /api/users/search
- Cerca utenti per username o nome
- Supporta paginazione e filtri
```

#### Vehicle API

```
GET /api/vehicles
- Lista veicoli dell'utente

POST /api/vehicles
- Aggiunge nuovo veicolo

GET /api/vehicles/:id
- Dettagli veicolo specifico

PUT /api/vehicles/:id
- Aggiorna veicolo

DELETE /api/vehicles/:id
- Elimina veicolo

GET /api/vehicles/stats
- Statistiche aggregate per veicolo
```

#### Track API

```
POST /api/tracks
- Salva nuovo percorso
- Processa dati grezzi
- Calcola statistiche

GET /api/tracks/list
- Lista percorsi dell'utente
- Supporta filtri e paginazione

GET /api/tracks/:id
- Dettagli completi di un percorso
- Include foto associate

PUT /api/tracks/:id
- Aggiorna metadati percorso
- Non modifica dati geografici

DELETE /api/tracks/:id
- Elimina percorso

GET /api/tracks/public
- Percorsi pubblici
- Supporta filtri geografici

GET /api/tracks/nearby
- Percorsi vicini a una posizione
```

#### Photo API

```
POST /api/photos
- Upload nuova foto
- Supporta geolocalizzazione
- Associa a percorso (opzionale)

GET /api/photos/list
- Lista foto dell'utente
- Supporta filtri e paginazione

GET /api/photos/:id
- Dettagli foto

PUT /api/photos/:id
- Aggiorna metadati foto
- Non modifica l'immagine

DELETE /api/photos/:id
- Elimina foto

GET /api/photos/nearby
- Foto vicine a una posizione
```

#### POI API

```
POST /api/pois
- Aggiunge nuovo POI
- Supporta foto multiple

GET /api/pois/:id
- Dettagli POI

PUT /api/pois/:id
- Aggiorna POI

DELETE /api/pois/:id
- Elimina POI

GET /api/pois/nearby
- POI vicini a una posizione
- Supporta filtri per categoria

POST /api/pois/:id/reviews
- Aggiunge recensione a un POI
```

#### Social API

```
GET /api/social/feed
- Feed attività following
- Supporta paginazione

POST /api/social/comments/:resourceId
- Commenta su risorsa (track/photo)

GET /api/social/comments/:resourceId
- Ottiene commenti per risorsa

POST /api/social/reactions/:resourceId
- Reagisce a risorsa (like, favorite, etc.)

DELETE /api/social/reactions/:resourceId
- Rimuove reazione

GET /api/social/notifications
- Lista notifiche utente
- Supporta filtri e paginazione

PUT /api/social/notifications/:id/read
- Segna notifica come letta
```

#### Analytics API

```
GET /api/analytics/summary
- Statistiche generali utente
- Metriche chiave aggregate

GET /api/analytics/trends
- Analisi trend temporali
- Dati per grafici

GET /api/analytics/heatmap
- Dati per heatmap percorsi
- Aggregazione geografica

GET /api/analytics/export
- Esportazione dati utente
- Formati JSON, GPX, CSV
```

#### Achievement API

```
GET /api/achievements
- Lista achievement disponibili

GET /api/achievements/user
- Achievement dell'utente
- Stato di completamento

GET /api/achievements/:id
- Dettagli achievement
- Criteri e ricompense
```

## Implementazione dei Servizi Core

### Servizio di Tracciamento

Il servizio di tracciamento è uno dei componenti più critici del backend. Gestisce l'acquisizione, l'elaborazione e l'archiviazione dei dati di percorso.

#### Struttura del Servizio

```javascript
// Track Processing Service
class TrackProcessingService {
  // Pre-processing dei dati grezzi
  async preprocessTrack(rawPoints) {
    // Normalizzazione formato dati
    // Validazione coordinate
    // Conversione unità di misura
  }
  
  // Rimozione outlier
  removeOutliers(points, threshold = 3) {
    // Algoritmi per rilevare e rimuovere punti anomali
    // Utilizzo distanza media e deviazione standard
  }
  
  // Smoothing del percorso
  applySmoothing(points, factor = 0.3) {
    // Algoritmo Savitzky-Golay o simili
    // Preservare i punti critici (curve, soste, ecc.)
  }
  
  // Calcolo statistiche
  calculateStats(points) {
    // Distanza totale (Haversine)
    // Velocità media e massima
    // Tempi di movimento e sosta
    // Dislivello (positivo/negativo)
  }
  
  // Analisi avanzata (pattern di guida)
  analyzeRidingPattern(points) {
    // Identificazione accelerazioni/frenate
    // Analisi curve e stile di guida
    // Suggerimenti miglioramento
  }
  
  // Elaborazione completa del tracciato
  async processTrack(rawData) {
    // Orchestrazione dell'intero processo
    // Applicazione di ogni passaggio di elaborazione
    // Preparazione dati per salvataggio
  }
  
  // Esportazione percorso in diversi formati
  exportTrack(track, format = 'gpx') {
    // Supporto per GPX, KML, GeoJSON
    // Personalizzazione metadati
  }
}
```

### Servizio di Gestione Foto

Il servizio di gestione foto si occupa di tutto il ciclo di vita delle immagini caricate dagli utenti.

#### Struttura del Servizio

```javascript
// Photo Service
class PhotoService {
  // Upload immagine
  async uploadImage(fileBuffer, options = {}) {
    // Upload su Cloudinary/S3
    // Generazione multiple risoluzioni
    // Ottimizzazione e compressione
  }
  
  // Estrazione metadata EXIF
  extractExif(fileBuffer) {
    // Estrazione coordinate geografiche
    // Informazioni camera/obiettivo
    // Timestamp scatto
  }
  
  // Associazione foto a percorso
  async linkPhotoToTrack(photoId, trackId, timestamp) {
    // Verifica proprietà
    // Posizionamento corretto lungo il percorso
    // Aggiornamento relazioni
  }
  
  // Ottimizzazione immagini
  async optimizeImage(fileBuffer, quality = 85) {
    // Compressione intelligente
    // Preservare metadati importanti
    // Ridimensionamento se necessario
  }
  
  // Generazione miniature
  async generateThumbnails(fileBuffer) {
    // Miniature multiple dimensioni
    // Cache su CDN
    // Supporto progressive loading
  }
}
```

### Servizio Geo e Mappe

Questo servizio gestisce tutte le funzionalità geografiche e di mappatura.

#### Struttura del Servizio

```javascript
// Geo Service
class GeoService {
  // Geocoding inverso
  async reverseGeocode(lat, lng) {
    // Integrazione MapBox
    // Caching risultati
    // Fallback con multiple API
  }
  
  // Recupero POI vicini
  async findNearbyPOIs(lat, lng, radius, categories) {
    // Query geografiche al DB
    // Filtri e ordinamento per distanza
    // Arricchimento dati POI
  }
  
  // Recupero percorsi vicini
  async findNearbyTracks(lat, lng, radius, filters) {
    // Query spaziali ottimizzate
    // Paginazione geografica
    // Filtri per tipo, lunghezza, ecc.
  }
  
  // Generazione mappa statica
  async generateStaticMap(track, options = {}) {
    // Generazione mappa tracciato
    // Personalizzazione stile
    // Markers e punti di interesse
  }
  
  // Ottimizzazione percorso
  async optimizeRoute(points) {
    // Snapping su strade
    // Correzione imprecisioni GPS
    // Integrazione con API di routing
  }
  
  // Informazioni meteo storiche
  async getHistoricalWeather(lat, lng, timestamp) {
    // Integrazione API meteo
    // Interpolazione dati temporali
    // Sintesi condizioni meteo
  }
}
```

## Strategie di Scalabilità

### Ottimizzazioni MongoDB

Per gestire grandi volumi di dati e query geografiche performanti, adottiamo le seguenti strategie di ottimizzazione:

1. **Sharding per Dimensioni**:
   - Sharding della collezione `tracks` basato su `userId`
   - Sharding della collezione `photos` basato su `userId`

2. **Indici Composti**:
   - Indici composti per query frequenti `{userId: 1, createdAt: -1}`
   - Indici su campi di filtro comuni `{vehicleId: 1, startTime: 1}`

3. **TTL (Time To Live) per Dati Temporanei**:
   - Applicare TTL su log di tracciamento dettagliati
   - Migrazione di dati storici su storage a basso costo

4. **Ottimizzazione GeoJSON**:
   - Riduzione punti per percorsi lunghi
   - Archiviazione multipla con diversi livelli di dettaglio

### Caching Multilivello

```javascript
// Cache Service
class CacheService {
  constructor() {
    this.redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });
    
    this.memoryCache = new LRUCache({
      max: 1000,
      maxAge: 1000 * 60 * 5 // 5 minuti
    });
  }
  
  // Strategia di caching a 3 livelli
  async get(key, fetchFn, options = {}) {
    // 1. Prova memoria cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // 2. Prova Redis
    const redisData = await this.redisClient.get(key);
    if (redisData) {
      const parsed = JSON.parse(redisData);
      this.memoryCache.set(key, parsed);
      return parsed;
    }
    
    // 3. Recupera dati freschi
    const data = await fetchFn();
    
    // Salva nei cache
    this.memoryCache.set(key, data);
    await this.redisClient.set(
      key, 
      JSON.stringify(data),
      'EX',
      options.ttl || 300 // TTL 5 minuti default
    );
    
    return data;
  }
  
  // Cache invalidation
  async invalidate(pattern) {
    // Rimozione memoria cache
    // Rimozione Redis con pattern
  }
}
```

### Architettura di Deployment

#### Configurazione AWS

```
┌────────────────────┐
│   AWS CloudFront   │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│   Route 53 DNS     │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│     ALB/NLB        │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│  Elastic Beanstalk │
│    (API Servers)   │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│    DocumentDB      │
│    (MongoDB)       │
└────────────────────┘

┌────────────────────┐
│      S3 Bucket     │
│   (Media Storage)  │
└────────────────────┘

┌────────────────────┐
│    ElastiCache     │
│      (Redis)       │
└────────────────────┘
```

#### Configurazione Elastic Beanstalk

```json
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "lude-backend:latest",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": "8080",
      "HostPort": "80"
    }
  ],
  "Volumes": [
    {
      "HostDirectory": "/var/app/logs",
      "ContainerDirectory": "/app/logs"
    }
  ],
  "Logging": "/var/app/logs",
  "Environment": [
    {
      "Name": "NODE_ENV",
      "Value": "production"
    },
    {
      "Name": "MONGODB_URI",
      "Value": "mongodb://docdb-cluster.cluster-xxx.region.docdb.amazonaws.com:27017/lude"
    }
  ]
}
```

### Strategie di Backup e Disaster Recovery

#### Backup Automatizzati

```javascript
// backupService.js
class BackupService {
  // Backup database
  async backupDatabase() {
    // Utilizzo MongoDB Backup
    // Compressione e cifratura
    // Upload su S3 con retention policy
  }
  
  // Backup media
  async backupMedia() {
    // Sincronizzazione S3 cross-region
    // Generazione backup incrementali
  }
  
  // Schedulazione backup
  scheduleBackups() {
    // Backup giornalieri DB
    // Backup settimanali media
    // Rotazione backup automatica
  }
  
  // Restore da backup
  async restoreFromBackup(backupId) {
    // Procedura di restore
    // Verifica integrità
    // Sincronizzazione dopo restore
  }
}
```

## Sicurezza e Privacy

### Misure di Sicurezza

1. **Protezione API**:
   - Rate limiting per IP e utente
   - Validazione input JSON con schema
   - Sanitizzazione parametri
   - Protezione CSRF e XSS

2. **Privacy Dati**:
   - Offuscamento punti di partenza residenziali
   - Controllo preciso privacy per posizione
   - Rimozione metadati sensibili da foto

3. **Autenticazione Robusta**:
   - Tokens JWT con breve durata
   - Refresh token rotation
   - Monitoraggio login da dispositivi sconosciuti

4. **Gestione Password**:
   - Password hashing con bcrypt
   - Politiche password forti
   - Notifiche cambio password

### Middleware di Sicurezza

```javascript
// securityMiddleware.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');

// Applicare helmet (HTTP headers sicuri)
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Troppe richieste, riprova più tardi'
});

app.use('/api/', apiLimiter);

// Prevenzione XSS
app.use(xss());

// Prevenzione Pollution Parametri
app.use(hpp());

// Sanitizzazione Input
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch(e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
```

## Implementazione Testing

### Struttura dei Test

```
tests/
├── unit/
│   ├── services/
│   │   ├── trackProcessingService.test.js
│   │   ├── photoService.test.js
│   │   └── ...
│   ├── models/
│   │   ├── user.test.js
│   │   ├── track.test.js
│   │   └── ...
│   └── utils/
│       └── ...
├── integration/
│   ├── api/
│   │   ├── tracks.test.js
│   │   ├── photos.test.js
│   │   └── ...
│   └── database/
│       └── ...
└── e2e/
    ├── flows/
    │   ├── trackRecording.test.js
    │   ├── photoUpload.test.js
    │   └── ...
    └── ...
```

### Test Unitari

```javascript
// trackProcessingService.test.js
const TrackProcessingService = require('../../src/services/trackProcessingService');
const mockTrackData = require('../mocks/trackData');

describe('TrackProcessingService', () => {
  let service;
  
  beforeEach(() => {
    service = new TrackProcessingService();
  });
  
  test('should remove outliers from track points', () => {
    // Setup
    const points = mockTrackData.pointsWithOutliers;
    
    // Execute
    const result = service.removeOutliers(points);
    
    // Assert
    expect(result.length).toBeLessThan(points.length);
    expect(result).not.toContainEqual(expect.objectContaining({
      latitude: 999.99, 
      longitude: 999.99
    }));
  });
  
  test('should calculate correct track statistics', () => {
    // Setup
    const points = mockTrackData.validPoints;
    
    // Execute
    const stats = service.calculateStats(points);
    
    // Assert
    expect(stats).toHaveProperty('distance');
    expect(stats).toHaveProperty('averageSpeed');
    expect(stats).toHaveProperty('maxSpeed');
    expect(stats).toHaveProperty('elevation');
    expect(stats.distance).toBeGreaterThan(0);
  });
  
  // Altri test...
});
```

### Test Integrazione API

```javascript
// tracks.test.js
const request = require('supertest');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { generateAuthToken } = require('../utils/authUtils');
const Track = require('../../src/models/Track');
const mockTrackData = require('../mocks/trackData');

setupTestDB();

describe('Tracks API', () => {
  let token;
  let userId;
  
  beforeEach(async () => {
    // Create test user
    const user = await User.create(mockUserData);
    userId = user._id;
    token = generateAuthToken(user);
  });
  
  describe('POST /api/tracks', () => {
    test('should create track if data is valid', async () => {
      // Execute
      const res = await request(app)
        .post('/api/tracks')
        .set('Authorization', `Bearer ${token}`)
        .send(mockTrackData.validTrack);
        
      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.userId.toString()).toBe(userId.toString());
      
      // Verify database
      const trackInDb = await Track.findById(res.body._id);
      expect(trackInDb).toBeTruthy();
    });
    
    test('should return 400 if data is invalid', async () => {
      // Execute
      const res = await request(app)
        .post('/api/tracks')
        .set('Authorization', `Bearer ${token}`)
        .send(mockTrackData.invalidTrack);
        
      // Assert
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  // Altri test...
});
```

## CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, development ]
  pull_request:
    branches: [ main, development ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:4.4
        ports:
          - 27017:27017
      
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        
  deploy-dev:
    needs: test
    if: github.ref == 'refs/heads/development'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-central-1
          
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
        
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: lude-backend
          IMAGE_TAG: dev-${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          
      - name: Deploy to Elastic Beanstalk
        uses: einaregilsson/beanstalk-deploy@v18
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: lude-backend
          environment_name: lude-backend-dev
          version_label: dev-${{ github.sha }}
          region: eu-central-1
          
  deploy-prod:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v2
      
      # Simili ai passaggi di deployment DEV, ma con ambiente production
      # e approvazione manuale tramite environment protection rule
```

## Monitoraggio e Logging

### Configurazione AWS CloudWatch

```javascript
// loggingService.js
const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

// Configurazione logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'lude-backend' },
  transports: [
    new winston.transports.Console(),
    new WinstonCloudWatch({
      logGroupName: 'lude-backend-logs',
      logStreamName: `${process.env.NODE_ENV}-${process.env.SERVER_ID}`,
      awsRegion: process.env.AWS_REGION,
      jsonMessage: true
    })
  ]
});

// Middleware di logging
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      userId: req.user?._id
    });
    
    // Log dettagliato solo per errori
    if (res.statusCode >= 400) {
      logger.error('API Error', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        body: req.body,
        params: req.params,
        userId: req.user?._id
      });
    }
  });
  
  next();
};

module.exports = { logger, requestLogger };
```

### Monitoraggio Performance

```javascript
// performanceMonitoring.js
const { performance } = require('perf_hooks');
const { logger } = require('./loggingService');

// Metriche in-memory
const metrics = {
  apiCalls: {},
  dbQueries: {},
  externalServices: {}
};

// Middleware per monitoraggio API
const apiMetricsMiddleware = (req, res, next) => {
  const start = performance.now();
  const path = req.route ? req.route.path : req.path;
  
  // Incrementare contatore
  metrics.apiCalls[path] = metrics.apiCalls[path] || { count: 0, totalTime: 0 };
  metrics.apiCalls[path].count++;
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    metrics.apiCalls[path].totalTime += duration;
    
    // Log metrica per endpoint lento
    if (duration > 1000) {
      logger.warn('Slow API endpoint', {
        path,
        method: req.method,
        duration,
        userId: req.user?._id
      });
    }
    
    // Inviare metrica a CloudWatch ogni 5 minuti
    if (metrics.apiCalls[path].count % 50 === 0) {
      sendMetricToCloudWatch('ApiLatency', duration, {
        Path: path,
        Method: req.method
      });
    }
  });
  
  next();
};

// Wrapper per query DB
const trackDbQuery = async (operation, query, options, callback) => {
  const start = performance.now();
  let result;
  
  try {
    result = await callback();
    return result;
  } finally {
    const duration = performance.now() - start;
    
    // Tracciare metriche
    metrics.dbQueries[operation] = metrics.dbQueries[operation] || { count: 0, totalTime: 0 };
    metrics.dbQueries[operation].count++;
    metrics.dbQueries[operation].totalTime += duration;
    
    // Log query lente
    if (duration > 500) {
      logger.warn('Slow DB query', {
        operation,
        collection: options.collection,
        duration,
        query: JSON.stringify(query).substring(0, 200)
      });
    }
  }
};

module.exports = { apiMetricsMiddleware, trackDbQuery, metrics };
```

## Conclusione

L'architettura backend per Lude (Track Master) è progettata per essere scalabile, performante e sicura. Con un forte focus sulla gestione di dati geospaziali e un approccio modulare, il sistema è pronto per evolvere da un prototipo iniziale a una soluzione enterprise-grade su AWS.

Punti chiave dell'architettura:

1. **Modello dati ottimizzato** per operazioni geospaziali con MongoDB
2. **API RESTful completa** con autenticazione Firebase
3. **Servizi specializzati** per elaborazione tracciati, foto e analisi geografica
4. **Strategie di caching** multilivello per prestazioni ottimali
5. **Pipeline CI/CD** automatizzata per deployment rapidi e sicuri
6. **Monitoraggio e logging** avanzati per visibilità operativa

La migrazione verso AWS consentirà di sfruttare servizi gestiti come DocumentDB, S3 ed Elastic Beanstalk per ridurre l'overhead operativo e concentrarsi sullo sviluppo di nuove funzionalità.
