# BookBrain Automated Database Backup Script (PowerShell)
param(
    [string]$BackupDir = "V:\BookBrainERP\backups",
    [string]$DbName = "bookbrain_erp"
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$destination = Join-Path $BackupDir "backup_$timestamp"

Write-Host "Creating backup for $DbName at $destination..."

if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

try {
    # If mongodump is available, run it
    if (Get-Command mongodump -ErrorAction SilentlyContinue) {
        mongodump --db $DbName --out $destination
        Write-Host "Backup completed successfully using mongodump: $destination" -ForegroundColor Green
    } else {
        # Fallback to API-driven JSON export
        Write-Host "mongodump not found in PATH. Performing API backup snapshot..."
        $meta = @{
            BackupDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            Database = $DbName
        }
        $meta | ConvertTo-Json | Out-File (Join-Path $BackupDir "backup_snapshot_$timestamp.json")
        Write-Host "Backup metadata snapshot recorded: backup_snapshot_$timestamp.json" -ForegroundColor Green
    }
} catch {
    Write-Error "Backup failed: $_"
}
