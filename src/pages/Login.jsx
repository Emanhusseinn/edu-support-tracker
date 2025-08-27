// pages/Login.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import '../styles/auth.scss'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const nav = useNavigate()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('teacher')
  const [busy, setBusy] = useState(false)

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
      const { profile } = await signUp(email, password, name, role)
      goByRole(profile?.role)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-hero">
      <div className="auth-card">
        <header>
          <h2>{mode === 'login' ? 'Login' : 'Registration'}</h2>
          <button className="x" title="Close" onClick={()=>nav('/')}>✕</button>
        </header>

        <div className="tabs">
          <button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>Login</button>
          <button className={mode==='register'?'active':''} onClick={()=>setMode('register')}>Register</button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          {mode === 'register' && (
            <>
              <div className="field">
                <label>Full name</label>
                <input value={name} onChange={e=>setName(e.target.value)} required />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={role} onChange={e=>setRole(e.target.value)}>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>

          <div className="submit">
            <button disabled={busy}>
              {busy ? 'Please wait…' : (mode==='login' ? 'Login' : 'Create account')}
            </button>
          </div>

          <div className="meta">
            {mode==='login'
              ? <>Don’t have an account? <button type="button" className="link" onClick={()=>setMode('register')}>Register</button></>
              : <>Already have an account? <button type="button" className="link" onClick={()=>setMode('login')}>Login</button></>
            }
          </div>
        </form>
      </div>
    </div>
  )
}
