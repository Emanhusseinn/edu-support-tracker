// src/App.js
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './teacher/TeacherDashboard'
import StudentProfile from './pages/StudentProfile'

// Landing Page الجديدة
import LandingPage from './components/landing/LandingPage'

function ProtectedRoute({ children, allowed }) {
  const { user, profile, loading } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (loading || (user && !profile)) {
    return <div style={{ padding: 40 }}>Loading...</div>
  }

  if (allowed && profile?.role && !allowed.includes(profile.role)) {
    return <div style={{ padding: 40 }}>Access denied</div>
  }

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
          {/* Landing page as default route */}
          <Route path="/" element={ <RedirectIfAuthed><LandingPage/> </RedirectIfAuthed>} />

          {/* Login */}
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <Login />
              </RedirectIfAuthed>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowed={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Teacher */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowed={['teacher', 'admin'] }>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Profile */}
          <Route
            path="/student/:id"
            element={
              <ProtectedRoute allowed={['teacher', 'admin']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
           <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
