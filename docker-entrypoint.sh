#!/bin/sh
set -eu

OPTIONS_FILE=/data/options.json

# Home Assistant add-on: Supervisor writes configured options here.
if [ -f "$OPTIONS_FILE" ]; then
  SUPABASE_URL=$(jq -r '.supabase_url // empty' "$OPTIONS_FILE")
  SUPABASE_ANON_KEY=$(jq -r '.supabase_anon_key // empty' "$OPTIONS_FILE")
fi

: "${SUPABASE_URL:?SUPABASE_URL fehlt (Docker: Umgebungsvariable setzen; HA-Addon: supabase_url in der Konfiguration eintragen)}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY fehlt (Docker: Umgebungsvariable setzen; HA-Addon: supabase_anon_key in der Konfiguration eintragen)}"

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  SUPABASE_URL: "${SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}"
};
EOF

exec "$@"
