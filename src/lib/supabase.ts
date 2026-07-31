import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Runs before React ever mounts, so a thrown error here would otherwise
// leave a blank white page with no clue why. Show something instead.
function showConfigError(message: string): never {
  document.body.innerHTML = `<div style="font-family: sans-serif; max-width: 32rem; margin: 4rem auto; padding: 1.5rem; border: 1px solid #fca5a5; background: #fef2f2; color: #7f1d1d; border-radius: 0.5rem;">
    <strong>SwapBid: Konfigurationsfehler</strong>
    <p style="margin-top: 0.5rem;">${message}</p>
  </div>`
  throw new Error(message)
}

function resolveConfig() {
  // Prefer runtime config (Docker/Home Assistant, injected via public/env-config.js)
  // and fall back to Vite build-time env vars (local `npm run dev`/`npm run build`).
  const runtimeConfig = window.__RUNTIME_CONFIG__
  const rawUrl = runtimeConfig?.SUPABASE_URL || (import.meta.env.VITE_SUPABASE_URL as string)
  const anonKey = runtimeConfig?.SUPABASE_ANON_KEY || (import.meta.env.VITE_SUPABASE_ANON_KEY as string)

  if (!rawUrl || !anonKey) {
    showConfigError(
      'Fehlende Supabase-Konfiguration. Lokal: VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env setzen (siehe .env.example). Docker/HA: SUPABASE_URL und SUPABASE_ANON_KEY als Umgebungsvariable bzw. Addon-Option setzen.'
    )
  }

  // Tolerate a bare hostname (missing "https://") — a common copy/paste mistake.
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
  return { url, anonKey }
}

const { url, anonKey } = resolveConfig()

export const supabase = createClient<Database>(url, anonKey)
