import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Gate() {
  const { loading, user, profile } = useAuth()
  if (loading) return <div style={{padding:20}}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />
  const target = profile.role === 'admin' ? '/admin' : '/teacher'
  return <Navigate to={target} replace />
}
