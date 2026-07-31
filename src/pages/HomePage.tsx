import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import { CATEGORIES } from '../lib/categories'
import { geocodePostalCode } from '../lib/geocode'
import { distanceKm } from '../lib/distance'
import ListingCard from '../components/ListingCard'

type Listing = Database['public']['Tables']['listings']['Row']

interface SearchCenter {
  label: string
  lat: number
  lng: number
}

const RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100]

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const [postalCodeInput, setPostalCodeInput] = useState('')
  const [searchCenter, setSearchCenter] = useState<SearchCenter | null>(null)
  const [radiusKm, setRadiusKm] = useState(25)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    supabase
      .from('listings')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setListings(data ?? [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleUseMyLocation() {
    setLocationError(null)
    if (!navigator.geolocation) {
      setLocationError('Standortermittlung wird von diesem Browser nicht unterstützt.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        setSearchCenter({
          label: 'Mein Standort',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        setLocating(false)
        setLocationError('Standort konnte nicht ermittelt werden. Bitte Zugriff erlauben oder PLZ eingeben.')
      }
    )
  }

  async function handleSearchByPostalCode() {
    if (!postalCodeInput.trim()) return
    setLocationError(null)
    setLocating(true)
    const geocoded = await geocodePostalCode(postalCodeInput.trim()).catch(() => null)
    setLocating(false)
    if (!geocoded) {
      setLocationError('Postleitzahl konnte nicht gefunden werden.')
      return
    }
    setSearchCenter(geocoded)
  }

  function clearSearchCenter() {
    setSearchCenter(null)
    setLocationError(null)
    setPostalCodeInput('')
  }

  const filtered = useMemo(() => {
    let result = listings.filter((l) => {
      if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false
      if (category && l.category !== category) return false
      if (minAmount && l.amount < Number(minAmount)) return false
      if (maxAmount && l.amount > Number(maxAmount)) return false
      return true
    })

    if (searchCenter) {
      result = result
        .filter((l) => l.lat != null && l.lng != null)
        .filter((l) => distanceKm(searchCenter.lat, searchCenter.lng, l.lat!, l.lng!) <= radiusKm)
        .sort(
          (a, b) =>
            distanceKm(searchCenter.lat, searchCenter.lng, a.lat!, a.lng!) -
            distanceKm(searchCenter.lat, searchCenter.lng, b.lat!, b.lng!)
        )
    }

    return result
  }, [listings, search, category, minAmount, maxAmount, searchCenter, radiusKm])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Wer bietet mir was für mein Geld?</h1>
        <p className="text-gray-500 mt-1">
          Andere Nutzer:innen haben Bargeld übrig und suchen ein passendes Objekt dafür. Biete dein Objekt an!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <input
          type="text"
          placeholder="Suche nach Titel…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">Alle Kategorien</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          placeholder="Min. Betrag (€)"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        />
        <input
          type="number"
          min="0"
          placeholder="Max. Betrag (€)"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="bg-white border rounded-lg p-3 mb-6 flex flex-wrap items-center gap-2">
        {searchCenter ? (
          <>
            <span className="text-sm">
              📍 Umkreis um <strong>{searchCenter.label}</strong>
            </span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="border rounded-md px-2 py-1 text-sm"
            >
              {RADIUS_OPTIONS_KM.map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={clearSearchCenter}
              className="text-sm text-gray-500 hover:underline"
            >
              zurücksetzen
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="text-sm border px-3 py-1.5 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              📍 Meinen Standort verwenden
            </button>
            <span className="text-sm text-gray-400">oder</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="PLZ für Umkreissuche"
              value={postalCodeInput}
              onChange={(e) => setPostalCodeInput(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm w-40"
            />
            <button
              type="button"
              onClick={handleSearchByPostalCode}
              disabled={locating || !postalCodeInput.trim()}
              className="text-sm border px-3 py-1.5 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {locating ? 'Suche…' : 'Suchen'}
            </button>
          </>
        )}
        {locationError && <span className="text-sm text-red-600">{locationError}</span>}
      </div>

      {loading && <p className="text-gray-500">Lädt…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-gray-500">Keine Gesuche gefunden.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            distanceKm={
              searchCenter && listing.lat != null && listing.lng != null
                ? distanceKm(searchCenter.lat, searchCenter.lng, listing.lat, listing.lng)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}
