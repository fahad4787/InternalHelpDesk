#!/usr/bin/env bash
set -euo pipefail

# Exposes the Next.js dev server (port 3000) over HTTPS.
# OAuth callbacks under /api/integrations/*/callback are proxied to the API
# via apps/web/next.config.ts rewrites.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/apps/api/.env"
LOG_FILE="$ROOT/.web-tunnel.log"
URL_FILE="$ROOT/.web-tunnel.url"
PORT=3000

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

declare -a redirect_paths=(
  "ZOOM_REDIRECT_URI=/api/integrations/zoom/callback"
  "JIRA_REDIRECT_URI=/api/integrations/jira/callback"
  "OUTLOOK_REDIRECT_URI=/api/integrations/outlook/callback"
  "GOOGLE_REDIRECT_URI=/api/integrations/google-calendar/callback"
)

for entry in "${redirect_paths[@]}"; do
  key="${entry%%=*}"
  path="${entry#*=}"
  update_env_var "$key" "${tunnel_url}${path}"
done

slack_redirect=""
if [[ -f "$ENV_FILE" ]]; then
  slack_redirect=$(grep '^SLACK_REDIRECT_URI=' "$ENV_FILE" | cut -d= -f2- || true)
fi

echo ""
echo "Web HTTPS tunnel is ready (Next.js port $PORT)."
echo "Tunnel URL: $tunnel_url"
echo ""
echo "OAuth callbacks are proxied from Next.js to the API automatically."
echo "Zoom/Jira/Outlook/Google redirect URIs updated in apps/api/.env."
echo ""
echo "Slack redirect URI was NOT changed (must match the Slack app settings)."
if [[ -n "$slack_redirect" ]]; then
  echo "  Current SLACK_REDIRECT_URI: $slack_redirect"
  if [[ "$slack_redirect" != "${tunnel_url}/api/integrations/slack/callback" ]]; then
    echo ""
    echo "  WARNING: Tunnel URL and SLACK_REDIRECT_URI do not match."
    echo "  Ask your Slack app admin to add this redirect URL:"
    echo "    ${tunnel_url}/api/integrations/slack/callback"
    echo "  Then update SLACK_REDIRECT_URI in apps/api/.env and restart the API."
  fi
fi
