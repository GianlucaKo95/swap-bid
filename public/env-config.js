// Placeholder for local dev / npm run build.
// In the Docker image this file is regenerated at container startup
// (see docker-entrypoint.sh) with the real Supabase credentials, so the
// image can be built once and configured per environment (Docker env vars
// or Home Assistant add-on options) instead of at build time.
window.__RUNTIME_CONFIG__ = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
}
