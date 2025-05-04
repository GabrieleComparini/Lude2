# Setup script per Windows PowerShell

# Verifica se il file .env esiste
if (-not (Test-Path .env)) {
  Write-Host "Creazione file .env..."
  $envContent = @"
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
"@
  Set-Content -Path .env -Value $envContent
  Write-Host "File .env creato."
} else {
  # Verifica se GOOGLE_APPLICATION_CREDENTIALS è già presente
  $envContent = Get-Content .env -Raw
  if (-not ($envContent -like "*GOOGLE_APPLICATION_CREDENTIALS*")) {
    Write-Host "Aggiunta GOOGLE_APPLICATION_CREDENTIALS al file .env..."
    Add-Content -Path .env -Value "`n# Firebase Admin Configuration via Service Account Key"
    Add-Content -Path .env -Value "GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json"
  }
}

# Verifica se il file serviceAccountKey.json esiste nella directory principale
if (Test-Path ../serviceAccountKey.json) {
  Write-Host "File serviceAccountKey.json trovato."
} else {
  Write-Host "ATTENZIONE: Il file serviceAccountKey.json non è stato trovato nella directory principale."
  Write-Host "Assicurati che il file sia presente in lude/serviceAccountKey.json"
}

# Esegui il programma di setup
Write-Host "Esecuzione script di verifica..."
node setup-env.js

Write-Host ""
Write-Host "Setup completato. Esegui 'npm start' per avviare il server." 