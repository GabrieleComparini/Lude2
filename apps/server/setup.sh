#!/bin/bash

# Verifica se il file .env esiste
if [ ! -f .env ]; then
  echo "Creazione file .env..."
  cat > .env << EOL
# Server Configuration
PORT=5000

# MongoDB Configuration
DATABASE_URL=mongodb://localhost:27017/lude

# Firebase Admin Configuration via Service Account Key
GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# JWT Secret (for token-based authentication if used)
JWT_SECRET=your-strong-secret-key
JWT_EXPIRE=30d
EOL
  echo "File .env creato."
else
  # Verifica se GOOGLE_APPLICATION_CREDENTIALS è già presente
  if ! grep -q "GOOGLE_APPLICATION_CREDENTIALS" .env; then
    echo "Aggiunta GOOGLE_APPLICATION_CREDENTIALS al file .env..."
    echo "" >> .env
    echo "# Firebase Admin Configuration via Service Account Key" >> .env
    echo "GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json" >> .env
  fi
fi

# Verifica se il file serviceAccountKey.json esiste nella directory principale
if [ -f ../serviceAccountKey.json ]; then
  echo "File serviceAccountKey.json trovato."
else
  echo "ATTENZIONE: Il file serviceAccountKey.json non è stato trovato nella directory principale."
  echo "Assicurati che il file sia presente in lude/serviceAccountKey.json"
fi

# Esegui il programma di setup
echo "Esecuzione script di verifica..."
node setup-env.js

echo ""
echo "Setup completato. Esegui 'npm start' per avviare il server." 