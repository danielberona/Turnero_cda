import { useState, useEffect } from 'react'
import {
  Car, Truck, GraduationCap, RefreshCcw,
  LogOut, X, Clock, Check, ChevronRight,
  Bell, Users,
} from 'lucide-react'

// ── Paleta clínica — blanco limpio ──────────────────────────────────────────
const D = {
  bg:     '#F0F4F8',   // fondo gris-azulado muy suave
  surf:   '#FFFFFF',   // blanco puro
  surf2:  '#F8FAFC',   // gris clarísimo para áreas internas
  border: '#E2E8F0',   // borde gris claro
  border2:'#CBD5E1',   // borde ligeramente más oscuro
  txt:    '#0F172A',   // casi negro — máximo contraste
  txt2:   '#475569',   // gris medio
  txt3:   '#94A3B8',   // gris claro
  muted:  '#E2E8F0',   // tono apagado
  shadow: 'rgba(15,23,42,.06)',
}

// ── Categorías ───────────────────────────────────────────────────────────────
const CATS = {
  A: { color: '#F59E0B', name: 'Motos y Autos',   short: 'Autos',     Icon: Car,           label: 'Motos y Autos' },
  R: { color: '#EF4444', name: 'Segunda Revisión', short: 'Revisión',  Icon: RefreshCcw,    label: 'Segunda Revisión' },
  B: { color: '#3B82F6', name: 'Carga Pesada',     short: 'Carga',     Icon: Truck,         label: 'Carga Pesada' },
  V: { color: '#22C55E', name: 'Enseñanza',         short: 'Enseñanza', Icon: GraduationCap, label: 'Enseñanza' },
}

const pad  = (n) => String(n).padStart(2, '0')
const code = (t) => `${t.codigo}-${pad(t.numero)}`

// ── Mock data ────────────────────────────────────────────────────────────────
let _nextId   = 100
let _counters = { A: 8, R: 3, B: 2, V: 1 }

const INIT_QUEUES = {
  A: [
    { id: '2', codigo: 'A', numero: 2, nombre_cliente: 'María García',   placa_vehiculo: 'XYZ-789' },
    { id: '3', codigo: 'A', numero: 3, nombre_cliente: 'Juan López',     placa_vehiculo: 'DEF-456' },
    { id: '4', codigo: 'A', numero: 4, nombre_cliente: 'Laura Jiménez',  placa_vehiculo: 'GHI-321' },
    { id: '5', codigo: 'A', numero: 5, nombre_cliente: 'Sofía Herrera',  placa_vehiculo: 'MNO-555' },
  ],
  R: [
    { id: '6', codigo: 'R', numero: 1, nombre_cliente: 'Ana Rodríguez',  placa_vehiculo: 'JKL-654' },
    { id: '7', codigo: 'R', numero: 2, nombre_cliente: 'Pablo Gómez',    placa_vehiculo: 'PQR-777' },
  ],
  B: [
    { id: '8', codigo: 'B', numero: 1, nombre_cliente: 'Pedro Sánchez',  placa_vehiculo: 'STU-100' },
  ],
  V: [],
}

const INIT_CURRENT = {
  A: { id: '1', codigo: 'A', numero: 1, nombre_cliente: 'Carlos Martínez', placa_vehiculo: 'ABC-123' },
  R: null,
  B: null,
  V: null,
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function PanelAdmin({ onLogout }) {
  const [queues,       setQueues]       = useState(INIT_QUEUES)
  const [current,      setCurrent]      = useState(INIT_CURRENT)
  const [plate,        setPlate]        = useState('')
  const [name,         setName]         = useState('')
  const [cedula,       setCedula]       = useState('')
  const [selCat,       setSelCat]       = useState('')
  const [lastAssigned, setLastAssigned] = useState(null)
  const [time,         setTime]         = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('es-CO', { hour12: false }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const totalWaiting = Object.values(queues).reduce((a, q) => a + q.length, 0)

  const handleLlamar = (k) => {
    const q = queues[k]; if (!q.length) return
    setCurrent(c => ({ ...c, [k]: q[0] }))
    setQueues(q2 => ({ ...q2, [k]: q2[k].slice(1) }))
  }
  const handleCancelar          = (k)      => setCurrent(c => ({ ...c, [k]: null }))
  const handleRemoveFromQueue   = (k, id)  => setQueues(q => ({ ...q, [k]: q[k].filter(t => t.id !== id) }))

  const handleAssign = () => {
    if (!plate.trim() || !name.trim() || !selCat) return
    _counters[selCat] = (_counters[selCat] || 0) + 1
    const t = { id: String(++_nextId), codigo: selCat, numero: _counters[selCat], nombre_cliente: name.trim(), placa_vehiculo: plate.trim().toUpperCase() }
    setQueues(q => ({ ...q, [selCat]: [...q[selCat], t] }))
    setLastAssigned(t)
    setPlate(''); setName(''); setCedula(''); setSelCat('')
    setTimeout(() => setLastAssigned(null), 4000)
  }

  const canAssign = !!(plate.trim() && name.trim() && selCat)

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

      {/* ── Layout principal ─────────────────────────────────────────── */}
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

            <div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 7 }}>
                <Label>Cédula</Label>
                <span style={{ fontSize: 11, color: D.txt3 }}>opcional</span>
              </div>
              <input value={cedula} onChange={e => setCedula(e.target.value)} placeholder="N.º de documento"
                style={iStyle({})}
                onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.10)' }}
                onBlur={e  => { e.target.style.borderColor = D.border; e.target.style.boxShadow = 'none' }} />
            </div>

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
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{c.short}</div>
                        <div style={{ fontSize: 10, color: D.txt3, marginTop: 1 }}>Cod. {k}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleAssign} disabled={!canAssign}
              style={{ width: '100%', marginTop: 4, padding: '13px', border: 'none', borderRadius: 11, fontFamily: 'inherit', fontSize: 14, fontWeight: 800, letterSpacing: '.01em', cursor: canAssign ? 'pointer' : 'not-allowed', transition: 'all .18s', background: canAssign ? '#F59E0B' : D.muted, color: canAssign ? '#1A1000' : D.txt3, boxShadow: canAssign ? '0 2px 10px rgba(245,158,11,.30)' : 'none' }}
              onMouseOver={e => { if (canAssign) { e.currentTarget.style.background = '#D97706'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,.40)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseOut={e  => { e.currentTarget.style.background = canAssign ? '#F59E0B' : D.muted; e.currentTarget.style.boxShadow = canAssign ? '0 2px 10px rgba(245,158,11,.30)' : 'none'; e.currentTarget.style.transform = 'none' }}
              onMouseDown={e => { if (canAssign) { e.currentTarget.style.transform = 'scale(.98)' } }}
              onMouseUp={e   => { if (canAssign) { e.currentTarget.style.transform = 'translateY(-1px)' } }}
            >
              Asignar turno
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
                  <span style={{ fontSize: 11, fontWeight: 700, color: D.txt2 }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: D.txt, fontVariantNumeric: 'tabular-nums' }}>{queues[k].length}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {Object.entries(CATS).map(([k, c]) => {
              const { Icon } = c
              const q = queues[k], cur = current[k], can = q.length > 0
              return (
                <div key={k} style={{ background: D.surf, border: `1px solid ${D.border}`, borderTop: `3px solid ${c.color}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: `0 2px 8px ${D.shadow}` }}>

                  {/* Encabezado columna */}
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: cur ? c.color : D.txt3 }}>
                        <Bell size={10} />
                        En llamado
                      </div>
                      {cur && (
                        <button onClick={() => handleCancelar(k)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', border: `1px solid ${D.border}`, borderRadius: 6, background: 'transparent', color: D.txt3, fontFamily: 'inherit', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#FCA5A5'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2' }}
                          onMouseOut={e  => { e.currentTarget.style.borderColor = D.border;  e.currentTarget.style.color = D.txt3;    e.currentTarget.style.background = 'transparent' }}>
                          <X size={9} /> Cancelar
                        </button>
                      )}
                    </div>
                    {cur ? (
                      <>
                        <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, color: c.color, fontVariantNumeric: 'tabular-nums' }}>{code(cur)}</div>
                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: D.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.nombre_cliente}</div>
                        <div style={{ fontSize: 11, color: D.txt2, fontFamily: 'ui-monospace, monospace', letterSpacing: '.05em', marginTop: 2 }}>{cur.placa_vehiculo}</div>
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
                      onMouseDown={e => { if (can) e.currentTarget.style.transform = 'translateY(0) scale(.98)' }}
                      onMouseUp={e   => { if (can) e.currentTarget.style.transform = 'translateY(-1px)' }}>
                      <ChevronRight size={15} />
                      Llamar siguiente
                    </button>
                  </div>

                  {/* Conteo en espera */}
                  <div style={{ padding: '0 12px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: D.txt3 }}>En espera</span>
                    <span style={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: can ? c.color : D.txt3, background: can ? c.color + '10' : D.surf2, border: `1px solid ${can ? c.color + '25' : D.border}`, borderRadius: 999, padding: '2px 9px', textAlign: 'center', transition: 'all .2s' }}>{q.length}</span>
                  </div>

                  <div style={{ padding: '2px 10px 12px', maxHeight: 248, overflowY: 'auto' }}>
                    {q.length === 0 ? (
                      <div style={{ padding: '14px 8px', fontSize: 12, color: D.txt3, textAlign: 'center' }}>Sin turnos en espera</div>
                    ) : q.map(t => (
                      <div key={t.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 9, transition: 'background .12s', cursor: 'default' }}
                        onMouseOver={e => e.currentTarget.style.background = D.surf2}
                        onMouseOut={e  => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: c.color, fontVariantNumeric: 'tabular-nums', minWidth: 44, flexShrink: 0 }}>{code(t)}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: D.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre_cliente}</div>
                          <div style={{ fontSize: 11, color: D.txt3, fontFamily: 'ui-monospace, monospace' }}>{t.placa_vehiculo}</div>
                        </div>
                        <button onClick={() => handleRemoveFromQueue(k, t.id)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: D.txt3, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}
                          onMouseOver={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444' }}
                          onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = D.txt3 }}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
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
    border: `1px solid #E2E8F0`, borderRadius: 10,
    background: '#F8FAFC', color: '#0F172A',
    fontSize: mono ? 16 : 14, fontWeight: mono ? 700 : 500,
    fontFamily: mono ? 'ui-monospace, monospace' : "'Plus Jakarta Sans', system-ui, sans-serif",
    letterSpacing: mono ? '.12em' : undefined,
    textTransform: mono ? 'uppercase' : undefined,
    transition: 'border-color .15s, box-shadow .15s',
  }
}
