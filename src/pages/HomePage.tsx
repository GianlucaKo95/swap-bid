import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import { CATEGORIES } from '../lib/categories'
import ListingCard from '../components/ListingCard'

type Listing = Database['public']['Tables']['listings']['Row']

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [location, setLocation] = useState('')

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

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false
      if (category && l.category !== category) return false
      if (minAmount && l.amount < Number(minAmount)) return false
      if (maxAmount && l.amount > Number(maxAmount)) return false
      if (location && !l.location.toLowerCase().includes(location.toLowerCase())) return false
      return true
    })
  }, [listings, search, category, minAmount, maxAmount, location])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Wer bietet mir was für mein Geld?</h1>
        <p className="text-gray-500 mt-1">
          Andere Nutzer:innen haben Bargeld übrig und suchen ein passendes Objekt dafür. Biete dein Objekt an!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
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
          type="text"
          placeholder="Umgebung (z. B. Berlin)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        />
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

      {loading && <p className="text-gray-500">Lädt…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-gray-500">Keine Gesuche gefunden.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}
