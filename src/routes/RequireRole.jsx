import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function RequireRole({ roles, children }) {
  const { loading, user, profile } = useAuth()
  if (loading) return <div style={{padding:20}}>Loading...</div>
  if (!user || !profile) return <Navigate to="/login" replace />
  if (!roles.includes(profile.role)) return <div style={{padding:20}}>Access denied</div>
  return children
}
