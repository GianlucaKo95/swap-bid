/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Injected via public/env-config.js, loaded before the app bundle. In the
// Docker image, docker-entrypoint.sh regenerates that file at container
// startup from environment variables / Home Assistant add-on options.
interface Window {
  __RUNTIME_CONFIG__?: {
    SUPABASE_URL?: string
    SUPABASE_ANON_KEY?: string
  }
}
