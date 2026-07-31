import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export const MAX_OFFER_IMAGES = 5
export const MAX_OFFER_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB, matches the Edge Function's limit

async function extractErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await (error.context as Response).json()
      if (body?.error) return body.error as string
    } catch {
      // fall through to the generic message below
    }
  }
  return error instanceof Error ? error.message : 'Foto-Upload fehlgeschlagen.'
}

// Uploads go through the moderate-offer-image Edge Function rather than
// straight to Storage — see supabase/functions/moderate-offer-image and
// migration 0005_lock_down_offer_image_uploads.sql for why: it's the only
// way to make the NSFW check unbypassable, since a client can always call
// the Storage API directly and skip a purely client-side check.
export async function uploadOfferImages(files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)

    const { data, error } = await supabase.functions.invoke<{ url: string }>('moderate-offer-image', {
      body: formData,
    })

    if (error) throw new Error(await extractErrorMessage(error))
    urls.push(data!.url)
  }
  return urls
}
