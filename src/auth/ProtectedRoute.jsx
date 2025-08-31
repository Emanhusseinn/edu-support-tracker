// src/routes/ProtectedRoute.jsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function ProtectedRoute({ allow = ['teacher', 'admin'], children }) {
  const { authReady, user, profile } = useAuth()

  if (!authReady) return null

  if (!user) return <Navigate to="/login" replace />

  if (allow.length && profile?.role && !allow.includes(profile.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}
