import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, registrarTurno, llamarSiguiente, marcarAtendido } from './supabase'
import { CATS, codigoDisplay } from './constants'

// Paleta — sin azul, amarillo intenso
const BG     = '#FEF08A'   // fondo amarillo medio
const HEADER = '#F8DE22'   // barra superior
const BORDER = '#FDE68A'   // bordes amarillo suave
const CARD   = '#FFFFFF'

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
    <div style={{ minWidth: 1280, minHeight: '100vh', background: BG, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0F172A' }}>

      {/* ── Barra superior amarilla ────────────────────── */}
      <header style={{ background: HEADER, padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70, boxShadow: '0 2px 10px rgba(202,138,4,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 10, padding: '4px 8px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.10)' }}>
            <img src="/logocda.png" alt="CDA La Cordialidad" style={{ height: 42, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1200', letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>CDA La Cordialidad</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#78550A', letterSpacing: '.12em', textTransform: 'uppercase' }}>Panel del operario</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#1A1200', lineHeight: 1.1 }}>{clock.time}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#78550A' }}>{clock.date}</div>
          </div>
          <button
            onClick={onLogout}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,.18)', background: 'rgba(255,255,255,.35)', fontSize: 13, fontWeight: 700, color: '#1A1200', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.6)' }}
            onMouseOut={e  => { e.currentTarget.style.background = 'rgba(255,255,255,.35)' }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ── Contenido ──────────────────────────────────── */}
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '28px 32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '392px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── Formulario ─────────────────────────────── */}
          <section style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 26, boxShadow: '0 1px 4px rgba(0,0,0,.05)', position: 'sticky', top: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em', color: '#1E293B' }}>Registrar cliente</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 3, marginBottom: 22 }}>Captura los datos y asigna un turno.</div>

            <FieldLabel>Placa del vehículo</FieldLabel>
            <input
              value={plate} onChange={e => setPlate(e.target.value.toUpperCase())}
              placeholder="ABC-123" maxLength={8}
              style={inputStyle({ mono: true })}
              onFocus={e => focus(e)} onBlur={e => blur(e)}
            />

            <FieldLabel mt>Nombre del cliente</FieldLabel>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Nombre y apellido"
              style={inputStyle({})}
              onFocus={e => focus(e)} onBlur={e => blur(e)}
            />

            <div style={{ marginTop: 18, marginBottom: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B' }}>Cédula </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#CBD5E1' }}>(opcional)</span>
            </div>
            <input
              value={cedula} onChange={e => setCedula(e.target.value)}
              placeholder="N.º de documento"
              style={inputStyle({})}
              onFocus={e => focus(e)} onBlur={e => blur(e)}
            />

            <FieldLabel mt>Categoría</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['A', 'R', 'B', 'V'].map(k => {
                const c = CATS[k]; const sel = selCat === k
                return (
                  <button key={k} onClick={() => setSelCat(k)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 12, border: `1.5px solid ${sel ? c.color : BORDER}`, background: sel ? c.color + '14' : CARD, color: sel ? '#1E293B' : '#64748B', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .15s' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.15 }}>{c.short}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleAssign} disabled={!canAssign}
              style={{ width: '100%', marginTop: 22, padding: 15, border: 'none', borderRadius: 12, background: canAssign ? '#EAB308' : '#E8E3D5', color: canAssign ? '#1A1200' : '#A8A29E', fontFamily: 'inherit', fontSize: 15, fontWeight: 800, letterSpacing: '.01em', cursor: canAssign ? 'pointer' : 'not-allowed', transition: 'background .15s' }}
              onMouseOver={e => { if (canAssign) e.currentTarget.style.background = '#A16207' }}
              onMouseOut={e  => { if (canAssign) e.currentTarget.style.background = '#EAB308' }}
            >
              {loading ? 'Asignando…' : 'Asignar turno'}
            </button>

            {lastAssigned && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#15803D' }}>Turno <b style={{ fontWeight: 800 }}>{lastAssigned}</b> asignado a la cola.</span>
              </div>
            )}
          </section>

          {/* ── Colas ──────────────────────────────────── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em', color: '#1E293B' }}>Cola por categoría</span>
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>{totalWaiting} en espera en total</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, alignItems: 'start' }}>
              {['A', 'R', 'B', 'V'].map(k => {
                const c   = CATS[k]
                const q   = queues[k]
                const cur = current[k]
                const can = q.length > 0
                return (
                  <div key={k} style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `4px solid ${c.color}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>

                    <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ width: 28, height: 28, borderRadius: 7, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#334155', lineHeight: 1.2 }}>{c.name}</span>
                    </div>

                    {/* En llamado */}
                    <div ref={el => callRefs.current[k] = el}
                      style={{ margin: '13px 13px 0', padding: 13, borderRadius: 12, background: c.color + '10', border: `1px solid ${c.color}28` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 18 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8' }}>En llamado</span>
                        {cur && (
                          <button onClick={() => handleCancelar(cur.id)} title="Cancelar — no se presentó"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', border: `1px solid ${BORDER}`, borderRadius: 7, background: CARD, color: '#94A3B8', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                            onMouseOver={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FECACA' }}
                            onMouseOut={e  => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = BORDER }}>
                            ✕ Cancelar
                          </button>
                        )}
                      </div>
                      {cur ? (
                        <>
                          <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, marginTop: 5, color: c.color, fontVariantNumeric: 'tabular-nums' }}>{codigoDisplay(cur)}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.nombre_cliente}</div>
                          <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'ui-monospace, monospace', letterSpacing: '.04em', marginTop: 1 }}>{cur.placa_vehiculo}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, marginTop: 7, color: '#CBD5E1' }}>—</div>
                          <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 8 }}>Sin turno activo</div>
                        </>
                      )}
                    </div>

                    {/* Botón llamar */}
                    <div style={{ padding: 13 }}>
                      <button onClick={() => handleLlamar(k)} disabled={!can}
                        style={{ width: '100%', padding: 11, border: 'none', borderRadius: 10, background: can ? c.color : '#E8E3D5', color: can ? '#FFFFFF' : '#A8A29E', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: can ? 'pointer' : 'not-allowed', transition: 'filter .15s' }}
                        onMouseOver={e => { if (can) e.currentTarget.style.filter = 'brightness(1.08)' }}
                        onMouseOut={e  => { e.currentTarget.style.filter = 'none' }}>
                        Llamar siguiente
                      </button>
                    </div>

                    <div style={{ padding: '0 13px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94A3B8' }}>En espera</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#334155', background: '#F8F6F0', border: `1px solid ${BORDER}`, borderRadius: 999, padding: '2px 10px', minWidth: 26, textAlign: 'center' }}>{q.length}</span>
                    </div>

                    <div style={{ padding: '4px 11px 13px', maxHeight: 268, overflowY: 'auto' }}>
                      {q.length === 0
                        ? <div style={{ padding: '12px 8px', fontSize: 12, color: '#CBD5E1', textAlign: 'center' }}>Sin turnos en espera</div>
                        : q.map(t => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 9 }}
                            onMouseOver={e => e.currentTarget.style.background = '#FAF9F4'}
                            onMouseOut={e  => e.currentTarget.style.background = 'transparent'}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: c.color, fontVariantNumeric: 'tabular-nums', minWidth: 44 }}>{codigoDisplay(t)}</span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre_cliente}</div>
                              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'ui-monospace, monospace' }}>{t.placa_vehiculo}</div>
                            </div>
                            <button onClick={() => handleCancelar(t.id)} title={`Cancelar turno de ${t.nombre_cliente}`}
                              style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'transparent', color: '#CBD5E1', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                              onMouseOver={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444' }}
                              onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#CBD5E1' }}>
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

// ── Helpers de UI ───────────────────────────────────────────
function FieldLabel({ children, mt }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 7, marginTop: mt ? 18 : 0 }}>{children}</div>
}
function inputStyle({ mono }) {
  return { width: '100%', padding: '12px 14px', border: `1.5px solid ${BORDER}`, borderRadius: 11, fontSize: mono ? 17 : 14, fontWeight: mono ? 700 : 500, fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', letterSpacing: mono ? '.12em' : undefined, textTransform: mono ? 'uppercase' : undefined, color: '#1E293B', background: '#FAFAF7' }
}
function focus(e) { e.target.style.borderColor = '#EAB308'; e.target.style.background = '#FFFFFF' }
function blur(e)  { e.target.style.borderColor = BORDER;   e.target.style.background = '#FAFAF7' }
