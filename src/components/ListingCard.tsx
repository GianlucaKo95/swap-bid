import { Link } from 'react-router-dom'
import type { Database } from '../lib/database.types'
import { categoryLabel } from '../lib/categories'
import StatusBadge from './StatusBadge'

type Listing = Database['public']['Tables']['listings']['Row']

export default function ListingCard({
  listing,
  distanceKm,
}: {
  listing: Listing
  distanceKm?: number
}) {
  return (
    <Link
      to={`/gesuche/${listing.id}`}
      className="block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg">{listing.title}</h3>
        <span className="text-brand-700 font-bold whitespace-nowrap">
          {listing.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </span>
      </div>
      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{listing.description}</p>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
          {categoryLabel(listing.category)}
        </span>
        {listing.location && (
          <span className="text-xs text-gray-400">
            📍 {listing.location}
            {distanceKm != null && ` · ${distanceKm.toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`}
          </span>
        )}
        <StatusBadge status={listing.status} />
      </div>
    </Link>
  )
}
