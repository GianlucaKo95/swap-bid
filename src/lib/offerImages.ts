import { supabase } from './supabase'

const BUCKET = 'offer-images'

export const MAX_OFFER_IMAGES = 5
export const MAX_OFFER_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB, matches the storage bucket limit

export async function uploadOfferImages(userId: string, files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : ''
    const path = `${userId}/${crypto.randomUUID()}${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file)
    if (error) throw error
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
  }
  return urls
}
