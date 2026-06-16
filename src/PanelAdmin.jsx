import { useState, useEffect } from 'react'
import {
  Car, Truck, GraduationCap, RefreshCcw,
  LogOut, X, Clock, Check, ChevronRight,
  Bell, Users,
} from 'lucide-react'

// ── Paleta dark ──────────────────────────────────────────────────────────────
const D = {
  bg:      '#070C18',
  surf1:   '#0F172A',   // header, form
  surf2:   '#1A2540',   // cards de cola
  surf3:   '#131B2E',   // inner areas, inputs
  border:  '#1E293B',
  border2: '#2D3F5C',
  txt:     '#F1F5F9',
  txt2:    '#94A3B8',
  txt3:    '#64748B',
  muted:   '#334155',
}

// ── Categorías ───────────────────────────────────────────────────────────────
const CATS = {
  A: { color: '#F59E0B', name: 'Motos y Autos',   short: 'Autos',     Icon: Car,           label: 'Motos y Autos' },
  R: { color: '#EF4444', name: 'Segunda Revisión', short: 'Revisión',  Icon: RefreshCcw,    label: 'Segunda Revisión' },
  B: { color: '#3B82F6', name: 'Carga Pesada',     short: 'Carga',     Icon: Truck,         label: 'Carga Pesada' },
  V: { color: '#22C55E', name: 'Enseñanza',         short: 'Enseñanza', Icon: GraduationCap, label: 'Enseñanza' },
}

const pad = (n) => String(n).padStart(2, '0')
const code = (t) => `${t.codigo}-${pad(t.numero)}`

// ── Mock data ────────────────────────────────────────────────────────────────
let _nextId   = 100
let _counters = { A: 8, R: 3, B: 2, V: 1 }

const INIT_QUEUES = {
  A: [
    { id: '2', codigo: 'A', numero: 2, nombre_cliente: 'María García',    placa_vehiculo: 'XYZ-789' },
    { id: '3', codigo: 'A', numero: 3, nombre_cliente: 'Juan López',      placa_vehiculo: 'DEF-456' },
    { id: '4', codigo: 'A', numero: 4, nombre_cliente: 'Laura Jiménez',   placa_vehiculo: 'GHI-321' },
    { id: '5', codigo: 'A', numero: 5, nombre_cliente: 'Sofía Herrera',   placa_vehiculo: 'MNO-555' },
  ],
  R: [
    { id: '6', codigo: 'R', numero: 1, nombre_cliente: 'Ana Rodríguez',   placa_vehiculo: 'JKL-654' },
    { id: '7', codigo: 'R', numero: 2, nombre_cliente: 'Pablo Gómez',     placa_vehiculo: 'PQR-777' },
  ],
  B: [
    { id: '8', codigo: 'B', numero: 1, nombre_cliente: 'Pedro Sánchez',   placa_vehiculo: 'STU-100' },
  ],
  V: [],
}

const INIT_CURRENT = {
  A: { id: '1',  codigo: 'A', numero: 1, nombre_cliente: 'Carlos Martínez', placa_vehiculo: 'ABC-123' },
  R: null,
  B: null,
  V: null,
}

// ── Componente principal ─────────────────────────────────────────────────────
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
    const q = queues[k]
    if (!q.length) return
    const next = q[0]
    // marcar el anterior como atendido (mock: sólo lo descartamos)
    setCurrent(c => ({ ...c, [k]: next }))
    setQueues(q2 => ({ ...q2, [k]: q2[k].slice(1) }))
  }

  const handleCancelar = (k) => {
    setCurrent(c => ({ ...c, [k]: null }))
  }

  const handleRemoveFromQueue = (k, id) => {
    setQueues(q => ({ ...q, [k]: q[k].filter(t => t.id !== id) }))
  }

  const handleAssign = () => {
    if (!plate.trim() || !name.trim() || !selCat) return
    _counters[selCat] = (_counters[selCat] || 0) + 1
    const newTurno = {
      id:              String(++_nextId),
      codigo:          selCat,
      numero:          _counters[selCat],
      nombre_cliente:  name.trim(),
      placa_vehiculo:  plate.trim().toUpperCase(),
    }
    setQueues(q => ({ ...q, [selCat]: [...q[selCat], newTurno] }))
    setLastAssigned(newTurno)
    setPlate(''); setName(''); setCedula(''); setSelCat('')
    setTimeout(() => setLastAssigned(null), 4000)
  }

  const canAssign = !!(plate.trim() && name.trim() && selCat)

  return (
    <div style={{ minHeight: '100vh', background: D.bg, color: D.txt, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header style={{ background: D.surf1, borderBottom: `1px solid ${D.border}`, padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 10, padding: '5px 9px', display: 'flex', alignItems: 'center' }}>
            <img src="/logocda.png" alt="CDA" style={{ height: 38, width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em' }}>CDA La Cordialidad</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: D.txt3, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 1 }}>Panel del Operario</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Stats badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, background: D.surf3, border: `1px solid ${D.border2}` }}>
            <Users size={13} color={D.txt2} />
            <span style={{ fontSize: 13, fontWeight: 700, color: D.txt, fontVariantNumeric: 'tabular-nums' }}>{totalWaiting}</span>
            <span style={{ fontSize: 12, color: D.txt3 }}>en espera</span>
          </div>
          {/* Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, background: D.surf3, border: `1px solid ${D.border2}` }}>
            <Clock size={13} color={D.txt2} />
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontVariantNumeric: 'tabular-nums', letterSpacing: '.08em' }}>{time}</span>
          </div>
          {/* Logout */}
          <button
            onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: `1px solid ${D.border2}`, borderRadius: 9, background: 'transparent', color: D.txt2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseOver={e => { e.currentTarget.style.background = D.surf2; e.currentTarget.style.color = D.txt }}
            onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = D.txt2 }}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1560, margin: '0 auto', padding: '28px 32px 48px', display: 'grid', gridTemplateColumns: '370px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Formulario ──────────────────────────────────────────────── */}
        <aside style={{ background: D.surf1, border: `1px solid ${D.border}`, borderRadius: 18, overflow: 'hidden', position: 'sticky', top: 92 }}>
          <div style={{ padding: '22px 24px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em' }}>Registrar cliente</div>
            <div style={{ fontSize: 13, color: D.txt2, marginTop: 3, marginBottom: 22 }}>Ingresa los datos y asigna un turno.</div>
          </div>

          <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Placa */}
            <div>
              <Label>Placa del vehículo</Label>
              <input
                value={plate}
                onChange={e => setPlate(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                maxLength={8}
                style={inputStyle({ mono: true, bg: D.surf3, border: D.border2, txt: D.txt })}
                onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.12)' }}
                onBlur={e  => { e.target.style.borderColor = D.border2; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Nombre */}
            <div>
              <Label>Nombre del cliente</Label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nombre y apellido"
                style={inputStyle({ bg: D.surf3, border: D.border2, txt: D.txt })}
                onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.12)' }}
                onBlur={e  => { e.target.style.borderColor = D.border2; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Cédula */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: D.txt2 }}>Cédula</span>
                <span style={{ fontSize: 11, color: D.txt3, fontWeight: 500 }}>opcional</span>
              </div>
              <input
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                placeholder="N.º de documento"
                style={inputStyle({ bg: D.surf3, border: D.border2, txt: D.txt })}
                onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.12)' }}
                onBlur={e  => { e.target.style.borderColor = D.border2; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Categorías */}
            <div>
              <Label>Categoría de revisión</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {Object.entries(CATS).map(([k, c]) => {
                  const sel = selCat === k
                  const { Icon } = c
                  return (
                    <button
                      key={k}
                      onClick={() => setSelCat(k)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 13px', borderRadius: 12, cursor: 'pointer',
                        fontFamily: 'inherit', textAlign: 'left', transition: 'all .18s',
                        background:  sel ? c.color + '16' : D.surf3,
                        border:      `1.5px solid ${sel ? c.color : D.border2}`,
                        boxShadow:   sel ? `0 0 0 3px ${c.color}20, 0 0 20px ${c.color}10` : 'none',
                        color:       sel ? D.txt : D.txt2,
                        transform:   sel ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <span style={{ width: 32, height: 32, borderRadius: 9, background: c.color + (sel ? 'DD' : '25'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .18s' }}>
                        <Icon size={16} color={sel ? '#fff' : c.color} />
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{c.short}</div>
                        <div style={{ fontSize: 10, color: D.txt3, fontWeight: 500, marginTop: 1 }}>Cod. {k}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Botón asignar */}
            <button
              onClick={handleAssign}
              disabled={!canAssign}
              style={{
                width: '100%', padding: '14px', border: 'none', borderRadius: 12,
                fontFamily: 'inherit', fontSize: 14, fontWeight: 800,
                letterSpacing: '.02em', cursor: canAssign ? 'pointer' : 'not-allowed',
                transition: 'all .18s',
                background:  canAssign
                  ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                  : D.muted,
                color:      canAssign ? '#1A1000' : D.txt3,
                boxShadow:  canAssign ? '0 4px 16px rgba(245,158,11,.35)' : 'none',
              }}
              onMouseOver={e => { if (canAssign) { e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,.50)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseOut={e  => { e.currentTarget.style.boxShadow = canAssign ? '0 4px 16px rgba(245,158,11,.35)' : 'none'; e.currentTarget.style.transform = 'none' }}
              onMouseDown={e => { e.currentTarget.style.animation = 'pressBtn .25s ease' }}
              onAnimationEnd={e => { e.currentTarget.style.animation = 'none' }}
            >
              Asignar turno
            </button>

            {/* Feedback de asignación */}
            {lastAssigned && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 11, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(34,197,94,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={13} color="#22C55E" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>Turno asignado</div>
                  <div style={{ fontSize: 12, color: D.txt2, marginTop: 1 }}><b style={{ color: CATS[lastAssigned.codigo].color }}>{code(lastAssigned)}</b> — {lastAssigned.nombre_cliente}</div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Columnas de cola ──────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em' }}>Cola por categoría</div>
              <div style={{ fontSize: 13, color: D.txt3, marginTop: 2 }}>Estado en tiempo real del turno</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(CATS).map(([k, c]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: D.surf1, border: `1px solid ${D.border}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: D.txt2 }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: D.txt, fontVariantNumeric: 'tabular-nums' }}>{queues[k].length}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {Object.entries(CATS).map(([k, c]) => {
              const { Icon } = c
              const q   = queues[k]
              const cur = current[k]
              const can = q.length > 0
              return (
                <div key={k} style={{ background: D.surf1, border: `1px solid ${D.border}`, borderTop: `3px solid ${c.color}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                  {/* Column header */}
                  <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: c.color + '18', border: `1px solid ${c.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={17} color={c.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: D.txt }}>{c.short}</div>
                      <div style={{ fontSize: 11, color: D.txt3, marginTop: 1 }}>{c.name}</div>
                    </div>
                  </div>

                  {/* En llamado */}
                  <div style={{ margin: '12px 12px 0', padding: '13px', borderRadius: 12, background: cur ? c.color + '0C' : D.surf3, border: `1px solid ${cur ? c.color + '30' : D.border}`, minHeight: 100, transition: 'all .3s', boxShadow: cur ? `0 0 20px ${c.color}12, inset 0 1px 0 ${c.color}10` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: cur ? c.color : D.txt3 }}>
                        <Bell size={10} />
                        En llamado
                      </div>
                      {cur && (
                        <button
                          onClick={() => handleCancelar(k)}
                          title="Cancelar — no se presentó"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', border: `1px solid ${D.border2}`, borderRadius: 6, background: 'transparent', color: D.txt3, fontFamily: 'inherit', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#EF444450'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#EF444410' }}
                          onMouseOut={e  => { e.currentTarget.style.borderColor = D.border2;  e.currentTarget.style.color = D.txt3;    e.currentTarget.style.background = 'transparent' }}
                        >
                          <X size={9} /> Cancelar
                        </button>
                      )}
                    </div>
                    {cur ? (
                      <>
                        <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, color: c.color, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 24px ${c.color}80, 0 0 48px ${c.color}35` }}>
                          {code(cur)}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: D.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.nombre_cliente}</div>
                        <div style={{ fontSize: 11, color: D.txt2, fontFamily: 'ui-monospace, monospace', letterSpacing: '.06em', marginTop: 2 }}>{cur.placa_vehiculo}</div>
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
                    <button
                      onClick={() => handleLlamar(k)}
                      disabled={!can}
                      style={{
                        width: '100%', padding: '11px', border: 'none', borderRadius: 10,
                        fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                        cursor: can ? 'pointer' : 'not-allowed', transition: 'all .18s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        background:  can ? `linear-gradient(135deg, ${c.color}EE, ${c.color}BB)` : D.surf3,
                        color:       can ? '#fff'  : D.txt3,
                        boxShadow:   can ? `0 4px 14px ${c.color}45` : 'none',
                      }}
                      onMouseOver={e => { if (can) { e.currentTarget.style.boxShadow = `0 6px 20px ${c.color}60`; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                      onMouseOut={e  => { e.currentTarget.style.boxShadow = can ? `0 4px 14px ${c.color}45` : 'none'; e.currentTarget.style.transform = 'none' }}
                      onMouseDown={e => { if (can) e.currentTarget.style.transform = 'translateY(1px) scale(.98)' }}
                      onMouseUp={e   => { if (can) e.currentTarget.style.transform = 'translateY(-1px)' }}
                    >
                      <ChevronRight size={15} />
                      Llamar siguiente
                    </button>
                  </div>

                  {/* En espera */}
                  <div style={{ padding: '0 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: D.txt3 }}>En espera</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: can ? c.color : D.txt3, background: can ? c.color + '15' : D.surf3, border: `1px solid ${can ? c.color + '30' : D.border}`, borderRadius: 999, padding: '2px 9px', minWidth: 24, textAlign: 'center', fontVariantNumeric: 'tabular-nums', transition: 'all .2s' }}>
                      {q.length}
                    </span>
                  </div>

                  <div style={{ padding: '2px 10px 12px', maxHeight: 248, overflowY: 'auto' }}>
                    {q.length === 0 ? (
                      <div style={{ padding: '14px 8px', fontSize: 12, color: D.txt3, textAlign: 'center' }}>Sin turnos en espera</div>
                    ) : q.map(t => (
                      <div
                        key={t.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 9, transition: 'background .12s', cursor: 'default' }}
                        onMouseOver={e => e.currentTarget.style.background = D.surf3}
                        onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: 12, fontWeight: 800, color: c.color, fontVariantNumeric: 'tabular-nums', minWidth: 44, flexShrink: 0 }}>{code(t)}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: D.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre_cliente}</div>
                          <div style={{ fontSize: 11, color: D.txt3, fontFamily: 'ui-monospace, monospace' }}>{t.placa_vehiculo}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveFromQueue(k, t.id)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: D.txt3, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,.15)'; e.currentTarget.style.color = '#EF4444' }}
                          onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = D.txt3 }}
                        >
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

// ── UI helpers ───────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 7 }}>
      {children}
    </div>
  )
}
function inputStyle({ mono, bg, border, txt } = {}) {
  return {
    width: '100%', padding: '11px 13px',
    border: `1px solid ${border}`, borderRadius: 10,
    background: bg, color: txt,
    fontSize: mono ? 16 : 14,
    fontWeight: mono ? 700 : 500,
    fontFamily: mono ? 'ui-monospace, monospace' : "'Plus Jakarta Sans', system-ui, sans-serif",
    letterSpacing: mono ? '.12em' : undefined,
    textTransform: mono ? 'uppercase' : undefined,
    transition: 'border-color .15s, box-shadow .15s',
  }
}
