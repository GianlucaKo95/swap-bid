import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Database } from '../lib/database.types'
import ListingCard from '../components/ListingCard'
import { Link } from 'react-router-dom'

type Listing = Database['public']['Tables']['listings']['Row']

export default function MyListingsPage() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings(data ?? [])
        setLoading(false)
      })
  }, [user])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meine Gesuche</h1>
        <Link
          to="/neu"
          className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700"
        >
          Neues Gesuch
        </Link>
      </div>
      {loading && <p className="text-gray-500">Lädt…</p>}
      {!loading && listings.length === 0 && (
        <p className="text-gray-500">Du hast noch kein Gesuch erstellt.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}
