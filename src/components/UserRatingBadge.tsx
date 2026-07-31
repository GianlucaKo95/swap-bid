import StarRating from './StarRating'

interface UserRatingBadgeProps {
  summary: { avg_stars: number; rating_count: number } | undefined
}

export default function UserRatingBadge({ summary }: UserRatingBadgeProps) {
  if (!summary || summary.rating_count === 0) {
    return <span className="text-xs text-gray-400">Noch keine Bewertungen</span>
  }

  return (
    <span className="inline-flex items-center gap-1">
      <StarRating value={summary.avg_stars} />
      <span className="text-xs text-gray-500">
        {summary.avg_stars.toLocaleString('de-DE')} ({summary.rating_count})
      </span>
    </span>
  )
}
