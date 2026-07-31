interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
}

export default function StarRating({ value, onChange, size = 'sm' }: StarRatingProps) {
  const interactive = !!onChange
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-2xl'

  return (
    <span className={`inline-flex ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          aria-label={`${star} Sterne`}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <span className={star <= Math.round(value) ? 'text-amber-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </span>
  )
}
