import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Route parente : redirige vers /login tant qu'il n'y a pas de session. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return null
  return session ? <Outlet /> : <Navigate to="/login" replace />
}
