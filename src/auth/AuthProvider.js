// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  const [authReady, setAuthReady] = useState(false)

   function hasSbToken() {
  if (typeof window === 'undefined') return false
  try {
    return Object.keys(localStorage || {}).some(
      (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
    )
  } catch { return false }
}
  async function fetchProfile(uid) {
    if (!uid) {
      setProfile(null)
      return null
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, school_name')
      .eq('id', uid)
      .single()

    if (error) {
      console.error('[profiles] fetch error:', error)
      setProfile(null)
      return null
    }
    setProfile(data)
    return data
  }

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!alive) return
        const u = session?.user ?? null
        setUser(u)
        if (u) await fetchProfile(u.id)
      } finally {
        if (alive) setAuthReady(true)
      }
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) await fetchProfile(u.id)
      else setProfile(null)
      setAuthReady(true)
    })

    return () => {
      alive = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  // تحديث يدوي للبروفايل
  async function refreshProfile() {
    if (!user) { setProfile(null); return null }
    return await fetchProfile(user.id)
  }

  // تسجيل الدخول
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const p = await fetchProfile(data.user.id)
    try { localStorage.setItem('profile-cache', JSON.stringify(p || {})) } catch {}
    return { user: data.user, profile: p }
  }

  // إنشاء حساب — الدور دائمًا teacher
  async function signUp(email, password, full_name, school_name) {
    // بنسجل بنفس الوقت metadata كمان (اختياري)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role: 'teacher', school_name } }
    })
    if (error) throw error

    const userId = data.user?.id
    if (userId) {
      const { error: upErr } = await supabase
        .from('profiles')
        .upsert({ id: userId, full_name, role: 'teacher', school_name })
      if (upErr) throw upErr
    }

    // نسجّل دخوله بعد الإنشاء عشان يصير عنده سيشن مباشرة
    const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({ email, password })
    if (e2) throw e2

    const p = await fetchProfile(d2.user.id)
    try { localStorage.setItem('profile-cache', JSON.stringify(p || {})) } catch {}
    return { user: d2.user, profile: p }
  }

  // تسجيل الخروج
async function signOut() {
  try {
    // يطرد من كل الأجهزة
    await supabase.auth.signOut({ scope: 'global' })

    // امسحي كل التخزين المحلي
    localStorage.clear()
    sessionStorage.clear()
    indexedDB.deleteDatabase('supabase-auth')
    setAuthReady(true)

    setUser(null)
    setProfile(null)
  } catch (err) {
    console.error("Error during global logout:", err)
  }
}


  const value = {
    user,
    profile,
    authReady,       // ← استعملي هذا في ProtectedRoute بدل أي loading عام
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
