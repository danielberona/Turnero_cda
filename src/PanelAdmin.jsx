import { useState, useEffect, useCallback } from 'react'
import {
  Car, Truck, GraduationCap, RefreshCcw,
  LogOut, X, Clock, Check, ChevronRight,
  Bell, Users, Timer, PhoneCall,
} from 'lucide-react'
import { supabase, registrarTurno, llamarSiguiente, marcarAtendido, marcarPendienteResultados, reLlamarTurno } from './supabase'

// ── Paleta clínica ───────────────────────────────────────────────────────────
const D = {
  bg:     '#F0F4F8',
  surf:   '#FFFFFF',
  surf2:  '#F8FAFC',
  border: '#E2E8F0',
  border2:'#CBD5E1',
  txt:    '#0F172A',
  txt2:   '#475569',
  txt3:   '#94A3B8',
  muted:  '#E2E8F0',
  shadow: 'rgba(15,23,42,.06)',
}

const CATS = {
  A: { color: '#F59E0B', name: 'Motos y Autos',    short: 'Autos y Motos',  Icon: Car,           label: 'Motos y Autos' },
  R: { color: '#EF4444', name: 'Segunda Revisión', short: 'Re-Inspección',  Icon: RefreshCcw,    label: 'Segunda Revisión' },
  B: { color: '#3B82F6', name: 'Carga Pesada',     short: 'Pesados',        Icon: Truck,         label: 'Carga Pesada' },
  V: { color: '#22C55E', name: 'Enseñanza',         short: 'Enseñanza', Icon: GraduationCap, label: 'Enseñanza' },
}

const pad  = (n) => String(n).padStart(2, '0')
const code = (t) => String(t.numero).padStart(3, '0')

export default function PanelAdmin({ onLogout }) {
  const [queues,       setQueues]       = useState({ A: [], R: [], B: [], V: [] })
  const [current,      setCurrent]      = useState({ A: null, R: null, B: null, V: null })
  const [plate,        setPlate]        = useState('')
  const [name,         setName]         = useState('')
  const [numero,       setNumero]       = useState('')
  const [selCat,       setSelCat]       = useState('')
  const [lastAssigned, setLastAssigned] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [time,         setTime]         = useState('')

  // ── Carga datos ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [{ data: esperando }, { data: pendientes }, { data: llamados }] = await Promise.all([
      supabase.from('turnos').select('*').eq('estado', 'esperando').order('creado_en'),
      supabase.from('turnos').select('*').eq('estado', 'pendiente_resultados').order('creado_en'),
      supabase.from('turnos').select('*').eq('estado', 'llamado'),
    ])
    const qs = { A: [], R: [], B: [], V: [] }
    const all = [...(esperando ?? []), ...(pendientes ?? [])].sort(
      (a, b) => new Date(a.creado_en) - new Date(b.creado_en)
    )
    all.forEach(t => { if (t.codigo in qs) qs[t.codigo].push(t) })
    setQueues(qs)
    const cur = { A: null, R: null, B: null, V: null }
    llamados?.forEach(t => { cur[t.codigo] = t })
    setCurrent(cur)
  }, [])

  useEffect(() => {
    loadData()
    const tick = () => {
      const d = new Date()
      const h = d.getHours(), m = pad(d.getMinutes())
      setTime(`${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`)
    }
    tick()
    const clockT = setInterval(tick, 1000)
    const canal  = supabase.channel('admin-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, loadData)
      .subscribe()
    return () => { clearInterval(clockT); canal.unsubscribe() }
  }, [loadData])

  const totalWaiting = Object.values(queues).reduce((a, q) => a + q.length, 0)

  const handleAssign = async () => {
    if (!plate.trim() || !name.trim() || !selCat || loading) return
    setLoading(true)
    try {
      const cat   = CATS[selCat]
      const turno = await registrarTurno({ placa: plate.trim().toUpperCase(), nombre: name.trim(), codigo: selCat, categoria: cat.label, color: cat.color, numero: numero.trim() })
      setLastAssigned(turno)
      setPlate(''); setName(''); setNumero(''); setSelCat('')
      await loadData()
      setTimeout(() => setLastAssigned(null), 4000)
    } catch (e) { alert('Error al asignar turno: ' + e.message) }
    finally { setLoading(false) }
  }

  const handleLlamar = async (k) => {
    try { await llamarSiguiente(k); await loadData() }
    catch { alert('No hay turnos en espera para esta categoría.') }
  }

  const handleFinalizar = async (id) => {
    try { await marcarAtendido(id); await loadData() }
    catch (e) { alert('Error: ' + e.message) }
  }

  const handlePendiente = async (id) => {
    try { await marcarPendienteResultados(id); await loadData() }
    catch (e) { alert('Error: ' + e.message) }
  }

  const handleReLlamar = async (id) => {
    try { await reLlamarTurno(id); await loadData() }
    catch (e) { alert('Error al re-llamar: ' + e.message) }
  }

  const handleCancelar = async (id) => {
    try { await marcarAtendido(id); await loadData() }
    catch (e) { alert('Error: ' + e.message) }
  }

  const canAssign = !!(plate.trim() && name.trim() && numero.trim() && selCat && !loading)

  return (
    <div style={{ minHeight: '100vh', background: D.bg, color: D.txt, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header style={{ background: D.surf, borderBottom: `1px solid ${D.border}`, padding: '0 32px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: `0 1px 4px ${D.shadow}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/logocda.png" alt="CDA" style={{ height: 40, width: 'auto', objectFit: 'contain', display: 'block' }} />
          <div style={{ width: 1, height: 30, background: D.border }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.01em', color: D.txt }}>CDA La Cordialidad</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: D.txt3, letterSpacing: '.12em', textTransform: 'uppercase' }}>Panel del Operario</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 999, background: D.surf2, border: `1px solid ${D.border}` }}>
            <Users size={13} color={D.txt3} />
            <span style={{ fontSize: 13, fontWeight: 800, color: D.txt, fontVariantNumeric: 'tabular-nums' }}>{totalWaiting}</span>
            <span style={{ fontSize: 12, color: D.txt3 }}>en espera</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 999, background: D.surf2, border: `1px solid ${D.border}` }}>
            <Clock size={13} color={D.txt3} />
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontVariantNumeric: 'tabular-nums', letterSpacing: '.06em', color: D.txt }}>{time}</span>
          </div>
          <button
            onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: `1px solid ${D.border}`, borderRadius: 9, background: D.surf, color: D.txt2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseOver={e => { e.currentTarget.style.background = D.surf2; e.currentTarget.style.borderColor = D.border2 }}
            onMouseOut={e  => { e.currentTarget.style.background = D.surf;  e.currentTarget.style.borderColor = D.border }}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ── Layout ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1560, margin: '0 auto', padding: '28px 32px 52px', display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Formulario ──────────────────────────────────────────────── */}
        <aside style={{ background: D.surf, border: `1px solid ${D.border}`, borderRadius: 18, overflow: 'hidden', position: 'sticky', top: 90, boxShadow: `0 2px 12px ${D.shadow}` }}>
          <div style={{ padding: '22px 24px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em', color: D.txt }}>Registrar cliente</div>
            <div style={{ fontSize: 13, color: D.txt3, marginTop: 3, marginBottom: 22 }}>Ingresa los datos y asigna un turno.</div>
          </div>

          <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 15 }}>

            <Field label="Placa del vehículo">
              <input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="ABC-123" maxLength={8}
                style={iStyle({ mono: true })}
                onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.10)' }}
                onBlur={e  => { e.target.style.borderColor = D.border; e.target.style.boxShadow = 'none' }} />
            </Field>

            <Field label="Nombre del cliente">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre y apellido"
                style={iStyle({})}
                onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.10)' }}
                onBlur={e  => { e.target.style.borderColor = D.border; e.target.style.boxShadow = 'none' }} />
            </Field>

            <Field label="Número de turno">
              <input value={numero} onChange={e => setNumero(e.target.value.replace(/\D/g, ''))} placeholder="001"
                style={iStyle({ mono: true })}
                onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.10)' }}
                onBlur={e  => { e.target.style.borderColor = D.border; e.target.style.boxShadow = 'none' }} />
            </Field>

            <div>
              <Label>Categoría de revisión</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {Object.entries(CATS).map(([k, c]) => {
                  const sel = selCat === k
                  const { Icon } = c
                  return (
                    <button key={k} onClick={() => setSelCat(k)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .18s', background: sel ? c.color + '0E' : D.surf2, border: `1.5px solid ${sel ? c.color : D.border}`, color: sel ? D.txt : D.txt2, transform: sel ? 'scale(1.02)' : 'scale(1)' }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: sel ? c.color : c.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .18s' }}>
                        <Icon size={15} color={sel ? '#fff' : c.color} />
                      </span>
                      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{c.short}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleAssign} disabled={!canAssign}
              style={{ width: '100%', marginTop: 4, padding: '13px', border: 'none', borderRadius: 11, fontFamily: 'inherit', fontSize: 14, fontWeight: 800, letterSpacing: '.01em', cursor: canAssign ? 'pointer' : 'not-allowed', transition: 'all .18s', background: canAssign ? '#F59E0B' : D.muted, color: canAssign ? '#1A1000' : D.txt3, boxShadow: canAssign ? '0 2px 10px rgba(245,158,11,.28)' : 'none' }}
              onMouseOver={e => { if (canAssign) { e.currentTarget.style.background = '#D97706'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,.38)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseOut={e  => { e.currentTarget.style.background = canAssign ? '#F59E0B' : D.muted; e.currentTarget.style.boxShadow = canAssign ? '0 2px 10px rgba(245,158,11,.28)' : 'none'; e.currentTarget.style.transform = 'none' }}
              onMouseDown={e => { if (canAssign) e.currentTarget.style.transform = 'scale(.98)' }}
              onMouseUp={e   => { if (canAssign) e.currentTarget.style.transform = 'translateY(-1px)' }}
            >
              {loading ? 'Asignando…' : 'Asignar turno'}
            </button>

            {lastAssigned && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 11, background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.20)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(34,197,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={13} color="#22C55E" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>Turno asignado</div>
                  <div style={{ fontSize: 12, color: D.txt2, marginTop: 1 }}><b style={{ color: CATS[lastAssigned.codigo].color }}>{code(lastAssigned)}</b> — {lastAssigned.nombre_cliente}</div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Colas ───────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em', color: D.txt }}>Cola por categoría</div>
              <div style={{ fontSize: 13, color: D.txt3, marginTop: 2 }}>Estado de atención en tiempo real</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(CATS).map(([k, c]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: D.surf, border: `1px solid ${D.border}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: D.txt2 }}>{c.short}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: D.txt, fontVariantNumeric: 'tabular-nums' }}>{queues[k].length}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {Object.entries(CATS).map(([k, c]) => {
              const { Icon } = c
              const q = queues[k], cur = current[k]
              const can = q.some(t => t.estado === 'esperando')
              return (
                <div key={k} style={{ background: D.surf, border: `1px solid ${D.border}`, borderTop: `3px solid ${c.color}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: `0 2px 8px ${D.shadow}` }}>

                  <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: c.color + '12', border: `1px solid ${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={c.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: D.txt }}>{c.short}</div>
                      <div style={{ fontSize: 11, color: D.txt3, marginTop: 1 }}>{c.name}</div>
                    </div>
                  </div>

                  {/* En llamado */}
                  <div style={{ margin: '12px 12px 0', padding: '13px', borderRadius: 12, background: cur ? c.color + '06' : D.surf2, border: `1px solid ${cur ? c.color + '25' : D.border}`, minHeight: 100, transition: 'all .3s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: cur ? c.color : D.txt3, marginBottom: 8 }}>
                      <Bell size={10} />
                      En llamado
                    </div>
                    {cur ? (
                      <>
                        <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, color: c.color, fontVariantNumeric: 'tabular-nums' }}>{code(cur)}</div>
                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: D.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.nombre_cliente}</div>
                        <div style={{ fontSize: 11, color: D.txt2, fontFamily: 'ui-monospace, monospace', letterSpacing: '.05em', marginTop: 2 }}>{cur.placa_vehiculo}</div>
                        {/* Botones de decisión */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                          <button
                            onClick={() => handleFinalizar(cur.id)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 4px', border: '1px solid #BBF7D0', borderRadius: 8, background: '#F0FDF4', color: '#16A34A', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
                            onMouseOver={e => { e.currentTarget.style.background = '#DCFCE7'; e.currentTarget.style.borderColor = '#86EFAC' }}
                            onMouseOut={e  => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.borderColor = '#BBF7D0' }}>
                            <Check size={11} /> Finalizado
                          </button>
                          <button
                            onClick={() => handlePendiente(cur.id)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 4px', border: '1px solid #FDE68A', borderRadius: 8, background: '#FFFBEB', color: '#D97706', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', lineHeight: 1.2, textAlign: 'center' }}
                            onMouseOver={e => { e.currentTarget.style.background = '#FEF3C7'; e.currentTarget.style.borderColor = '#FCD34D' }}
                            onMouseOut={e  => { e.currentTarget.style.background = '#FFFBEB'; e.currentTarget.style.borderColor = '#FDE68A' }}>
                            <Timer size={11} /> No estaba
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: D.muted, lineHeight: 1, marginBottom: 4 }}>—</div>
                        <div style={{ fontSize: 11, color: D.txt3 }}>Sin turno activo</div>
                      </div>
                    )}
                  </div>

                  {/* Botón llamar */}
                  <div style={{ padding: 12 }}>
                    <button onClick={() => handleLlamar(k)} disabled={!can}
                      style={{ width: '100%', padding: '11px', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: can ? 'pointer' : 'not-allowed', transition: 'all .18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: can ? c.color : D.surf2, color: can ? '#fff' : D.txt3, boxShadow: can ? `0 2px 10px ${c.color}40` : 'none' }}
                      onMouseOver={e => { if (can) { e.currentTarget.style.boxShadow = `0 4px 16px ${c.color}55`; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                      onMouseOut={e  => { e.currentTarget.style.boxShadow = can ? `0 2px 10px ${c.color}40` : 'none'; e.currentTarget.style.transform = 'none' }}
                      onMouseDown={e => { if (can) e.currentTarget.style.transform = 'scale(.98)' }}
                      onMouseUp={e   => { if (can) e.currentTarget.style.transform = 'translateY(-1px)' }}>
                      <ChevronRight size={15} />
                      Llamar siguiente
                    </button>
                  </div>

                  <div style={{ padding: '0 12px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: D.txt3 }}>En espera</span>
                    <span style={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: can ? c.color : D.txt3, background: can ? c.color + '10' : D.surf2, border: `1px solid ${can ? c.color + '25' : D.border}`, borderRadius: 999, padding: '2px 9px', textAlign: 'center', transition: 'all .2s' }}>{q.length}</span>
                  </div>

                  <div style={{ padding: '2px 10px 12px', maxHeight: 248, overflowY: 'auto' }}>
                    {q.length === 0 ? (
                      <div style={{ padding: '14px 8px', fontSize: 12, color: D.txt3, textAlign: 'center' }}>Sin turnos en espera</div>
                    ) : q.map(t => {
                      const isPendiente = t.estado === 'pendiente_resultados'
                      return (
                        <div key={t.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 9, transition: 'background .12s', background: isPendiente ? '#FFFBEB' : 'transparent' }}
                          onMouseOver={e => e.currentTarget.style.background = isPendiente ? '#FEF3C7' : D.surf2}
                          onMouseOut={e  => e.currentTarget.style.background = isPendiente ? '#FFFBEB' : 'transparent'}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: c.color, fontVariantNumeric: 'tabular-nums', minWidth: 44, flexShrink: 0 }}>{code(t)}</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: D.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre_cliente}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                              <div style={{ fontSize: 11, color: D.txt3, fontFamily: 'ui-monospace, monospace' }}>{t.placa_vehiculo}</div>
                              {isPendiente && (
                                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#D97706', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>
                          {isPendiente && (
                            <button onClick={() => handleReLlamar(t.id)}
                              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: '#D97706', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}
                              title="Re-llamar este turno"
                              onMouseOver={e => { e.currentTarget.style.background = '#FEF3C7'; e.currentTarget.style.color = '#B45309' }}
                              onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D97706' }}>
                              <PhoneCall size={11} />
                            </button>
                          )}
                          <button onClick={() => handleCancelar(t.id)}
                            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: D.txt3, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}
                            onMouseOver={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444' }}
                            onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = D.txt3 }}>
                            <X size={11} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                </div>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 7 }}>{children}</div>
}
function Field({ label, children }) {
  return <div><Label>{label}</Label>{children}</div>
}
function iStyle({ mono } = {}) {
  return {
    width: '100%', padding: '11px 13px',
    border: '1px solid #E2E8F0', borderRadius: 10,
    background: '#F8FAFC', color: '#0F172A',
    fontSize: mono ? 16 : 14, fontWeight: mono ? 700 : 500,
    fontFamily: mono ? 'ui-monospace, monospace' : "'Plus Jakarta Sans', system-ui, sans-serif",
    letterSpacing: mono ? '.12em' : undefined,
    textTransform: mono ? 'uppercase' : undefined,
    transition: 'border-color .15s, box-shadow .15s',
  }
}
