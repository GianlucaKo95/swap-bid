import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error, session } = await signUp(email, password, displayName)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    if (session) {
      // Email confirmation is disabled — already signed in, no need to detour via /login.
      navigate('/')
      return
    }
    setSuccess(true)
    setTimeout(() => navigate('/login'), 2000)
  }

  if (success) {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Fast geschafft!</h1>
        <p className="text-gray-600">
          Bitte bestätige deine E-Mail-Adresse (falls von deinem Supabase-Projekt gefordert) und melde dich dann an.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-6">Registrieren</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Anzeigename</label>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">E-Mail</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Passwort</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 text-white px-4 py-2 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Wird erstellt…' : 'Konto erstellen'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Schon registriert?{' '}
        <Link to="/login" className="text-brand-700 hover:underline">
          Anmelden
        </Link>
      </p>
    </div>
  )
}
