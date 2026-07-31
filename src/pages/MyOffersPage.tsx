import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'

interface OfferWithListing {
  id: string
  title: string
  description: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  listing_id: string
  listings: { title: string; amount: number } | null
}

export default function MyOffersPage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<OfferWithListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('offers')
      .select('*, listings(title, amount)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOffers((data ?? []) as unknown as OfferWithListing[])
        setLoading(false)
      })
  }, [user])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Meine Angebote</h1>
      {loading && <p className="text-gray-500">Lädt…</p>}
      {!loading && offers.length === 0 && (
        <p className="text-gray-500">Du hast noch kein Angebot abgegeben.</p>
      )}
      <div className="space-y-3">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            to={`/gesuche/${offer.listing_id}`}
            className="block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium">{offer.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  für „{offer.listings?.title}“
                  {offer.listings && (
                    <> ({offer.listings.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })})</>
                  )}
                </p>
              </div>
              <StatusBadge status={offer.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
