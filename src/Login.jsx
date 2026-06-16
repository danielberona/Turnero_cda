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

  return (
    <div style={{ minHeight: '100vh', background: '#FEF08A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ width: 400, background: '#FFFFFF', border: '1px solid #EDE8D5', borderRadius: 20, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <img src="/logocda.png" alt="CDA La Cordialidad" style={{ height: 48, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>CDA La Cordialidad</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7A8696', letterSpacing: '.1em', textTransform: 'uppercase' }}>Panel del operario</div>
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#76808F', marginBottom: 7 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="operario@cda.com"
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2E7EF', borderRadius: 11, fontSize: 15, color: '#0F172A', background: '#FBFCFE', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#0F172A'; e.target.style.background = '#fff' }}
              onBlur={e  => { e.target.style.borderColor = '#E2E7EF'; e.target.style.background = '#FBFCFE' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#76808F', marginBottom: 7 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2E7EF', borderRadius: 11, fontSize: 15, color: '#0F172A', background: '#FBFCFE', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#0F172A'; e.target.style.background = '#fff' }}
              onBlur={e  => { e.target.style.borderColor = '#E2E7EF'; e.target.style.background = '#FBFCFE' }}
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
            style={{ width: '100%', marginTop: 8, padding: '14px', border: 'none', borderRadius: 12, background: '#EAB308', color: '#1A1200', fontFamily: 'inherit', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity .15s' }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 12.5, color: '#8A94A3', textAlign: 'center' }}>
          Crea el operario en <strong>Supabase → Authentication → Users</strong>
        </p>
      </div>
    </div>
  )
}
