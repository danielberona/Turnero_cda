import { useState, useEffect, useRef } from 'react'

// ── Paleta dark TV ───────────────────────────────────────────────────────────
const D = {
  bg:     '#070C18',
  surf:   '#0D1526',
  surf2:  '#131E33',
  border: '#1E2D47',
  txt:    '#F1F5F9',
  txt2:   '#94A3B8',
  txt3:   '#4B6280',
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
  { id: 't1', codigo: 'A', numero: 5,  nombre_cliente: 'Roberto Fernández', placa_vehiculo: 'PQR-111', categoria: 'Motos y Autos' },
  { id: 't2', codigo: 'R', numero: 2,  nombre_cliente: 'Ana Rodríguez',     placa_vehiculo: 'JKL-654', categoria: 'Segunda Revisión' },
  { id: 't3', codigo: 'B', numero: 1,  nombre_cliente: 'Pedro Sánchez',     placa_vehiculo: 'STU-987', categoria: 'Carga Pesada' },
  { id: 't4', codigo: 'V', numero: 1,  nombre_cliente: 'Diana Morales',     placa_vehiculo: 'VWX-222', categoria: 'Enseñanza' },
  { id: 't5', codigo: 'A', numero: 6,  nombre_cliente: 'Sofía Herrera',     placa_vehiculo: 'MNO-555', categoria: 'Motos y Autos' },
]
const MOCK_WAITING = [
  { id: 'w1', codigo: 'A', numero: 6,  nombre_cliente: 'Sofía Herrera',     placa_vehiculo: 'MNO-555' },
  { id: 'w2', codigo: 'R', numero: 3,  nombre_cliente: 'Pablo Gómez',       placa_vehiculo: 'ABC-321' },
  { id: 'w3', codigo: 'A', numero: 7,  nombre_cliente: 'Juan López',        placa_vehiculo: 'DEF-456' },
  { id: 'w4', codigo: 'B', numero: 2,  nombre_cliente: 'Luis Torres',       placa_vehiculo: 'GHI-789' },
  { id: 'w5', codigo: 'V', numero: 2,  nombre_cliente: 'Carmen Silva',      placa_vehiculo: 'JKL-000' },
  { id: 'w6', codigo: 'A', numero: 8,  nombre_cliente: 'Carlos Torres',     placa_vehiculo: 'XYZ-111' },
]

export default function PantallaEspera() {
  const [turnIdx,   setTurnIdx]   = useState(0)
  const [heroKey,   setHeroKey]   = useState(0)      // cambia → re-anima el hero
  const [flashKey,  setFlashKey]  = useState(0)      // cambia → re-anima el flash
  const [avisoIdx,  setAvisoIdx]  = useState(0)
  const [avisoKey,  setAvisoKey]  = useState(0)
  const [clock,     setClock]     = useState({ time: '', date: '' })

  const stageRef = useRef(null)

  // ── Escala la stage a la ventana ──────────────────────────────────────────
  const fitStage = () => {
    const el = stageRef.current
    if (!el) return
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
    el.style.transform = `scale(${s})`
  }

  useEffect(() => {
    fitStage()
    window.addEventListener('resize', fitStage)

    // Reloj
    const tickClock = () => {
      const now = new Date()
      setClock({
        time: now.toLocaleTimeString('es-CO', { hour12: false }),
        date: (() => {
          const d = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
          return d.charAt(0).toUpperCase() + d.slice(1)
        })(),
      })
    }
    tickClock()
    const clockT = setInterval(tickClock, 1000)

    // Rota turno demo cada 8 s
    const turnT = setInterval(() => {
      setTurnIdx(i => {
        const next = (i + 1) % MOCK_TURNS.length
        setHeroKey(k => k + 1)
        setFlashKey(k => k + 1)
        return next
      })
    }, 8000)

    // Aviso rotante cada 7 s
    const avisoT = setInterval(() => {
      setAvisoIdx(i => (i + 1) % AVISOS.length)
      setAvisoKey(k => k + 1)
    }, 7000)

    return () => {
      window.removeEventListener('resize', fitStage)
      clearInterval(clockT); clearInterval(turnT); clearInterval(avisoT)
    }
  }, [])

  const cur    = MOCK_TURNS[turnIdx]
  const cat    = CATS[cur.codigo]
  const glow   = cat.color

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: D.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* Flash de color al cambiar turno */}
      <div
        key={`flash-${flashKey}`}
        style={{ position: 'fixed', inset: 0, background: glow, pointerEvents: 'none', zIndex: 100, animation: 'flashScreen .6s ease-out forwards' }}
      />

      {/* Stage escalable 1920×1080 */}
      <div
        ref={stageRef}
        style={{ width: 1920, height: 1080, flexShrink: 0, transformOrigin: 'center', position: 'relative', display: 'grid', gridTemplateRows: 'auto 1fr auto', background: D.bg }}
      >

        {/* Fondo: gradiente radial sutil */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 140% 100% at 30% 50%, ${glow}08 0%, transparent 65%)`, pointerEvents: 'none', transition: 'background 1s ease' }} />

        {/* ── Header ──────────────────────────────────────────────── */}
        <header style={{ background: D.surf, borderBottom: `1px solid ${D.border}`, padding: '0 56px', height: 96, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '7px 12px', boxShadow: '0 2px 12px rgba(0,0,0,.35)' }}>
              <img src="/logocda.png" alt="CDA" style={{ height: 54, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-.03em', color: D.txt }}>CDA La Cordialidad</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: D.txt3, letterSpacing: '.16em', textTransform: 'uppercase', marginTop: 3 }}>Centro de Diagnóstico Automotor</div>
            </div>
          </div>

          {/* Reloj */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 56, fontWeight: 900, fontFamily: 'ui-monospace, monospace', fontVariantNumeric: 'tabular-nums', letterSpacing: '.05em', color: D.txt, lineHeight: 1 }}>{clock.time}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: D.txt3, marginTop: 4 }}>{clock.date}</div>
          </div>
        </header>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 36, padding: '36px 56px', minHeight: 0, position: 'relative', zIndex: 10 }}>

          {/* Hero — turno actual */}
          <section
            key={`hero-${heroKey}`}
            style={{
              background: D.surf,
              border:     `1px solid ${D.border}`,
              borderLeft: `8px solid ${glow}`,
              borderRadius: 28,
              padding:    '56px 64px',
              display:    'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position:   'relative',
              overflow:   'hidden',
              animation:  'heroIn .65s cubic-bezier(.2,.75,.2,1) both',
              boxShadow:  `0 0 0 1px ${glow}18, 0 8px 48px ${glow}10`,
            }}
          >
            {/* Glow ambient en el fondo */}
            <div style={{ position: 'absolute', top: '40%', left: '10%', width: '70%', height: '70%', background: `radial-gradient(circle, ${glow}14 0%, transparent 70%)`, pointerEvents: 'none', transform: 'translateY(-50%)', filter: 'blur(40px)' }} />

            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '.28em', textTransform: 'uppercase', color: D.txt3 }}>Turno en llamado</div>

              {/* Número gigante */}
              <div style={{ marginTop: 8, fontSize: 220, lineHeight: .85, fontWeight: 900, color: glow, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums', textShadow: `0 0 40px ${glow}90, 0 0 80px ${glow}50, 0 0 140px ${glow}25`, animation: 'glowPulse 3s ease-in-out infinite' }}>
                {code(cur)}
              </div>

              {/* Categoría */}
              <div style={{ marginTop: 24, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 999, background: glow + '15', border: `1.5px solid ${glow}40` }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: glow, flexShrink: 0 }} />
                <span style={{ fontSize: 22, fontWeight: 800, color: glow, letterSpacing: '.02em' }}>{cat.name}</span>
              </div>

              {/* Divider */}
              <div style={{ marginTop: 42, height: 1, background: `linear-gradient(to right, ${D.border2 || D.border}, transparent)` }} />

              {/* Info cliente */}
              <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'end' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: D.txt3, marginBottom: 8 }}>Cliente</div>
                  <div style={{ fontSize: 44, fontWeight: 800, color: D.txt, lineHeight: 1.05, letterSpacing: '-.01em' }}>{cur.nombre_cliente}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: D.txt3, marginBottom: 8 }}>Placa</div>
                  <div style={{ padding: '10px 20px', borderRadius: 13, background: D.surf2, border: `1.5px solid ${D.border}`, fontFamily: 'ui-monospace, monospace', fontSize: 36, fontWeight: 800, letterSpacing: '.14em', color: D.txt }}>
                    {cur.placa_vehiculo}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Lista de espera */}
          <aside style={{ background: D.surf, border: `1px solid ${D.border}`, borderRadius: 28, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px 18px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: D.txt }}>En espera</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: D.txt3, fontVariantNumeric: 'tabular-nums' }}>{MOCK_WAITING.length} turnos</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
              {MOCK_WAITING.map((t, i) => {
                const tc = CATS[t.codigo]
                return (
                  <div
                    key={t.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '15px 14px', borderRadius: 16, borderBottom: i < MOCK_WAITING.length - 1 ? `1px solid ${D.border}` : 'none', transition: 'background .15s' }}
                    onMouseOver={e => e.currentTarget.style.background = D.surf2}
                    onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Barra de color */}
                    <div style={{ width: 5, height: 52, borderRadius: 99, background: tc.color, flexShrink: 0, boxShadow: `0 0 10px ${tc.color}60` }} />

                    {/* Código */}
                    <span style={{ fontSize: 32, fontWeight: 900, color: tc.color, fontVariantNumeric: 'tabular-nums', minWidth: 110, flexShrink: 0 }}>
                      {code(t)}
                    </span>

                    {/* Info */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: D.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre_cliente}</div>
                      <div style={{ fontSize: 15, fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '.08em', color: D.txt3, background: D.surf2, border: `1px solid ${D.border}`, borderRadius: 8, padding: '2px 10px', marginTop: 5, display: 'inline-block' }}>
                        {t.placa_vehiculo}
                      </div>
                    </div>

                    {/* Badge de categoría */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: tc.color + '14', border: `1.5px solid ${tc.color}35` }}>
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
        <footer style={{ background: D.surf, borderTop: `1px solid ${D.border}`, height: 64, display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 10 }}>
          {/* Etiqueta fija izquierda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 28px', borderRight: `1px solid ${D.border}`, flexShrink: 0, height: '100%' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', animation: 'blink 1.6s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#F59E0B', whiteSpace: 'nowrap' }}>Aviso</span>
          </div>

          {/* Texto deslizante */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <span
              key={`aviso-${avisoKey}`}
              style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: 22, fontWeight: 600, color: D.txt2, animation: 'marqueeScroll 24s linear forwards' }}
            >
              {AVISOS[avisoIdx]}
            </span>
          </div>
        </footer>

      </div>
    </div>
  )
}
