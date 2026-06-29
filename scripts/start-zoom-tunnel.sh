#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/apps/api/.env"
LOG_FILE="$ROOT/.zoom-tunnel.log"
URL_FILE="$ROOT/.zoom-tunnel.url"
PORT=3001

pkill -f "cloudflared tunnel --url http://127.0.0.1:$PORT" 2>/dev/null || true
sleep 1

: > "$LOG_FILE"
cloudflared tunnel --url "http://127.0.0.1:$PORT" >> "$LOG_FILE" 2>&1 &
TUNNEL_PID=$!

deadline=$((SECONDS + 90))
tunnel_url=""

while (( SECONDS < deadline )); do
  tunnel_url=$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_FILE" | head -1 || true)
  if [[ -n "$tunnel_url" ]]; then
    break
  fi
  sleep 2
done

if [[ -z "$tunnel_url" ]]; then
  kill "$TUNNEL_PID" 2>/dev/null || true
  echo "Tunnel URL not found within 90 seconds. Check $LOG_FILE"
  exit 1
fi

disown "$TUNNEL_PID" 2>/dev/null || true

redirect_uri="${tunnel_url}/api/integrations/zoom/callback"
echo "$tunnel_url" > "$URL_FILE"

if [[ -f "$ENV_FILE" ]]; then
  if grep -q '^ZOOM_REDIRECT_URI=' "$ENV_FILE"; then
    sed -i '' "s|^ZOOM_REDIRECT_URI=.*|ZOOM_REDIRECT_URI=$redirect_uri|" "$ENV_FILE"
  else
    printf '\nZOOM_REDIRECT_URI=%s\n' "$redirect_uri" >> "$ENV_FILE"
  fi
fi

echo ""
echo "Zoom HTTPS tunnel is ready."
echo "Tunnel URL:   $tunnel_url"
echo "Redirect URI: $redirect_uri"
echo ""
echo "Add the Redirect URI to the Zoom app OAuth Redirect URL and Allow List."
echo "Restart the API after updating apps/api/.env."
