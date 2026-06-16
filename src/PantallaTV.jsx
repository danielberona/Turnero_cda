import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { CATS, AVISOS, codigoDisplay } from './constants'

export default function PantallaTV() {
  const [history,     setHistory]     = useState([])
  const [waitingList, setWaitingList] = useState([])
  const [clock,       setClock]       = useState({ time: '', date: '' })

  const stageRef   = useRef(null)
  const heroRef    = useRef(null)
  const avisoRef   = useRef(null)
  const prevHeroId = useRef(null)

  const fitStage = () => {
    const el = stageRef.current
    if (!el) return
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
    el.style.transform = `scale(${s})`
  }

  const loadData = async () => {
    const [{ data: turnos }, { data: espera }] = await Promise.all([
      supabase.from('turnos').select('*').not('llamado_en', 'is', null)
        .order('llamado_en', { ascending: false }).limit(6),
      supabase.from('turnos').select('*').eq('estado', 'esperando')
        .order('creado_en', { ascending: true }),
    ])
    if (turnos) {
      setHistory(turnos)
      const newId = turnos[0]?.id
      if (newId && newId !== prevHeroId.current) {
        prevHeroId.current = newId
        animateHero()
      }
    }
    if (espera) setWaitingList(espera)
  }

  const animateHero = () => {
    const el = heroRef.current
    if (!el) return
    el.style.transition = 'none'
    el.style.opacity    = '0'
    el.style.transform  = 'translateY(14px) scale(.975)'
    void el.offsetWidth
    el.style.transition = 'opacity .55s cubic-bezier(.2,.75,.2,1), transform .55s cubic-bezier(.2,.75,.2,1)'
    el.style.opacity    = '1'
    el.style.transform  = 'none'
    setTimeout(() => {
      if (!heroRef.current) return
      heroRef.current.style.transition = 'none'
      heroRef.current.style.opacity    = '1'
      heroRef.current.style.transform  = 'none'
    }, 700)
  }

  const animateAviso = (text) => {
    const el = avisoRef.current
    if (!el) return
    el.style.transition = 'none'; el.style.opacity = '0'; el.style.transform = 'translateY(7px)'
    void el.offsetWidth
    el.style.transition = 'opacity .5s ease, transform .5s ease'
    el.style.opacity = '1'; el.style.transform = 'none'
    el.textContent = text
    setTimeout(() => {
      if (!avisoRef.current) return
      avisoRef.current.style.transition = 'none'
      avisoRef.current.style.opacity    = '1'
      avisoRef.current.style.transform  = 'none'
    }, 650)
  }

  const tickClock = () => {
    const now  = new Date()
    const time = now.toLocaleTimeString('es-CO', { hour12: false })
    let   date = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    setClock({ time, date: date.charAt(0).toUpperCase() + date.slice(1) })
  }

  useEffect(() => {
    fitStage()
    window.addEventListener('resize', fitStage)
    loadData(); tickClock()
    const clockT = setInterval(tickClock, 1000)
    let ai = 0
    const avisoT = setInterval(() => { ai = (ai + 1) % AVISOS.length; animateAviso(AVISOS[ai]) }, 7000)
    const canal  = supabase.channel('tv-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, loadData)
      .subscribe()
    return () => { window.removeEventListener('resize', fitStage); clearInterval(clockT); clearInterval(avisoT); canal.unsubscribe() }
  }, [])

  const cur    = history[0]
  const curCat = cur ? CATS[cur.codigo] : null

  // Paleta — sin azul, amarillo intenso
  const BG      = '#FEF08A'   // fondo amarillo medio
  const HEADER  = '#F8DE22'   // barra superior amarillo fuerte
  const FOOTER  = '#EAB308'   // barra inferior amarillo oscuro
  const CARD    = '#FFFFFF'
  const BORDER  = '#FDE68A'   // borde amarillo suave

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div ref={stageRef} style={{ width: 1920, height: 1080, flexShrink: 0, transformOrigin: 'center', background: BG, padding: '40px 56px 44px', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 32 }}>

        {/* ── Header amarillo ───────────────────────────── */}
        <header style={{ background: HEADER, borderRadius: 22, padding: '26px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(202,138,4,.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.10)' }}>
              <img src="/logocda.png" alt="CDA La Cordialidad" style={{ height: 54, width: 'auto', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: '#1A1200', letterSpacing: '-.01em' }}>CDA La Cordialidad</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#78550A', letterSpacing: '.16em', textTransform: 'uppercase' }}>Centro de Diagnóstico Automotor</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: '#1A1200', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '.01em' }}>{clock.time}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#78550A' }}>{clock.date}</span>
          </div>
        </header>

        {/* ── Main ─────────────────────────────────────── */}
        <main style={{ display: 'grid', gridTemplateColumns: '1.42fr 1fr', gap: 32, minHeight: 0 }}>

          {/* Hero — turno en llamado */}
          <section ref={heroRef} style={{ position: 'relative', overflow: 'hidden', background: CARD, border: `1px solid ${BORDER}`, boxShadow: '0 2px 16px rgba(0,0,0,.06)', borderRadius: 28, padding: '56px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {cur ? (
              <>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: curCat.color }} />
                <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '.22em', color: '#94A3B8', textTransform: 'uppercase' }}>Turno en llamado</div>
                <div style={{ marginTop: 6, fontSize: 200, lineHeight: .86, fontWeight: 800, color: curCat.color, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {codigoDisplay(cur)}
                </div>
                <div style={{ marginTop: 30, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 999, background: curCat.color + '18', border: `1px solid ${curCat.color}40` }}>
                  <span style={{ width: 13, height: 13, borderRadius: 4, background: curCat.color }} />
                  <span style={{ fontSize: 24, fontWeight: 700, color: curCat.color }}>{cur.categoria}</span>
                </div>
                <div style={{ marginTop: 40, height: 1, background: BORDER }} />
                <div style={{ marginTop: 32, display: 'flex', gap: 64, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#94A3B8' }}>Cliente</span>
                    <span style={{ fontSize: 40, fontWeight: 700, color: '#1E293B', lineHeight: 1 }}>{cur.nombre_cliente}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#94A3B8' }}>Placa</span>
                    <span style={{ alignSelf: 'flex-start', padding: '8px 20px', borderRadius: 12, background: '#F8F6F0', border: `1px solid ${BORDER}`, fontFamily: 'ui-monospace, monospace', fontSize: 34, fontWeight: 700, letterSpacing: '.1em', color: '#1E293B' }}>
                      {cur.placa_vehiculo}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: 0.3 }}>
                <div style={{ fontSize: 110, fontWeight: 800, color: '#94A3B8', lineHeight: 1 }}>—</div>
                <div style={{ fontSize: 30, fontWeight: 600, color: '#94A3B8' }}>Sin turno activo</div>
              </div>
            )}
          </section>

          {/* Cola en espera */}
          <aside style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: '0 2px 16px rgba(0,0,0,.06)', borderRadius: 28, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ padding: '26px 32px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#1E293B' }}>En espera</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#94A3B8' }}>{waitingList.length} turnos</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 18px' }}>
              {waitingList.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 22, color: '#94A3B8', fontWeight: 600 }}>
                  Sin turnos en espera
                </div>
              ) : waitingList.map(t => {
                const cat = CATS[t.codigo]
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 14px', borderRadius: 16, borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ width: 7, height: 50, borderRadius: 99, background: cat.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 36, fontWeight: 800, color: cat.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', minWidth: 106, flexShrink: 0 }}>
                      {codigoDisplay(t)}
                    </span>
                    <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.nombre_cliente}
                      </span>
                      <span style={{ fontSize: 18, fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '.1em', color: '#475569', background: '#F8F6F0', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '2px 10px', alignSelf: 'flex-start' }}>
                        {t.placa_vehiculo}
                      </span>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 999, background: cat.color + '18', border: `1px solid ${cat.color}40` }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 15, fontWeight: 700, color: cat.color, whiteSpace: 'nowrap' }}>{cat.short}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>
        </main>

        {/* ── Footer / Avisos ──────────────────────────── */}
        <footer style={{ background: FOOTER, borderRadius: 18, padding: '22px 36px', display: 'flex', alignItems: 'center', gap: 26, boxShadow: '0 2px 12px rgba(202,138,4,.25)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderRadius: 999, background: 'rgba(255,255,255,.25)', border: '1px solid rgba(255,255,255,.50)', flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A1200', animation: 'blink 1.6s ease-in-out infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#1A1200' }}>Aviso</span>
          </span>
          <span ref={avisoRef} style={{ fontSize: 25, fontWeight: 600, color: '#1A1200' }}>{AVISOS[0]}</span>
        </footer>

      </div>
    </div>
  )
}
