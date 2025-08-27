import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentProfile from './pages/StudentProfile'

function ProtectedRoute({ children, allowed }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowed && !allowed.includes(profile?.role)) return <div style={{ padding: 40 }}>Access denied</div>
  return children
}

function RedirectIfAuthed({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (user) {
    const target = (profile?.role === 'admin') ? '/admin' : '/teacher'
    return <Navigate to={target} replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RedirectIfAuthed><Navigate to="/login" replace /></RedirectIfAuthed>} />
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <Login />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowed={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowed={['teacher', 'admin'] }>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/:id"
            element={
              <ProtectedRoute allowed={['teacher', 'admin']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
