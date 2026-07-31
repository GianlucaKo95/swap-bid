// Authoritative, server-side counterpart to the client-side nsfwjs check in
// src/lib/nsfwCheck.ts. That check runs in the browser and can be skipped by
// anyone calling the Storage API directly; this function is the only thing
// with permission to write to the offer-images bucket (see migration
// 0005_lock_down_offer_image_uploads.sql), so there's no way around it.
//
// Requires two secrets to be set (`supabase secrets set ...`):
//   SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET
// (sign up for a free account at https://sightengine.com — the free tier
// covers a personal deployment's volume). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided automatically by the platform.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BUCKET = 'offer-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
// Sightengine's nudity-2.1 model returns a "none" probability (image is
// safe); reject once we're less than 50% confident it's safe.
const MIN_SAFE_CONFIDENCE = 0.5

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Nicht angemeldet.' }, 401)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

  if (authError || !user) {
    return jsonResponse({ error: 'Nicht angemeldet.' }, 401)
  }

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return jsonResponse({ error: 'Keine Datei übermittelt.' }, 400)
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonResponse({ error: 'Dateityp nicht erlaubt.' }, 400)
  }
  if (file.size > MAX_FILE_SIZE) {
    return jsonResponse({ error: 'Datei zu groß (max. 5 MB).' }, 400)
  }

  const sightengineForm = new FormData()
  sightengineForm.append('media', file)
  sightengineForm.append('models', 'nudity-2.1')
  sightengineForm.append('api_user', Deno.env.get('SIGHTENGINE_API_USER')!)
  sightengineForm.append('api_secret', Deno.env.get('SIGHTENGINE_API_SECRET')!)

  let moderation: { nudity?: { none?: number } }
  try {
    const moderationResponse = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: sightengineForm,
    })
    if (!moderationResponse.ok) throw new Error(`Sightengine returned ${moderationResponse.status}`)
    moderation = await moderationResponse.json()
  } catch (err) {
    console.error('Moderation request failed', err)
    return jsonResponse({ error: 'Bildprüfung fehlgeschlagen. Bitte später erneut versuchen.' }, 502)
  }

  const safeConfidence = moderation.nudity?.none ?? 0
  if (safeConfidence < MIN_SAFE_CONFIDENCE) {
    return jsonResponse({ error: 'Foto abgelehnt: unangemessener Inhalt.' }, 422)
  }

  const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : ''
  const path = `${user.id}/${crypto.randomUUID()}${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type })

  if (uploadError) {
    return jsonResponse({ error: uploadError.message }, 500)
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return jsonResponse({ url: publicUrlData.publicUrl }, 200)
})
