import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, registrarTurno, llamarSiguiente, marcarAtendido } from './supabase'
import { CATS, codigoDisplay } from './constants'

export default function PanelAdmin({ onLogout }) {
  const [queues,       setQueues]       = useState({ A: [], R: [], B: [], V: [] })
  const [current,      setCurrent]      = useState({ A: null, R: null, B: null, V: null })
  const [plate,        setPlate]        = useState('')
  const [name,         setName]         = useState('')
  const [cedula,       setCedula]       = useState('')
  const [selCat,       setSelCat]       = useState('')
  const [lastAssigned, setLastAssigned] = useState('')
  const [loading,      setLoading]      = useState(false)
  const [clock,        setClock]        = useState({ time: '', date: '' })

  const clockRef = useRef(null)
  const dateRef  = useRef(null)
  const callRefs = useRef({ A: null, B: null, R: null, V: null })

  // ── Clock ──────────────────────────────────────────────────
  const tickClock = () => {
    const now = new Date()
    const time = now.toLocaleTimeString('es-CO', { hour12: false })
    let   date = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    date = date.charAt(0).toUpperCase() + date.slice(1)
    setClock({ time, date })
  }

  // ── Load data from Supabase ─────────────────────────────────
  const loadData = useCallback(async () => {
    const [{ data: esperando }, { data: llamados }] = await Promise.all([
      supabase.from('turnos').select('*').eq('estado', 'esperando').order('creado_en'),
      supabase.from('turnos').select('*').eq('estado', 'llamado'),
    ])

    const qs = { A: [], R: [], B: [], V: [] }
    esperando?.forEach(t => { if (t.codigo in qs) qs[t.codigo].push(t) })
    setQueues(qs)

    const cur = { A: null, R: null, B: null, V: null }
    llamados?.forEach(t => { cur[t.codigo] = t })
    setCurrent(cur)
  }, [])

  useEffect(() => {
    loadData()
    tickClock()
    const clockT = setInterval(tickClock, 1000)
    const canal  = supabase
      .channel('admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, loadData)
      .subscribe()
    return () => { clearInterval(clockT); canal.unsubscribe() }
  }, [loadData])

  // ── Flash animation on call ────────────────────────────────
  const flash = (k) => {
    const el = callRefs.current[k]
    if (!el) return
    el.style.transition = 'none'
    el.style.transform  = 'scale(.985)'
    void el.offsetWidth
    el.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1)'
    el.style.transform  = 'scale(1)'
    setTimeout(() => {
      if (el) { el.style.transition = 'none'; el.style.transform = 'none' }
    }, 450)
  }

  // ── Actions ───────────────────────────────────────────────
  const handleAssign = async () => {
    if (!plate.trim() || !name.trim() || !selCat || loading) return
    setLoading(true)
    try {
      const cat   = CATS[selCat]
      const turno = await registrarTurno({
        placa:     plate.trim().toUpperCase(),
        nombre:    name.trim(),
        cedula:    cedula.trim(),
        codigo:    selCat,
        categoria: cat.label,
        color:     cat.color,
      })
      setLastAssigned(codigoDisplay(turno))
      setPlate(''); setName(''); setCedula(''); setSelCat('')
      await loadData()
    } catch (e) {
      alert('Error al asignar turno: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLlamar = async (codigo) => {
    try {
      await llamarSiguiente(codigo)
      flash(codigo)
      await loadData()
    } catch (e) {
      alert('No hay turnos en espera para esta categoría.')
    }
  }

  const handleCancelar = async (id) => {
    try {
      await marcarAtendido(id)
      await loadData()
    } catch (e) {
      alert('Error al cancelar: ' + e.message)
    }
  }

  const canAssign = !!(plate.trim() && name.trim() && selCat && !loading)
  const totalWaiting = ['A', 'R', 'B', 'V'].reduce((a, k) => a + queues[k].length, 0)

  return (
    <div style={{ minWidth: 1280, minHeight: '100vh', background: '#F8DE22', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0F172A', padding: '28px 32px 40px' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto' }}>

        {/* ── Header ──────────────────────────────────────── */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <img src="/logocda.png" alt="CDA La Cordialidad" style={{ height: 52, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>CDA La Cordialidad</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#7A8696', letterSpacing: '.12em', textTransform: 'uppercase' }}>Panel del operario</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{clock.time}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#8A94A3' }}>{clock.date}</span>
            </div>
            <button
              onClick={onLogout}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #E6EAF1', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '392px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── Formulario ────────────────────────────────── */}
          <section style={{ background: '#FFFFFF', border: '1px solid #E9EDF3', borderRadius: 20, padding: 26, boxShadow: '0 1px 2px rgba(16,24,40,.04)', position: 'sticky', top: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.01em' }}>Registrar cliente</div>
            <div style={{ fontSize: 13.5, color: '#7A8696', marginTop: 3, marginBottom: 22 }}>Captura los datos y asigna un turno.</div>

            <Label>Placa del vehículo</Label>
            <input
              value={plate}
              onChange={e => setPlate(e.target.value.toUpperCase())}
              placeholder="ABC-123"
              maxLength={8}
              style={{ width: '100%', padding: '13px 15px', border: '1.5px solid #E2E7EF', borderRadius: 12, fontSize: 18, fontWeight: 700, fontFamily: 'ui-monospace, monospace', letterSpacing: '.12em', textTransform: 'uppercase', color: '#0F172A', background: '#FBFCFE' }}
              onFocus={e  => { e.target.style.borderColor = '#0F172A'; e.target.style.background = '#fff' }}
              onBlur={e   => { e.target.style.borderColor = '#E2E7EF'; e.target.style.background = '#FBFCFE' }}
            />

            <Label mt>Nombre del cliente</Label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre y apellido"
              style={{ width: '100%', padding: '13px 15px', border: '1.5px solid #E2E7EF', borderRadius: 12, fontSize: 15, fontWeight: 500, color: '#0F172A', background: '#FBFCFE', fontFamily: 'inherit' }}
              onFocus={e  => { e.target.style.borderColor = '#0F172A'; e.target.style.background = '#fff' }}
              onBlur={e   => { e.target.style.borderColor = '#E2E7EF'; e.target.style.background = '#FBFCFE' }}
            />

            <div style={{ marginTop: 18, marginBottom: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#76808F' }}>Cédula </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#AEB7C4' }}>(opcional)</span>
            </div>
            <input
              value={cedula}
              onChange={e => setCedula(e.target.value)}
              placeholder="N.º de documento"
              style={{ width: '100%', padding: '13px 15px', border: '1.5px solid #E2E7EF', borderRadius: 12, fontSize: 15, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: '#0F172A', background: '#FBFCFE', fontFamily: 'inherit' }}
              onFocus={e  => { e.target.style.borderColor = '#0F172A'; e.target.style.background = '#fff' }}
              onBlur={e   => { e.target.style.borderColor = '#E2E7EF'; e.target.style.background = '#FBFCFE' }}
            />

            <Label mt>Categoría</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              {['A', 'R', 'B', 'V'].map(k => {
                const c   = CATS[k]
                const sel = selCat === k
                return (
                  <button
                    key={k}
                    onClick={() => setSelCat(k)}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px', borderRadius: 13, border: `1.5px solid ${sel ? c.color : '#E6EAF0'}`, background: sel ? c.color + '14' : '#FFFFFF', color: sel ? '#0F172A' : '#48515F', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'border-color .15s, background .15s' }}
                  >
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>{c.short}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleAssign}
              disabled={!canAssign}
              style={{ width: '100%', marginTop: 24, padding: 16, border: 'none', borderRadius: 13, background: canAssign ? '#0F172A' : '#E6EAF0', color: canAssign ? '#FFFFFF' : '#A0AAB8', fontFamily: 'inherit', fontSize: 16, fontWeight: 800, letterSpacing: '.01em', cursor: canAssign ? 'pointer' : 'not-allowed', transition: 'background .15s' }}
            >
              {loading ? 'Asignando…' : 'Asignar turno'}
            </button>

            {lastAssigned && (
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#15803D' }}>Turno <b style={{ fontWeight: 800 }}>{lastAssigned}</b> asignado a la cola.</span>
              </div>
            )}
          </section>

          {/* ── Colas ─────────────────────────────────────── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.01em' }}>Cola por categoría</span>
              <span style={{ fontSize: 13.5, color: '#7A8696', fontWeight: 600 }}>{totalWaiting} en espera en total</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, alignItems: 'start' }}>
              {['A', 'R', 'B', 'V'].map(k => {
                const c   = CATS[k]
                const q   = queues[k]
                const cur = current[k]
                const can = q.length > 0
                return (
                  <div key={k} style={{ background: '#FFFFFF', border: '1px solid #E9EDF3', borderTop: `4px solid ${c.color}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(16,24,40,.04)' }}>

                    {/* Column header */}
                    <div style={{ padding: '15px 16px 13px', display: 'flex', alignItems: 'flex-start', gap: 10, borderBottom: '1px solid #F0F2F6' }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{k}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#2A3342', lineHeight: 1.2 }}>{c.name}</span>
                    </div>

                    {/* En llamado */}
                    <div
                      ref={el => callRefs.current[k] = el}
                      style={{ margin: '14px 14px 0', padding: 14, borderRadius: 13, background: c.color + '12', border: `1px solid ${c.color}30` }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 18 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7A8696', whiteSpace: 'nowrap' }}>En llamado</span>
                        {cur && (
                          <button
                            onClick={() => handleCancelar(cur.id)}
                            title="Cancelar — no se presentó"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', border: '1px solid #E2E7EF', borderRadius: 8, background: '#FFFFFF', color: '#8A94A3', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            onMouseOver={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FECACA' }}
                            onMouseOut={e  => { e.currentTarget.style.color = '#8A94A3'; e.currentTarget.style.borderColor = '#E2E7EF' }}
                          >
                            ✕ Cancelar
                          </button>
                        )}
                      </div>
                      {cur ? (
                        <>
                          <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, marginTop: 6, color: c.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{codigoDisplay(cur)}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#2A3342', marginTop: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.nombre_cliente}</div>
                          <div style={{ fontSize: 12.5, color: '#8A94A3', fontFamily: 'ui-monospace, monospace', letterSpacing: '.04em', marginTop: 1 }}>{cur.placa_vehiculo}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, marginTop: 8, color: '#C2C9D4' }}>—</div>
                          <div style={{ fontSize: 12.5, color: '#A6AEBB', marginTop: 9 }}>Sin turno activo</div>
                        </>
                      )}
                    </div>

                    {/* Botón llamar */}
                    <div style={{ padding: 14 }}>
                      <button
                        onClick={() => handleLlamar(k)}
                        disabled={!can}
                        style={{ width: '100%', padding: 12, border: 'none', borderRadius: 11, background: can ? c.color : '#EDF0F4', color: can ? '#FFFFFF' : '#A6AEBB', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, cursor: can ? 'pointer' : 'not-allowed', transition: 'filter .15s' }}
                        onMouseOver={e => { if (can) e.currentTarget.style.filter = 'brightness(1.08)' }}
                        onMouseOut={e  => { e.currentTarget.style.filter = 'none' }}
                      >
                        Llamar siguiente
                      </button>
                    </div>

                    {/* Contador en espera */}
                    <div style={{ padding: '0 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#76808F' }}>En espera</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#2A3342', background: '#F1F3F7', borderRadius: 999, padding: '2px 10px', minWidth: 26, textAlign: 'center' }}>{q.length}</span>
                    </div>

                    {/* Lista de espera */}
                    <div style={{ padding: '4px 12px 14px', maxHeight: 268, overflowY: 'auto' }}>
                      {q.length === 0
                        ? <div style={{ padding: '14px 8px', fontSize: 12.5, color: '#AEB7C4', textAlign: 'center' }}>Sin turnos en espera</div>
                        : q.map(t => (
                          <div
                            key={t.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10 }}
                            onMouseOver={e => e.currentTarget.style.background = '#F6F8FB'}
                            onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ fontSize: 13, fontWeight: 800, color: c.color, fontVariantNumeric: 'tabular-nums', minWidth: 46 }}>{codigoDisplay(t)}</span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#2A3342', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre_cliente}</div>
                              <div style={{ fontSize: 11.5, color: '#9AA4B1', fontFamily: 'ui-monospace, monospace' }}>{t.placa_vehiculo}</div>
                            </div>
                            <button
                              onClick={() => handleCancelar(t.id)}
                              title={`Cancelar turno de ${t.nombre_cliente}`}
                              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: '#C2C9D4', cursor: 'pointer', fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                              onMouseOver={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444' }}
                              onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C2C9D4' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      }
                    </div>

                  </div>
                )
              })}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

function Label({ children, mt }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#76808F', marginBottom: 7, marginTop: mt ? 18 : 0 }}>
      {children}
    </div>
  )
}
