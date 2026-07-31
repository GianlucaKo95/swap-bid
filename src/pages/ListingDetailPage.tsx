import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { categoryLabel } from '../lib/categories'
import { MAX_OFFER_IMAGES, MAX_OFFER_IMAGE_SIZE, uploadOfferImages } from '../lib/offerImages'
import StatusBadge from '../components/StatusBadge'
import StarRating from '../components/StarRating'
import UserRatingBadge from '../components/UserRatingBadge'
import ReportButton from '../components/ReportButton'

interface ListingWithOwner {
  id: string
  user_id: string
  title: string
  description: string
  amount: number
  category: string
  location: string
  status: 'open' | 'matched' | 'closed'
  created_at: string
  profiles: { display_name: string } | null
}

interface Rating {
  id: string
  listing_id: string
  rater_id: string
  ratee_id: string
  stars: number
  comment: string
}

type RatingSummaries = Record<string, { avg_stars: number; rating_count: number }>


interface OfferWithOwner {
  id: string
  listing_id: string
  user_id: string
  title: string
  description: string
  image_urls: string[]
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
  const [offerFiles, setOfferFiles] = useState<File[]>([])
  const [offerPreviews, setOfferPreviews] = useState<string[]>([])
  const [offerAcceptedTerms, setOfferAcceptedTerms] = useState(false)
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerError, setOfferError] = useState<string | null>(null)

  const [ratingSummaries, setRatingSummaries] = useState<RatingSummaries>({})
  const [myRating, setMyRating] = useState<Rating | null>(null)
  const [ratingStars, setRatingStars] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)

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

    let loadedListing: ListingWithOwner | null = null
    let loadedOffers: OfferWithOwner[] = []

    if (listingError) setError(listingError.message)
    else {
      loadedListing = listingData as unknown as ListingWithOwner
      setListing(loadedListing)
    }

    if (offersError) setError(offersError.message)
    else {
      loadedOffers = (offersData ?? []) as unknown as OfferWithOwner[]
      setOffers(loadedOffers)
    }

    const userIds = Array.from(
      new Set([loadedListing?.user_id, ...loadedOffers.map((o) => o.user_id)].filter(Boolean))
    ) as string[]

    if (userIds.length > 0) {
      const { data: summaryData } = await supabase
        .from('user_rating_summary')
        .select('*')
        .in('user_id', userIds)
      const map: RatingSummaries = {}
      for (const row of summaryData ?? []) {
        map[row.user_id] = { avg_stars: row.avg_stars, rating_count: row.rating_count }
      }
      setRatingSummaries(map)
    }

    if (user && id) {
      const { data: ratingData } = await supabase
        .from('ratings')
        .select('*')
        .eq('listing_id', id)
        .eq('rater_id', user.id)
        .maybeSingle()
      setMyRating(ratingData ?? null)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  useEffect(() => {
    const previews = offerFiles.map((file) => URL.createObjectURL(file))
    setOfferPreviews(previews)
    return () => previews.forEach((url) => URL.revokeObjectURL(url))
  }, [offerFiles])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = '' // allow re-selecting the same file after removing it

    const oversized = selected.find((file) => file.size > MAX_OFFER_IMAGE_SIZE)
    if (oversized) {
      setOfferError(`„${oversized.name}“ ist größer als ${MAX_OFFER_IMAGE_SIZE / 1024 / 1024} MB.`)
      return
    }

    setOfferError(null)
    setOfferFiles((files) => [...files, ...selected].slice(0, MAX_OFFER_IMAGES))
  }

  function removeOfferFile(index: number) {
    setOfferFiles((files) => files.filter((_, i) => i !== index))
  }

  async function handleOfferSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !id) return
    setOfferSubmitting(true)
    setOfferError(null)

    let imageUrls: string[] = []
    try {
      if (offerFiles.length > 0) {
        imageUrls = await uploadOfferImages(user.id, offerFiles)
      }
    } catch (err) {
      setOfferSubmitting(false)
      setOfferError(err instanceof Error ? err.message : 'Fotos konnten nicht hochgeladen werden.')
      return
    }

    const { error } = await supabase.from('offers').insert({
      listing_id: id,
      user_id: user.id,
      title: offerTitle,
      description: offerDescription,
      image_urls: imageUrls,
    })

    setOfferSubmitting(false)
    if (error) {
      setOfferError(error.message)
      return
    }
    setOfferTitle('')
    setOfferDescription('')
    setOfferFiles([])
    setOfferAcceptedTerms(false)
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

  async function handleRatingSubmit(e: FormEvent, rateeId: string) {
    e.preventDefault()
    if (!user || !id || ratingStars === 0) return
    setRatingSubmitting(true)
    setRatingError(null)

    const { error } = await supabase.from('ratings').insert({
      listing_id: id,
      rater_id: user.id,
      ratee_id: rateeId,
      stars: ratingStars,
      comment: ratingComment,
    })

    setRatingSubmitting(false)
    if (error) {
      setRatingError(error.message)
      return
    }
    setRatingStars(0)
    setRatingComment('')
    await loadData()
  }

  if (loading) return <p className="text-gray-500">Lädt…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!listing) return <p className="text-gray-500">Gesuch nicht gefunden.</p>

  const isOwner = user?.id === listing.user_id
  const canOffer = user && !isOwner && listing.status === 'open'

  const acceptedOffer = offers.find((o) => o.status === 'accepted')
  const isAcceptedBidder = !!user && !!acceptedOffer && user.id === acceptedOffer.user_id
  const ratee =
    listing.status === 'matched' && acceptedOffer
      ? isOwner
        ? { id: acceptedOffer.user_id, name: acceptedOffer.profiles?.display_name ?? 'Unbekannt' }
        : isAcceptedBidder
          ? { id: listing.user_id, name: listing.profiles?.display_name ?? 'Unbekannt' }
          : null
      : null
  const canRate = !!ratee && !myRating

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
          {listing.location && <span className="text-xs text-gray-400">📍 {listing.location}</span>}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">von {listing.profiles?.display_name ?? 'Unbekannt'}</span>
          <UserRatingBadge summary={ratingSummaries[listing.user_id]} />
        </div>
        {listing.description && <p className="mt-4 text-gray-700 whitespace-pre-wrap">{listing.description}</p>}
        <div className="mt-3">
          <ReportButton targetType="listing" targetId={listing.id} />
        </div>
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
              {offer.image_urls.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {offer.image_urls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt={`Foto zu Angebot „${offer.title}“`}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                    </a>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">von {offer.profiles?.display_name ?? 'Unbekannt'}</span>
                <UserRatingBadge summary={ratingSummaries[offer.user_id]} />
              </div>
              <div className="mt-2">
                <ReportButton targetType="offer" targetId={offer.id} />
              </div>

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
            <div>
              <label className="block text-sm font-medium mb-1">
                Fotos (optional, max. {MAX_OFFER_IMAGES}, je bis {MAX_OFFER_IMAGE_SIZE / 1024 / 1024} MB)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={offerFiles.length >= MAX_OFFER_IMAGES}
                onChange={handleFileChange}
                className="w-full text-sm"
              />
              {offerPreviews.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {offerPreviews.map((url, index) => (
                    <div key={url} className="relative">
                      <img src={url} alt="" className="w-20 h-20 object-cover rounded-md border" />
                      <button
                        type="button"
                        onClick={() => removeOfferFile(index)}
                        aria-label="Foto entfernen"
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-700 text-white text-xs leading-5"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input
                required
                type="checkbox"
                checked={offerAcceptedTerms}
                onChange={(e) => setOfferAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <span>
                Ich bestätige, dass mein Angebot keine verbotenen Inhalte enthält (siehe{' '}
                <Link to="/nutzungsbedingungen" target="_blank" className="text-brand-700 hover:underline">
                  Nutzungsbedingungen
                </Link>
                ).
              </span>
            </label>
            {offerError && <p className="text-red-600 text-sm">{offerError}</p>}
            <button
              type="submit"
              disabled={offerSubmitting || !offerAcceptedTerms}
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

      {canRate && ratee && (
        <div className="mt-8 bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Bewerte {ratee.name}</h2>
          <form onSubmit={(e) => handleRatingSubmit(e, ratee.id)} className="space-y-3">
            <StarRating value={ratingStars} onChange={setRatingStars} size="md" />
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              rows={2}
              placeholder="Kommentar (optional)"
              className="w-full border rounded-md px-3 py-2"
            />
            {ratingError && <p className="text-red-600 text-sm">{ratingError}</p>}
            <button
              type="submit"
              disabled={ratingSubmitting || ratingStars === 0}
              className="bg-brand-600 text-white px-4 py-2 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {ratingSubmitting ? 'Wird gesendet…' : 'Bewertung abgeben'}
            </button>
          </form>
        </div>
      )}

      {myRating && (
        <div className="mt-8 bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Deine Bewertung</h2>
          <StarRating value={myRating.stars} size="md" />
          {myRating.comment && <p className="text-sm text-gray-600 mt-2">{myRating.comment}</p>}
        </div>
      )}
    </div>
  )
}
