# ===============================
# docker-compose.yml Auto Backup Watcher
# ===============================

$targetFile  = "C:\n8n_data\docker-compose.yml" # 監視対象
$backupDir   = "C:\n8n_backups\compose"		# バックアップ先
$discordWebhook = "https://discord.com/api/webhooks/1433465159053213857/VXa_cRXF9lt_rWEl--cSt_KdaBS-UVjKP2OIaVygJB0ww1Y2L9np0KZDMYy5_gdCkCgE" # ✅そのまま使う

# Create backup folder if not exists
if (!(Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }

function Send-DiscordMessage($msg) {
    try {
        $json = @{ content = $msg } | ConvertTo-Json
        Invoke-RestMethod -Uri $discordWebhook -Method Post -Body $json -ContentType "application/json"
    } catch {}
}

Write-Host "Watching: $targetFile"

$lastHash = (Get-FileHash $targetFile -Algorithm SHA256).Hash

while ($true) {
    Start-Sleep -Seconds 5

    $currentHash = (Get-FileHash $targetFile -Algorithm SHA256).Hash

    if ($currentHash -ne $lastHash) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "$backupDir\docker-compose_$timestamp.yml"

        Copy-Item $targetFile $backupFile

        Write-Host "Backup created: $backupFile"
        Send-DiscordMessage("docker-compose.yml updated. Backup created: $backupFile")

        $lastHash = $currentHash
    }
}
