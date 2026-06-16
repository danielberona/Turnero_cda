import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, registrarTurno, llamarSiguiente, marcarAtendido } from './supabase'
import { CATS, codigoDisplay } from './constants'

// ── Paleta sin azul ─────────────────────────────────────────────────────────
const P = {
  bg:     '#FEFCE8',           // amarillo-50 muy suave
  header: '#F8DE22',           // amarillo de marca
  card:   '#FFFFFF',
  border: '#FDE68A',           // amarillo-200
  shadow: 'rgba(161,98,7,.07)',
  txt:    '#1C1000',           // casi-negro cálido
  txt2:   '#78550A',           // ámbar oscuro
  txt3:   '#A37A00',           // dorado medio
  muted:  '#C4A017',           // texto tenue cálido
  muted2: '#E8D97A',           // deshabilitado cálido
}

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

  const callRefs = useRef({ A: null, B: null, R: null, V: null })

  const tickClock = () => {
    const now  = new Date()
    const time = now.toLocaleTimeString('es-CO', { hour12: false })
    let   date = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    setClock({ time, date: date.charAt(0).toUpperCase() + date.slice(1) })
  }

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
    loadData(); tickClock()
    const clockT = setInterval(tickClock, 1000)
    const canal  = supabase.channel('admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, loadData)
      .subscribe()
    return () => { clearInterval(clockT); canal.unsubscribe() }
  }, [loadData])

  const flash = (k) => {
    const el = callRefs.current[k]
    if (!el) return
    el.style.transition = 'none'; el.style.transform = 'scale(.985)'
    void el.offsetWidth
    el.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1)'; el.style.transform = 'scale(1)'
    setTimeout(() => { if (el) { el.style.transition = 'none'; el.style.transform = 'none' } }, 450)
  }

  const handleAssign = async () => {
    if (!plate.trim() || !name.trim() || !selCat || loading) return
    setLoading(true)
    try {
      const cat   = CATS[selCat]
      const turno = await registrarTurno({ placa: plate.trim().toUpperCase(), nombre: name.trim(), cedula: cedula.trim(), codigo: selCat, categoria: cat.label, color: cat.color })
      setLastAssigned(codigoDisplay(turno))
      setPlate(''); setName(''); setCedula(''); setSelCat('')
      await loadData()
    } catch (e) { alert('Error al asignar turno: ' + e.message) }
    finally { setLoading(false) }
  }

  const handleLlamar = async (codigo) => {
    try { await llamarSiguiente(codigo); flash(codigo); await loadData() }
    catch { alert('No hay turnos en espera para esta categoría.') }
  }

  const handleCancelar = async (id) => {
    try { await marcarAtendido(id); await loadData() }
    catch (e) { alert('Error al cancelar: ' + e.message) }
  }

  const canAssign    = !!(plate.trim() && name.trim() && selCat && !loading)
  const totalWaiting = ['A', 'R', 'B', 'V'].reduce((a, k) => a + queues[k].length, 0)

  return (
    <div style={{ minWidth: 1280, minHeight: '100vh', background: P.bg, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: P.txt }}>

      {/* ── Barra de marca ───────────────────────────────── */}
      <header style={{ background: P.header, padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70, boxShadow: `0 2px 12px rgba(202,138,4,.22)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: P.card, borderRadius: 10, padding: '4px 8px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.10)' }}>
            <img src="/logocda.png" alt="CDA La Cordialidad" style={{ height: 42, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: P.txt, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>CDA La Cordialidad</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: P.txt2, letterSpacing: '.12em', textTransform: 'uppercase' }}>Panel del operario</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: P.txt, lineHeight: 1.1 }}>{clock.time}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: P.txt2 }}>{clock.date}</div>
          </div>
          <button
            onClick={onLogout}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,.16)', background: 'rgba(255,255,255,.30)', fontSize: 13, fontWeight: 700, color: P.txt, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.58)' }}
            onMouseOut={e  => { e.currentTarget.style.background = 'rgba(255,255,255,.30)' }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ── Contenido ───────────────────────────────────── */}
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '28px 32px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── Formulario ────────────────────────────────── */}
          <section style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 26, boxShadow: `0 2px 10px ${P.shadow}, 0 8px 28px ${P.shadow}`, position: 'sticky', top: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em', color: P.txt }}>Registrar cliente</div>
            <div style={{ fontSize: 13, color: P.txt3, marginTop: 3, marginBottom: 22 }}>Captura los datos y asigna un turno.</div>

            <FieldLabel>Placa del vehículo</FieldLabel>
            <input
              value={plate} onChange={e => setPlate(e.target.value.toUpperCase())}
              placeholder="ABC-123" maxLength={8}
              style={inputStyle({ mono: true })}
              onFocus={e => focus(e, P.border)} onBlur={e => blur(e, P.border)}
            />

            <FieldLabel mt>Nombre del cliente</FieldLabel>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Nombre y apellido"
              style={inputStyle({})}
              onFocus={e => focus(e, P.border)} onBlur={e => blur(e, P.border)}
            />

            <div style={{ marginTop: 18, marginBottom: 7, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: P.txt2 }}>Cédula</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: P.muted }}>opcional</span>
            </div>
            <input
              value={cedula} onChange={e => setCedula(e.target.value)}
              placeholder="N.º de documento"
              style={inputStyle({})}
              onFocus={e => focus(e, P.border)} onBlur={e => blur(e, P.border)}
            />

            <FieldLabel mt>Categoría</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['A', 'R', 'B', 'V'].map(k => {
                const c = CATS[k]; const sel = selCat === k
                return (
                  <button key={k} onClick={() => setSelCat(k)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 12, border: `1.5px solid ${sel ? c.color : P.border}`, background: sel ? c.color + '16' : P.card, color: sel ? P.txt : P.txt2, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .15s' }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.15 }}>{c.short}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleAssign} disabled={!canAssign}
              style={{ width: '100%', marginTop: 22, padding: 15, border: 'none', borderRadius: 12, background: canAssign ? '#EAB308' : P.muted2, color: canAssign ? P.txt : P.muted, fontFamily: 'inherit', fontSize: 15, fontWeight: 800, letterSpacing: '.01em', cursor: canAssign ? 'pointer' : 'not-allowed', transition: 'background .15s' }}
              onMouseOver={e => { if (canAssign) e.currentTarget.style.background = '#CA8A04' }}
              onMouseOut={e  => { if (canAssign) e.currentTarget.style.background = '#EAB308' }}
            >
              {loading ? 'Asignando…' : 'Asignar turno'}
            </button>

            {lastAssigned && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#15803D' }}>Turno <b style={{ fontWeight: 800 }}>{lastAssigned}</b> asignado.</span>
              </div>
            )}
          </section>

          {/* ── Colas ─────────────────────────────────────── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em', color: P.txt }}>Cola por categoría</span>
              <span style={{ fontSize: 13, color: P.txt3, fontWeight: 600 }}>{totalWaiting} en espera</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, alignItems: 'start' }}>
              {['A', 'R', 'B', 'V'].map(k => {
                const c   = CATS[k]
                const q   = queues[k]
                const cur = current[k]
                const can = q.length > 0
                return (
                  <div key={k} style={{ background: P.card, border: `1px solid ${P.border}`, borderTop: `4px solid ${c.color}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: `0 2px 8px ${P.shadow}` }}>

                    <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${P.border}` }}>
                      <span style={{ width: 28, height: 28, borderRadius: 7, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: P.txt, lineHeight: 1.2 }}>{c.name}</span>
                    </div>

                    {/* En llamado */}
                    <div ref={el => callRefs.current[k] = el}
                      style={{ margin: '12px 12px 0', padding: 12, borderRadius: 12, background: c.color + '0E', border: `1px solid ${c.color}28` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 18 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: P.txt3 }}>En llamado</span>
                        {cur && (
                          <button onClick={() => handleCancelar(cur.id)} title="Cancelar — no se presentó"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', border: `1px solid ${P.border}`, borderRadius: 7, background: P.card, color: P.muted, fontFamily: 'inherit', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all .12s' }}
                            onMouseOver={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FECACA' }}
                            onMouseOut={e  => { e.currentTarget.style.color = P.muted;   e.currentTarget.style.borderColor = P.border }}>
                            ✕ Cancelar
                          </button>
                        )}
                      </div>
                      {cur ? (
                        <>
                          <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, marginTop: 5, color: c.color, fontVariantNumeric: 'tabular-nums' }}>{codigoDisplay(cur)}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: P.txt, marginTop: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.nombre_cliente}</div>
                          <div style={{ fontSize: 12, color: P.txt2, fontFamily: 'ui-monospace, monospace', letterSpacing: '.04em', marginTop: 1 }}>{cur.placa_vehiculo}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, marginTop: 7, color: P.muted2 }}>—</div>
                          <div style={{ fontSize: 12, color: P.muted, marginTop: 7 }}>Sin turno activo</div>
                        </>
                      )}
                    </div>

                    {/* Botón llamar */}
                    <div style={{ padding: 12 }}>
                      <button onClick={() => handleLlamar(k)} disabled={!can}
                        style={{ width: '100%', padding: 11, border: 'none', borderRadius: 10, background: can ? c.color : P.muted2, color: can ? '#FFFFFF' : P.muted, fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: can ? 'pointer' : 'not-allowed', transition: 'filter .15s' }}
                        onMouseOver={e => { if (can) e.currentTarget.style.filter = 'brightness(1.09)' }}
                        onMouseOut={e  => { e.currentTarget.style.filter = 'none' }}>
                        Llamar siguiente
                      </button>
                    </div>

                    <div style={{ padding: '0 12px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: P.txt3 }}>En espera</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: P.txt, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 999, padding: '2px 10px', minWidth: 26, textAlign: 'center' }}>{q.length}</span>
                    </div>

                    <div style={{ padding: '3px 10px 12px', maxHeight: 268, overflowY: 'auto' }}>
                      {q.length === 0
                        ? <div style={{ padding: '11px 8px', fontSize: 12, color: P.muted, textAlign: 'center' }}>Sin turnos en espera</div>
                        : q.map(t => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 9, transition: 'background .1s' }}
                            onMouseOver={e => e.currentTarget.style.background = P.bg}
                            onMouseOut={e  => e.currentTarget.style.background = 'transparent'}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: c.color, fontVariantNumeric: 'tabular-nums', minWidth: 42 }}>{codigoDisplay(t)}</span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: P.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre_cliente}</div>
                              <div style={{ fontSize: 11, color: P.txt2, fontFamily: 'ui-monospace, monospace' }}>{t.placa_vehiculo}</div>
                            </div>
                            <button onClick={() => handleCancelar(t.id)} title={`Cancelar turno de ${t.nombre_cliente}`}
                              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: P.muted, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}
                              onMouseOver={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444' }}
                              onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = P.muted }}>
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

// ── Helpers de UI ───────────────────────────────────────────────────────────
function FieldLabel({ children, mt }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#78550A', marginBottom: 7, marginTop: mt ? 18 : 0 }}>
      {children}
    </div>
  )
}
function inputStyle({ mono }) {
  return {
    width: '100%', padding: '12px 14px',
    border: `1.5px solid #FDE68A`, borderRadius: 11,
    fontSize: mono ? 17 : 14, fontWeight: mono ? 700 : 500,
    fontFamily: mono ? 'ui-monospace, monospace' : "'Plus Jakarta Sans', system-ui, sans-serif",
    letterSpacing: mono ? '.12em' : undefined,
    textTransform: mono ? 'uppercase' : undefined,
    color: '#1C1000', background: '#FEFCE8',
  }
}
function focus(e) { e.target.style.borderColor = '#EAB308'; e.target.style.background = '#FFFFFF' }
function blur(e)  { e.target.style.borderColor = '#FDE68A'; e.target.style.background = '#FEFCE8' }
