#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/apps/api/.env"
LOG_FILE="$ROOT/.oauth-tunnel.log"
URL_FILE="$ROOT/.oauth-tunnel.url"
PORT="${OAUTH_TUNNEL_PORT:-3001}"

pkill -f "cloudflared tunnel --url http://127.0.0.1:3000" 2>/dev/null || true
pkill -f "cloudflared tunnel --url http://127.0.0.1:3001" 2>/dev/null || true
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
echo "$tunnel_url" > "$URL_FILE"

update_env_var() {
  local key="$1"
  local value="$2"
  if [[ ! -f "$ENV_FILE" ]]; then
    return
  fi
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

update_env_var "PUBLIC_API_URL" "$tunnel_url"

echo ""
echo "OAuth HTTPS tunnel is ready (API port $PORT)."
echo "Tunnel URL: $tunnel_url"
echo "PUBLIC_API_URL updated in apps/api/.env"
echo ""
echo "OAuth redirect URIs (register each in the provider app):"
echo "  Zoom:    ${tunnel_url}/api/integrations/zoom/callback"
echo "  Jira:    ${tunnel_url}/api/integrations/jira/callback"
echo "  Outlook: ${tunnel_url}/api/integrations/outlook/callback"
echo "  Google:  ${tunnel_url}/api/integrations/google-calendar/callback"
echo ""
echo "Restart the API after this script updates apps/api/.env."
