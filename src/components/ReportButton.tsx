import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { REPORT_REASONS } from '../lib/reportReasons'
import type { ReportTargetType } from '../lib/database.types'

export default function ReportButton({
  targetType,
  targetId,
}: {
  targetType: ReportTargetType
  targetId: string
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>(REPORT_REASONS[0].value)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return <span className="text-xs text-gray-400">Danke, dein Hinweis wurde gespeichert.</span>
  }

  if (!user) {
    return (
      <Link to="/login" className="text-xs text-gray-400 hover:underline">
        Anmelden, um zu melden
      </Link>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-red-600 hover:underline"
      >
        🚩 Melden
      </button>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      comment,
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setSubmitted(true)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 p-3 bg-gray-50 border rounded-md space-y-2 text-sm">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full border rounded-md px-2 py-1 text-sm"
      >
        {REPORT_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Details (optional)"
        className="w-full border rounded-md px-2 py-1 text-sm"
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? 'Wird gesendet…' : 'Melden'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs border px-3 py-1.5 rounded-md hover:bg-gray-100"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}
