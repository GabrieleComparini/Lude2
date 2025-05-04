# Script per copiare serviceAccountKey.json nella posizione corretta
$sourceFile = "..\..\serviceAccountKey.json"
$destFile = "..\serviceAccountKey.json"

if (Test-Path $sourceFile) {
    Write-Host "Copia del file serviceAccountKey.json in corso..."
    Copy-Item -Path $sourceFile -Destination $destFile -Force
    Write-Host "File copiato con successo in $destFile"
} else {
    Write-Host "File serviceAccountKey.json non trovato in $sourceFile"
    Write-Host "Assicurati che il file sia presente nella directory principale del progetto"
}

# Verifica se il file è stato copiato correttamente
if (Test-Path $destFile) {
    Write-Host "Verifica configurazione con il nuovo path..."
    node setup-env.js
} else {
    Write-Host "Qualcosa è andato storto durante la copia del file"
} 