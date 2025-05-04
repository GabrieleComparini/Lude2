# Lude Admin Panel

Pannello di amministrazione per la piattaforma Lude (Track Master). Questo pannello consente agli amministratori di gestire utenti, tracce e foto.

## Caratteristiche

- ✅ Autenticazione admin con Firebase
- ✅ Dashboard con metriche principali
- ✅ Gestione utenti (lista, dettagli, modifica ruoli)
- ✅ Gestione tracce con visualizzazione su mappa
- ✅ Gestione foto caricate
- ✅ Design responsive con TailwindCSS
- ✅ Integrazione con le API backend

## Prerequisiti

- Node.js >= 16.x
- npm >= 8.x
- Backend Lude già in esecuzione (su localhost:5001 o remoto)
- Progetto Firebase configurato

## Installazione

1. Clona il repository (se non l'hai già fatto)

```bash
git clone https://github.com/tuorepository/lude.git
cd lude/apps/admin
```

2. Installa le dipendenze

```bash
npm install
```

3. Configura le variabili d'ambiente

Copia il file `.env-example` in `.env.local`:

```bash
cp .env-example .env.local
```

Aggiorna le variabili con le tue credenziali Firebase:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API
VITE_API_URL=http://localhost:5001/api
```

4. Avvia il server di sviluppo

```bash
npm run dev
```

## Build e deploy

Per creare una build di produzione:

```bash
npm run build
```

I file di build saranno disponibili nella directory `dist`.

## Struttura del progetto

```
lude/apps/admin/
├── public/             # File statici
├── src/
│   ├── components/     # Componenti riutilizzabili
│   ├── contexts/       # Context React (autenticazione, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Layout dell'applicazione
│   ├── pages/          # Pagine dell'applicazione
│   ├── services/       # Servizi API
│   └── utils/          # Utility e funzioni helper
├── .env.example        # Esempio di configurazione variabili d'ambiente
├── index.html          # Entry point HTML
├── package.json        # Dipendenze e script
├── tailwind.config.js  # Configurazione TailwindCSS
└── vite.config.js      # Configurazione Vite
```

## Utilizzo

### Accesso

Per accedere al pannello amministrativo:

1. Vai all'URL dove è in esecuzione l'applicazione (http://localhost:3000 in sviluppo)
2. Inserisci le credenziali di un utente con ruolo admin
3. Dopo l'autenticazione verrai reindirizzato alla dashboard

### Creazione admin

Per creare un utente admin, utilizza l'endpoint API `/api/auth/create-admin` con un utente admin esistente.

## Sviluppo

### Comandi disponibili

- `npm run dev` - Avvia il server di sviluppo
- `npm run build` - Crea una build di produzione
- `npm run preview` - Anteprima della build di produzione
- `npm run lint` - Esegue linting del codice

## Tecnologie utilizzate

- React 18
- TailwindCSS
- React Router v6
- React Query
- Firebase Authentication
- Vite
- Headless UI
- React Hook Form

## Licenza

Riservato. Tutti i diritti riservati. © 2023 