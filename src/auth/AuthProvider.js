// auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(uid) {
    if (!uid) { setProfile(null); return null }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, school_name')
      .eq('id', uid)
      .single()
    if (error) { setProfile(null); return null }
    setProfile(data)
    return data
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!alive) return
      setUser(session?.user ?? null)
    })()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )
    return () => { alive = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        if (user) await fetchProfile(user.id)
        else setProfile(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [user])

  async function refreshProfile() {
    if (!user) { setProfile(null); return null }
    return await fetchProfile(user.id)
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const p = await fetchProfile(data.user.id)
    return { user: data.user, profile: p }
  }

  async function signUp(email, password, full_name, role = 'teacher', school_name) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
       options: { data: { full_name, role, school_name } }
    })
    if (error) throw error
     const userId = data.user?.id
  if (userId) {
    const { error: upErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, full_name, role, school_name })
    if (upErr) throw upErr
  }
    // سِجّل دخوله مباشرة بعد الإنشاء
    const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({ email, password })
    if (e2) throw e2
    const p = await fetchProfile(d2.user.id)
    return { user: d2.user, profile: p }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
     localStorage.clear()
        sessionStorage.clear()
        indexedDB.deleteDatabase('supabase-auth')
        window.location.href = "/login"
  }

  const value = { user, profile, loading, signIn, signUp, signOut, refreshProfile }




  // 0) الخروج القاسي
async function hardLogout(reason = '') {
  try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
  try {
    localStorage.clear();
    sessionStorage.clear();
    try { indexedDB.deleteDatabase('supabase-auth'); } catch {}
  } catch {}
  window.location.replace('/login');
}

// 1) اسمع أمر الطرد من أي تاب/كل الأجهزة
useEffect(() => {
  // كل التابات في نفس المتصفح
  const onStorage = (e) => {
    if (e.key === 'APP_LOGOUT_ALL' && e.newValue) hardLogout('storage');
  };
  window.addEventListener('storage', onStorage);

  // Realtime broadcast: الأجهزة المتصلة الآن
  const chGlobal = supabase.channel('admin-global');
  chGlobal.on('broadcast', { event: 'logout_all' }, () => hardLogout('broadcast'));
  chGlobal.subscribe();

  return () => {
    window.removeEventListener('storage', onStorage);
    supabase.removeChannel(chGlobal);
  };
}, []);

// 2) اسمع تغيّر نسخة الـ logout (للأونلاين الآن، وللأوفلاين عند التشغيل)
useEffect(() => {
  async function checkVersion() {
    const { data } = await supabase
      .from('app_kv')
      .select('value')
      .eq('key', 'logout_version')
      .single();

    const current = Number(data?.value || 0);
    const seen = Number(localStorage.getItem('logout_version_seen') || 0);

    if (current > seen) {
      localStorage.setItem('logout_version_seen', String(current));
      await hardLogout('version');
    }
  }

  // فحص لحظي عند الإقلاع
  checkVersion();

  // استماع لأي تحديث من الداتابيس
  const chKV = supabase.channel('kv')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'app_kv',
      filter: 'key=eq.logout_version',
    }, checkVersion)
    .subscribe();

  return () => supabase.removeChannel(chKV);
}, []);
  





  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}