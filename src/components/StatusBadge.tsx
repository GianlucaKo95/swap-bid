const STYLES: Record<string, string> = {
  open: 'bg-brand-100 text-brand-700',
  matched: 'bg-amber-100 text-amber-700',
  closed: 'bg-gray-200 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-brand-100 text-brand-700',
  rejected: 'bg-red-100 text-red-600',
}

const LABELS: Record<string, string> = {
  open: 'Offen',
  matched: 'Vergeben',
  closed: 'Geschlossen',
  pending: 'Ausstehend',
  accepted: 'Angenommen',
  rejected: 'Abgelehnt',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
