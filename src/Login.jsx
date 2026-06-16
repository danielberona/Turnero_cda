import { useState } from 'react'
import { supabase } from './supabase'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const border   = '#FDE68A'
  const txt      = '#1C1000'
  const txt2     = '#78550A'

  return (
    <div style={{ minHeight: '100vh', background: '#FEFCE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ width: 400, background: '#FFFFFF', border: `1px solid ${border}`, borderRadius: 22, padding: 38, boxShadow: '0 4px 24px rgba(161,98,7,.10), 0 16px 48px rgba(161,98,7,.06)' }}>

        {/* Logo + título */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{ background: '#FEFCE8', borderRadius: 16, padding: '10px 16px', border: `1px solid ${border}` }}>
            <img src="/logocda.png" alt="CDA La Cordialidad" style={{ height: 52, width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: txt, letterSpacing: '-.01em' }}>CDA La Cordialidad</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: txt2, letterSpacing: '.14em', textTransform: 'uppercase', marginTop: 3 }}>Panel del operario</div>
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: txt2, marginBottom: 7 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="operario@cda.com"
              style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${border}`, borderRadius: 11, fontSize: 15, color: txt, background: '#FEFCE8', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = '#EAB308'; e.target.style.background = '#fff' }}
              onBlur={e  => { e.target.style.borderColor = border;    e.target.style.background = '#FEFCE8' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: txt2, marginBottom: 7 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${border}`, borderRadius: 11, fontSize: 15, color: txt, background: '#FEFCE8', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = '#EAB308'; e.target.style.background = '#fff' }}
              onBlur={e  => { e.target.style.borderColor = border;    e.target.style.background = '#FEFCE8' }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13.5, color: '#B91C1C', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, padding: '14px', border: 'none', borderRadius: 12, background: '#EAB308', color: txt, fontFamily: 'inherit', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background .15s' }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#CA8A04' }}
            onMouseOut={e  => { e.currentTarget.style.background = '#EAB308' }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p style={{ marginTop: 22, fontSize: 12.5, color: txt2, textAlign: 'center' }}>
          Crea el operario en <strong>Supabase → Authentication → Users</strong>
        </p>
      </div>
    </div>
  )
}
