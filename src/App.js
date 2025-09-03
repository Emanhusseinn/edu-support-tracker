// src/App.js
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { useEffect } from "react"
import { supabase } from "./supabaseClient"

import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './teacher/TeacherDashboard'
import StudentProfile from './pages/StudentProfile'

function ProtectedRoute({ children, allowed = [] }) {
  const { authReady, user, profile } = useAuth()
  const location = useLocation()

  if (!authReady) return null

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowed.length && profile?.role && !allowed.includes(profile.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}


function RedirectIfAuthed({ children }) {
  const { authReady, user, profile } = useAuth()

  if (!authReady) return null

  if (user) {
    const target = profile?.role === 'admin' ? '/admin' : '/teacher'
    return <Navigate to={target} replace />
  }
  return children
}


function AutoLogoutEvery24h({ children }) {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await supabase.auth.signOut({ scope: 'global' })
        localStorage.clear()
        sessionStorage.clear()
        indexedDB.deleteDatabase('supabase-auth')
        window.location.href = "/login"
      } catch (err) {
        console.error(err)
      }
    }, 24 * 60 * 60 * 1000) // كل 24 ساعة

    return () => clearInterval(interval)
  }, [])

  return children
}

export default function App() {
//   useEffect(() => {
//   // يمسح أي تخزين قديم كل مرة يفتح الموقع
//   localStorage.clear()
//   sessionStorage.clear()
//   indexedDB.deleteDatabase('supabase-auth')
// }, [])

  return (
    <AutoLogoutEvery24h>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <RedirectIfAuthed>
                <Navigate to="/login" replace />
              </RedirectIfAuthed>
            }
          />

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
              <ProtectedRoute allowed={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/:id"
            element={
              <ProtectedRoute allowed={['teacher']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
     </AutoLogoutEvery24h>
  )
}
