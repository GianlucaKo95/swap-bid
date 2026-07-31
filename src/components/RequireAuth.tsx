import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="text-gray-500">Lädt…</p>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}
