import { useState, useEffect, useRef } from 'react'

// ── Paleta clínica — blanco limpio ──────────────────────────────────────────
const D = {
  bg:     '#EEF2F7',   // fondo gris-azulado muy suave
  surf:   '#FFFFFF',   // blanco puro
  surf2:  '#F8FAFC',   // gris clarísimo para áreas internas
  border: '#DDE3EC',   // borde claro
  border2:'#C8D3E0',   // borde un poco más visible
  txt:    '#0F172A',   // casi negro
  txt2:   '#475569',   // gris medio
  txt3:   '#94A3B8',   // gris claro
  shadow: 'rgba(15,23,42,.07)',
}

const CATS = {
  A: { color: '#F59E0B', name: 'Motos y Autos',   short: 'Autos' },
  R: { color: '#EF4444', name: 'Segunda Revisión', short: 'Revisión' },
  B: { color: '#3B82F6', name: 'Carga Pesada',     short: 'Carga' },
  V: { color: '#22C55E', name: 'Enseñanza',         short: 'Enseñanza' },
}

const AVISOS = [
  'Bienvenido al CDA La Cordialidad — tenga a mano su documentación.',
  'Recuerde: el vehículo debe estar a paz y salvo en multas para la revisión.',
  'Nuestro horario de atención es de lunes a sábado de 8:00 a.m. a 5:00 p.m.',
  'Por su seguridad y la de los demás, conduzca con responsabilidad.',
  'Gracias por preferirnos. ¡Lo atendemos en breve!',
]

const pad  = (n) => String(n).padStart(2, '0')
const code = (t) => `${t.codigo}-${pad(t.numero)}`

// ── Mock — rota cada 8 s para demostrar animaciones ─────────────────────────
const MOCK_TURNS = [
  { id: 't1', codigo: 'A', numero: 5, nombre_cliente: 'Roberto Fernández', placa_vehiculo: 'PQR-111' },
  { id: 't2', codigo: 'R', numero: 2, nombre_cliente: 'Ana Rodríguez',     placa_vehiculo: 'JKL-654' },
  { id: 't3', codigo: 'B', numero: 1, nombre_cliente: 'Pedro Sánchez',     placa_vehiculo: 'STU-987' },
  { id: 't4', codigo: 'V', numero: 1, nombre_cliente: 'Diana Morales',     placa_vehiculo: 'VWX-222' },
  { id: 't5', codigo: 'A', numero: 6, nombre_cliente: 'Sofía Herrera',     placa_vehiculo: 'MNO-555' },
]
const MOCK_WAITING = [
  { id: 'w1', codigo: 'A', numero: 6, nombre_cliente: 'Sofía Herrera',   placa_vehiculo: 'MNO-555' },
  { id: 'w2', codigo: 'R', numero: 3, nombre_cliente: 'Pablo Gómez',     placa_vehiculo: 'ABC-321' },
  { id: 'w3', codigo: 'A', numero: 7, nombre_cliente: 'Juan López',      placa_vehiculo: 'DEF-456' },
  { id: 'w4', codigo: 'B', numero: 2, nombre_cliente: 'Luis Torres',     placa_vehiculo: 'GHI-789' },
  { id: 'w5', codigo: 'V', numero: 2, nombre_cliente: 'Carmen Silva',    placa_vehiculo: 'JKL-000' },
  { id: 'w6', codigo: 'A', numero: 8, nombre_cliente: 'Carlos Torres',   placa_vehiculo: 'XYZ-111' },
]

export default function PantallaEspera() {
  const [turnIdx,  setTurnIdx]  = useState(0)
  const [heroKey,  setHeroKey]  = useState(0)
  const [flashKey, setFlashKey] = useState(0)
  const [avisoIdx, setAvisoIdx] = useState(0)
  const [avisoKey, setAvisoKey] = useState(0)
  const [clock,    setClock]    = useState({ time: '', date: '' })

  const stageRef = useRef(null)

  const fitStage = () => {
    const el = stageRef.current
    if (!el) return
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
    el.style.transform = `scale(${s})`
  }

  useEffect(() => {
    fitStage()
    window.addEventListener('resize', fitStage)

    const tickClock = () => {
      const now = new Date()
      const d   = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
      setClock({ time: now.toLocaleTimeString('es-CO', { hour12: false }), date: d.charAt(0).toUpperCase() + d.slice(1) })
    }
    tickClock()
    const clockT = setInterval(tickClock, 1000)

    const turnT  = setInterval(() => {
      setTurnIdx(i => { const n = (i + 1) % MOCK_TURNS.length; setHeroKey(k => k + 1); setFlashKey(k => k + 1); return n })
    }, 8000)

    const avisoT = setInterval(() => {
      setAvisoIdx(i => (i + 1) % AVISOS.length); setAvisoKey(k => k + 1)
    }, 7000)

    return () => {
      window.removeEventListener('resize', fitStage)
      clearInterval(clockT); clearInterval(turnT); clearInterval(avisoT)
    }
  }, [])

  const cur = MOCK_TURNS[turnIdx]
  const cat = CATS[cur.codigo]

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: D.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* Flash sutil al cambiar turno */}
      <div
        key={`flash-${flashKey}`}
        style={{ position: 'fixed', inset: 0, background: cat.color, pointerEvents: 'none', zIndex: 100, animation: 'flashScreen .5s ease-out forwards', opacity: 0 }}
      />

      {/* Stage 1920×1080 escalable */}
      <div
        ref={stageRef}
        style={{ width: 1920, height: 1080, flexShrink: 0, transformOrigin: 'center', background: D.bg, display: 'grid', gridTemplateRows: 'auto 1fr auto' }}
      >

        {/* ── Header ──────────────────────────────────────────────── */}
        <header style={{ background: D.surf, borderBottom: `1px solid ${D.border}`, padding: '0 56px', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: `0 1px 6px ${D.shadow}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <img src="/logocda.png" alt="CDA La Cordialidad" style={{ height: 58, width: 'auto', objectFit: 'contain', display: 'block' }} />
            <div style={{ width: 1, height: 40, background: D.border }} />
            <div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-.03em', color: D.txt }}>CDA La Cordialidad</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: D.txt3, letterSpacing: '.18em', textTransform: 'uppercase', marginTop: 3 }}>Centro de Diagnóstico Automotor</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 58, fontWeight: 900, fontFamily: 'ui-monospace, monospace', fontVariantNumeric: 'tabular-nums', letterSpacing: '.04em', color: D.txt, lineHeight: 1 }}>{clock.time}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: D.txt3, marginTop: 5 }}>{clock.date}</div>
          </div>
        </header>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 32, padding: '32px 56px', minHeight: 0 }}>

          {/* Hero — turno actual */}
          <section
            key={`hero-${heroKey}`}
            style={{ background: D.surf, border: `1px solid ${D.border}`, borderLeft: `8px solid ${cat.color}`, borderRadius: 24, padding: '52px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', animation: 'heroIn .60s cubic-bezier(.2,.75,.2,1) both', boxShadow: `0 4px 24px ${D.shadow}`, position: 'relative' }}
          >
            {/* Tinte ambiental muy suave del color */}
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cat.color}05 0%, transparent 60%)`, pointerEvents: 'none', borderRadius: 'inherit' }} />

            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.28em', textTransform: 'uppercase', color: D.txt3 }}>Turno en llamado</div>

              {/* Número gigante */}
              <div style={{ marginTop: 6, fontSize: 210, lineHeight: .86, fontWeight: 900, color: cat.color, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>
                {code(cur)}
              </div>

              {/* Categoría */}
              <div style={{ marginTop: 22, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 11, padding: '10px 20px', borderRadius: 999, background: cat.color + '10', border: `1.5px solid ${cat.color}30` }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: 20, fontWeight: 800, color: cat.color }}>{cat.name}</span>
              </div>

              {/* Divider */}
              <div style={{ marginTop: 38, height: 1, background: D.border }} />

              {/* Info cliente */}
              <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr auto', gap: 36, alignItems: 'end' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: D.txt3, marginBottom: 8 }}>Cliente</div>
                  <div style={{ fontSize: 44, fontWeight: 800, color: D.txt, lineHeight: 1.05, letterSpacing: '-.01em' }}>{cur.nombre_cliente}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: D.txt3, marginBottom: 8 }}>Placa</div>
                  <div style={{ padding: '10px 22px', borderRadius: 13, background: D.surf2, border: `1.5px solid ${D.border2}`, fontFamily: 'ui-monospace, monospace', fontSize: 36, fontWeight: 800, letterSpacing: '.14em', color: D.txt }}>
                    {cur.placa_vehiculo}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Lista de espera */}
          <aside style={{ background: D.surf, border: `1px solid ${D.border}`, borderRadius: 24, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', boxShadow: `0 4px 24px ${D.shadow}` }}>
            <div style={{ padding: '24px 28px 18px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: D.txt }}>En espera</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: D.txt3, fontVariantNumeric: 'tabular-nums' }}>{MOCK_WAITING.length} turnos</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 14px' }}>
              {MOCK_WAITING.map((t, i) => {
                const tc = CATS[t.codigo]
                return (
                  <div key={t.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '15px 14px', borderRadius: 14, borderBottom: i < MOCK_WAITING.length - 1 ? `1px solid ${D.border}` : 'none', transition: 'background .15s' }}
                    onMouseOver={e => e.currentTarget.style.background = D.surf2}
                    onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 5, height: 52, borderRadius: 99, background: tc.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 32, fontWeight: 900, color: tc.color, fontVariantNumeric: 'tabular-nums', minWidth: 110, flexShrink: 0 }}>{code(t)}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: D.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre_cliente}</div>
                      <div style={{ fontSize: 14, fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '.07em', color: D.txt3, background: D.surf2, border: `1px solid ${D.border}`, borderRadius: 8, padding: '2px 10px', marginTop: 5, display: 'inline-block' }}>
                        {t.placa_vehiculo}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: tc.color + '0E', border: `1.5px solid ${tc.color}28` }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: tc.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: tc.color }}>{tc.short}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>
        </main>

        {/* ── Footer — marquee ────────────────────────────────────── */}
        <footer style={{ background: D.surf, borderTop: `1px solid ${D.border}`, height: 62, display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: `0 -1px 4px ${D.shadow}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 28px', borderRight: `1px solid ${D.border}`, flexShrink: 0, height: '100%' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', animation: 'blink 1.6s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#F59E0B', whiteSpace: 'nowrap' }}>Aviso</span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <span
              key={`aviso-${avisoKey}`}
              style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: 21, fontWeight: 500, color: D.txt2, animation: 'marqueeScroll 26s linear forwards' }}
            >
              {AVISOS[avisoIdx]}
            </span>
          </div>
        </footer>

      </div>
    </div>
  )
}
