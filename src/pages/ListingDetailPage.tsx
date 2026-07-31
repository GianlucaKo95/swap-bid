import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { categoryLabel } from '../lib/categories'
import StatusBadge from '../components/StatusBadge'

interface ListingWithOwner {
  id: string
  user_id: string
  title: string
  description: string
  amount: number
  category: string
  status: 'open' | 'matched' | 'closed'
  created_at: string
  profiles: { display_name: string } | null
}

interface OfferWithOwner {
  id: string
  listing_id: string
  user_id: string
  title: string
  description: string
  image_url: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  profiles: { display_name: string } | null
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [listing, setListing] = useState<ListingWithOwner | null>(null)
  const [offers, setOffers] = useState<OfferWithOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [offerTitle, setOfferTitle] = useState('')
  const [offerDescription, setOfferDescription] = useState('')
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerError, setOfferError] = useState<string | null>(null)

  async function loadData() {
    if (!id) return
    setLoading(true)
    const [{ data: listingData, error: listingError }, { data: offersData, error: offersError }] =
      await Promise.all([
        supabase.from('listings').select('*, profiles(display_name)').eq('id', id).single(),
        supabase
          .from('offers')
          .select('*, profiles(display_name)')
          .eq('listing_id', id)
          .order('created_at', { ascending: false }),
      ])

    if (listingError) setError(listingError.message)
    else setListing(listingData as unknown as ListingWithOwner)

    if (offersError) setError(offersError.message)
    else setOffers((offersData ?? []) as unknown as OfferWithOwner[])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleOfferSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !id) return
    setOfferSubmitting(true)
    setOfferError(null)

    const { error } = await supabase.from('offers').insert({
      listing_id: id,
      user_id: user.id,
      title: offerTitle,
      description: offerDescription,
    })

    setOfferSubmitting(false)
    if (error) {
      setOfferError(error.message)
      return
    }
    setOfferTitle('')
    setOfferDescription('')
    await loadData()
  }

  async function handleAccept(offerId: string) {
    if (!listing) return
    const others = offers.filter((o) => o.id !== offerId)
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offerId)
    if (others.length > 0) {
      await supabase
        .from('offers')
        .update({ status: 'rejected' })
        .in(
          'id',
          others.map((o) => o.id)
        )
    }
    await supabase.from('listings').update({ status: 'matched' }).eq('id', listing.id)
    await loadData()
  }

  async function handleReject(offerId: string) {
    await supabase.from('offers').update({ status: 'rejected' }).eq('id', offerId)
    await loadData()
  }

  if (loading) return <p className="text-gray-500">Lädt…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!listing) return <p className="text-gray-500">Gesuch nicht gefunden.</p>

  const isOwner = user?.id === listing.user_id
  const canOffer = user && !isOwner && listing.status === 'open'

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="text-sm text-brand-700 hover:underline">
        ← Zurück zur Übersicht
      </Link>

      <div className="bg-white border rounded-lg p-6 mt-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <span className="text-brand-700 font-bold text-xl whitespace-nowrap">
            {listing.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
            {categoryLabel(listing.category)}
          </span>
          <StatusBadge status={listing.status} />
          <span className="text-xs text-gray-400">von {listing.profiles?.display_name ?? 'Unbekannt'}</span>
        </div>
        {listing.description && <p className="mt-4 text-gray-700 whitespace-pre-wrap">{listing.description}</p>}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Angebote ({offers.length})</h2>
        {offers.length === 0 && <p className="text-gray-500 text-sm">Noch keine Angebote.</p>}
        <div className="space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{offer.title}</h3>
                <StatusBadge status={offer.status} />
              </div>
              {offer.description && <p className="text-sm text-gray-600 mt-1">{offer.description}</p>}
              <p className="text-xs text-gray-400 mt-2">von {offer.profiles?.display_name ?? 'Unbekannt'}</p>

              {isOwner && listing.status === 'open' && offer.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAccept(offer.id)}
                    className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-md hover:bg-brand-700"
                  >
                    Annehmen
                  </button>
                  <button
                    onClick={() => handleReject(offer.id)}
                    className="text-sm border px-3 py-1.5 rounded-md hover:bg-gray-50"
                  >
                    Ablehnen
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {canOffer && (
        <div className="mt-8 bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Dein Angebot</h2>
          <form onSubmit={handleOfferSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Was bietest du für {listing.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}?</label>
              <input
                required
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                placeholder="z. B. Gebrauchtes Fahrrad, gut erhalten"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Details (optional)</label>
              <textarea
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                rows={3}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            {offerError && <p className="text-red-600 text-sm">{offerError}</p>}
            <button
              type="submit"
              disabled={offerSubmitting}
              className="bg-brand-600 text-white px-4 py-2 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {offerSubmitting ? 'Wird gesendet…' : 'Angebot senden'}
            </button>
          </form>
        </div>
      )}

      {!user && listing.status === 'open' && (
        <p className="mt-6 text-sm text-gray-500">
          <Link to="/login" className="text-brand-700 hover:underline">
            Melde dich an
          </Link>{' '}
          um ein Angebot abzugeben.
        </p>
      )}
    </div>
  )
}
