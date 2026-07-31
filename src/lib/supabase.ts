import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Prefer runtime config (Docker/Home Assistant, injected via public/env-config.js)
// and fall back to Vite build-time env vars (local `npm run dev`/`npm run build`).
const runtimeConfig = window.__RUNTIME_CONFIG__
const supabaseUrl = runtimeConfig?.SUPABASE_URL || (import.meta.env.VITE_SUPABASE_URL as string)
const supabaseAnonKey = runtimeConfig?.SUPABASE_ANON_KEY || (import.meta.env.VITE_SUPABASE_ANON_KEY as string)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Fehlende Supabase-Konfiguration. Lokal: VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env setzen (siehe .env.example). Docker/HA: SUPABASE_URL und SUPABASE_ANON_KEY als Umgebungsvariable bzw. Addon-Option setzen.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
