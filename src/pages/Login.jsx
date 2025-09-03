// pages/Login.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import '../styles/auth.scss'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const nav = useNavigate()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [busy, setBusy] = useState(false)

  // عرض/إخفاء كلمة المرور
  const [showPwd, setShowPwd] = useState(false)
  const togglePwd = () => setShowPwd(v => !v)

  function goByRole(role) {
    nav(role === 'admin' ? '/admin' : '/teacher', { replace: true })
  }

  async function handleLogin(e) {
    e.preventDefault()
    try {
      setBusy(true)
      const { profile } = await signIn(email, password)
      goByRole(profile?.role)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    try {
      setBusy(true)
      const FIXED_ROLE = 'teacher' // دايمًا teacher
      const { profile } = await signUp(email, password, name, school)
      goByRole(profile?.role)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-hero" dir="rtl" lang="ar">
      <div className="auth-card">
        <header>
          <h2>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</h2>
          <button className="x" title="Close" onClick={()=>nav('/')}>✕</button>
        </header>

        <div className="tabs">
          <button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>تسجيل الدخول</button>
          <button className={mode==='register'?'active':''} onClick={()=>setMode('register')}>إنشاء حساب</button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          {mode === 'register' && (
            <>
              <div className="field">
                <label>الاسم الكامل</label>
                <input value={name} onChange={e=>setName(e.target.value)} required />
              </div>

              <div className="field">
                <label>اسم المدرسة</label>
                <input value={school} onChange={e=>setSchool(e.target.value)} required />
              </div>
              {/* الدور محذوف — التسجيل دايمًا Teacher */}
            </>
          )}

          <div className="field">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>

          <div className="field password-field">
            <label>كلمة المرور</label>
            <div className="pwd-wrap">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e=>setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={togglePwd}
                aria-label={showPwd ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                title={showPwd ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="submit">
            <button disabled={busy}>
              {busy ? 'يرجى الانتظار…' : (mode==='login' ? 'دخول' : 'إنشاء حساب')}
            </button>
          </div>

          <div className="meta">
            {mode==='login'
              ? <>ليس لديك حساب؟ <button type="button" className="link" onClick={()=>setMode('register')}>إنشاء حساب</button></>
              : <>لديك حساب بالفعل؟ <button type="button" className="link" onClick={()=>setMode('login')}>تسجيل الدخول</button></>
            }
          </div>
        </form>
      </div>
    </div>
  )
}
