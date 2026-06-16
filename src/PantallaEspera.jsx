import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

// ── Paleta clínica ───────────────────────────────────────────────────────────
const D = {
  bg:     '#FFFFFF',   // fondo blanco total — sin panel flotante
  surf:   '#FFFFFF',
  surf2:  '#F8FAFC',
  border: '#E2E8F0',
  border2:'#CBD5E1',
  txt:    '#0F172A',
  txt2:   '#475569',
  txt3:   '#94A3B8',
  shadow: 'rgba(15,23,42,.06)',
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

// Reloj en formato 12 h → "3:45 PM"
const fmt12h = (d) => {
  const h    = d.getHours()
  const m    = pad(d.getMinutes())
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

export default function PantallaEspera() {
  const [current, setCurrent]  = useState(null)
  const [waiting, setWaiting]  = useState([])
  const [heroKey,  setHeroKey] = useState(0)
  const [flashKey, setFlashKey]= useState(0)
  const [avisoIdx, setAvisoIdx]= useState(0)
  const [avisoKey, setAvisoKey]= useState(0)
  const [clock,    setClock]   = useState({ time: '', date: '' })

  const stageRef    = useRef(null)
  const prevIdRef   = useRef(null)

  // ── Escala 1920×1080 → ventana ───────────────────────────────────────────
  const fitStage = () => {
    const el = stageRef.current
    if (!el) return
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
    el.style.transform = `translate(-50%, -50%) scale(${s})`
  }

  // ── Carga datos de Supabase ───────────────────────────────────────────────
  const loadData = async () => {
    const [{ data: llamados }, { data: espera }] = await Promise.all([
      supabase
        .from('turnos').select('*').eq('estado', 'llamado')
        .order('llamado_en', { ascending: false }).limit(1),
      supabase
        .from('turnos').select('*').eq('estado', 'esperando')
        .order('creado_en', { ascending: true }),
    ])

    const nuevo = llamados?.[0] ?? null
    if (nuevo?.id !== prevIdRef.current) {
      prevIdRef.current = nuevo?.id ?? null
      setHeroKey(k => k + 1)
      if (nuevo) setFlashKey(k => k + 1)
    }
    setCurrent(nuevo)
    setWaiting(espera ?? [])
  }

  useEffect(() => {
    fitStage()
    window.addEventListener('resize', fitStage)
    loadData()

    // Reloj
    const clockT = setInterval(() => {
      const now = new Date()
      const d   = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
      setClock({ time: fmt12h(now), date: d.charAt(0).toUpperCase() + d.slice(1) })
    }, 1000)

    // Primer tick inmediato
    const now0 = new Date()
    const d0   = now0.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    setClock({ time: fmt12h(now0), date: d0.charAt(0).toUpperCase() + d0.slice(1) })

    // Avisos
    const avisoT = setInterval(() => {
      setAvisoIdx(i => (i + 1) % AVISOS.length)
      setAvisoKey(k => k + 1)
    }, 7000)

    // Realtime
    const canal = supabase.channel('tv-espera')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, loadData)
      .subscribe()

    return () => {
      window.removeEventListener('resize', fitStage)
      clearInterval(clockT)
      clearInterval(avisoT)
      canal.unsubscribe()
    }
  }, [])

  const cat = current ? CATS[current.codigo] : null

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: D.bg, position: 'relative', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* Flash de color al cambiar turno */}
      {cat && (
        <div
          key={`flash-${flashKey}`}
          style={{ position: 'fixed', inset: 0, background: cat.color, pointerEvents: 'none', zIndex: 100, animation: 'flashScreen .5s ease-out forwards' }}
        />
      )}

      {/* Stage 1920×1080 */}
      <div
        ref={stageRef}
        style={{ width: 1920, height: 1080, position: 'absolute', top: '50%', left: '50%', transformOrigin: 'center center', background: D.bg, display: 'grid', gridTemplateRows: 'auto 1fr auto' }}
      >

        {/* ── Header — integrado, sin card flotante ────────────── */}
        <header style={{ padding: '0 56px', height: 96, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${D.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <img src="/logocda.png" alt="CDA" style={{ height: 56, width: 'auto', objectFit: 'contain', display: 'block' }} />
            <div style={{ width: 1, height: 40, background: D.border }} />
            <div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-.03em', color: D.txt }}>CDA La Cordialidad</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: D.txt3, letterSpacing: '.18em', textTransform: 'uppercase', marginTop: 3 }}>Centro de Diagnóstico Automotor</div>
            </div>
          </div>

          {/* Reloj 12 h */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 52, fontWeight: 900, fontFamily: 'ui-monospace, monospace', fontVariantNumeric: 'tabular-nums', color: D.txt, lineHeight: 1 }}>{clock.time}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: D.txt3, marginTop: 5 }}>{clock.date}</div>
          </div>
        </header>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 32, padding: '32px 56px', minHeight: 0, background: '#F1F5F9' }}>

          {/* Hero — turno actual */}
          <section
            key={`hero-${heroKey}`}
            style={{ background: D.surf, border: `1px solid ${D.border}`, borderLeft: `8px solid ${cat ? cat.color : D.border}`, borderRadius: 22, padding: '52px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', animation: 'heroIn .60s cubic-bezier(.2,.75,.2,1) both', boxShadow: `0 2px 16px ${D.shadow}`, position: 'relative' }}
          >
            {cat && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cat.color}05 0%, transparent 55%)`, pointerEvents: 'none', borderRadius: 'inherit' }} />}

            <div style={{ position: 'relative' }}>
              {current ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.28em', textTransform: 'uppercase', color: D.txt3 }}>Turno en llamado</div>

                  <div style={{ marginTop: 6, fontSize: 210, lineHeight: .86, fontWeight: 900, color: cat.color, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>
                    {code(current)}
                  </div>

                  <div style={{ marginTop: 22, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 11, padding: '10px 20px', borderRadius: 999, background: cat.color + '10', border: `1.5px solid ${cat.color}30` }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 20, fontWeight: 800, color: cat.color }}>{cat.name}</span>
                  </div>

                  <div style={{ marginTop: 38, height: 1, background: D.border }} />

                  <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr auto', gap: 36, alignItems: 'end' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: D.txt3, marginBottom: 8 }}>Cliente</div>
                      <div style={{ fontSize: 44, fontWeight: 800, color: D.txt, lineHeight: 1.05, letterSpacing: '-.01em' }}>{current.nombre_cliente}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: D.txt3, marginBottom: 8 }}>Placa</div>
                      <div style={{ padding: '10px 22px', borderRadius: 13, background: D.surf2, border: `1.5px solid ${D.border2}`, fontFamily: 'ui-monospace, monospace', fontSize: 36, fontWeight: 800, letterSpacing: '.14em', color: D.txt }}>
                        {current.placa_vehiculo}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16 }}>
                  <div style={{ fontSize: 100, fontWeight: 900, color: D.border, lineHeight: 1 }}>—</div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: D.txt3 }}>Sin turno activo</div>
                </div>
              )}
            </div>
          </section>

          {/* Lista de espera */}
          <aside style={{ background: D.surf, border: `1px solid ${D.border}`, borderRadius: 22, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', boxShadow: `0 2px 16px ${D.shadow}` }}>
            <div style={{ padding: '24px 28px 18px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: D.txt }}>En espera</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: D.txt3, fontVariantNumeric: 'tabular-nums' }}>{waiting.length} turnos</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 14px' }}>
              {waiting.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 20, color: D.txt3, fontWeight: 600 }}>
                  Sin turnos en espera
                </div>
              ) : waiting.map((t, i) => {
                const tc = CATS[t.codigo]
                return (
                  <div key={t.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '15px 14px', borderRadius: 14, borderBottom: i < waiting.length - 1 ? `1px solid ${D.border}` : 'none' }}>
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
        <footer style={{ background: D.surf, borderTop: `2px solid ${D.border}`, height: 62, display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 28px', borderRight: `1px solid ${D.border}`, flexShrink: 0, height: '100%' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', animation: 'blink 1.6s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#F59E0B', whiteSpace: 'nowrap' }}>Aviso</span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' }}>
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
