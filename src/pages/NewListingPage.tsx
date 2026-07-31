import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES } from '../lib/categories'

export default function NewListingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0].value)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)

    const { data, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        title,
        description,
        amount: Number(amount),
        category,
      })
      .select('id')
      .single()

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate(`/gesuche/${data.id}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Geld anbieten</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Titel</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. Ich habe 20€ übrig – was bekomme ich dafür?"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Betrag (€)</label>
          <input
            required
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kategorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Was suchst du ungefähr? Wünsche, Zustand, etc."
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-600 text-white px-4 py-2 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Wird veröffentlicht…' : 'Gesuch veröffentlichen'}
        </button>
      </form>
    </div>
  )
}
