# BookBrain Database Restore Script (PowerShell)
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupPath,
    [string]$DbName = "bookbrain_erp"
)

Write-Host "Restoring database $DbName from $BackupPath..."

if (!(Test-Path $BackupPath)) {
    Write-Error "Backup path does not exist: $BackupPath"
    exit 1
}

try {
    if (Get-Command mongorestore -ErrorAction SilentlyContinue) {
        mongorestore --db $DbName --drop $BackupPath
        Write-Host "Database restored successfully." -ForegroundColor Green
    } else {
        Write-Warning "mongorestore command not available. Ensure MongoDB Database Tools are installed."
    }
} catch {
    Write-Error "Restore failed: $_"
}
