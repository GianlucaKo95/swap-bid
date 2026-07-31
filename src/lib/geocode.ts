export interface GeocodeResult {
  label: string
  lat: number
  lng: number
}

// Zippopotam.us: free, no API key, good enough for PLZ-level (not
// street-level) accuracy — the same granularity Kleinanzeigen-style radius
// search uses.
export async function geocodePostalCode(postalCode: string): Promise<GeocodeResult | null> {
  const response = await fetch(`https://api.zippopotam.us/de/${encodeURIComponent(postalCode)}`)
  if (!response.ok) return null

  const data = await response.json()
  const place = data.places?.[0]
  if (!place) return null

  return {
    label: `${postalCode} ${place['place name']}`,
    lat: Number(place.latitude),
    lng: Number(place.longitude),
  }
}
