$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$BinDir = Join-Path $Root "bin"
$Cloudflared = Join-Path $BinDir "cloudflared.exe"
$EnvFile = Join-Path $Root "apps\api\.env"
$LogFile = Join-Path $Root ".zoom-tunnel.log"
$UrlFile = Join-Path $Root ".zoom-tunnel.url"
$Port = 3001

if (-not (Test-Path $Cloudflared)) {
  New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
  $downloadUrl =
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
  Write-Host "Downloading cloudflared..."
  Invoke-WebRequest -Uri $downloadUrl -OutFile $Cloudflared -UseBasicParsing
}

$existing = Get-Process cloudflared -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Stopping existing cloudflared process..."
  $existing | Stop-Process -Force
  Start-Sleep -Seconds 2
}

if (Test-Path $LogFile) {
  Remove-Item $LogFile -Force
}

Start-Process `
  -FilePath $Cloudflared `
  -ArgumentList @("tunnel", "--url", "http://127.0.0.1:$Port") `
  -RedirectStandardError $LogFile `
  -WindowStyle Hidden | Out-Null

$deadline = (Get-Date).AddSeconds(90)
$tunnelUrl = $null

while ((Get-Date) -lt $deadline) {
  if (Test-Path $LogFile) {
    $content = Get-Content $LogFile -Raw -ErrorAction SilentlyContinue
    if ($content -match "https://[a-z0-9-]+\.trycloudflare\.com") {
      $tunnelUrl = $Matches[0]
      break
    }
  }
  Start-Sleep -Seconds 2
}

if (-not $tunnelUrl) {
  Write-Error "Tunnel URL not found within 90 seconds. Check $LogFile"
  exit 1
}

$redirectUri = "$tunnelUrl/api/integrations/zoom/callback"

Set-Content -Path $UrlFile -Value $tunnelUrl

if (Test-Path $EnvFile) {
  $envContent = Get-Content $EnvFile -Raw
  if ($envContent -match "PUBLIC_API_URL=") {
    $envContent = $envContent -replace "PUBLIC_API_URL=.*", "PUBLIC_API_URL=$tunnelUrl"
  } else {
    $envContent += "`nPUBLIC_API_URL=$tunnelUrl"
  }
  Set-Content -Path $EnvFile -Value $envContent.TrimEnd() -NoNewline
}

Write-Host ""
Write-Host "Zoom HTTPS tunnel is ready." -ForegroundColor Green
Write-Host "Tunnel URL:   $tunnelUrl"
Write-Host "Redirect URI: $redirectUri"
Write-Host ""
Write-Host "Update the Zoom app OAuth redirect URL and allow list with the values above."
Write-Host "Restart the API after updating apps/api/.env."
