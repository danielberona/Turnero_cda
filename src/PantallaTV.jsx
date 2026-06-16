import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { CATS, AVISOS, codigoDisplay } from './constants'

// ── Paleta sin azul, base blanca, amarillo como acento de marca ──────────────
const P = {
  bg:       '#FEFCE8',           // amarillo-50 muy suave — casi blanco
  header:   '#F8DE22',           // amarillo de marca (del logo)
  footer:   '#EAB308',           // ámbar oscuro para la barra de avisos
  card:     '#FFFFFF',
  border:   '#FDE68A',           // amarillo-200 para bordes cálidos
  shadow:   'rgba(161,98,7,.09)',// sombra teñida en ámbar, no gris
  txt:      '#1C1000',           // casi-negro cálido — sin azul
  txt2:     '#78550A',           // ámbar oscuro para texto secundario
  txt3:     '#A37A00',           // dorado suave para texto terciario
}

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
    return () => {
      window.removeEventListener('resize', fitStage)
      clearInterval(clockT); clearInterval(avisoT); canal.unsubscribe()
    }
  }, [])

  const cur    = history[0]
  const curCat = cur ? CATS[cur.codigo] : null

  const card = (extra = {}) => ({
    background: P.card,
    border: `1px solid ${P.border}`,
    boxShadow: `0 2px 8px ${P.shadow}, 0 8px 24px ${P.shadow}`,
    ...extra,
  })

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div ref={stageRef} style={{ width: 1920, height: 1080, flexShrink: 0, transformOrigin: 'center', background: P.bg, padding: '40px 52px 44px', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 30 }}>

        {/* ── Header de marca ──────────────────────────── */}
        <header style={{ background: P.header, borderRadius: 20, padding: '22px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 4px 20px rgba(202,138,4,.20)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ background: P.card, borderRadius: 12, padding: '5px 9px', boxShadow: '0 1px 6px rgba(0,0,0,.12)' }}>
              <img src="/logocda.png" alt="CDA La Cordialidad" style={{ height: 52, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: P.txt, letterSpacing: '-.02em', lineHeight: 1.1 }}>CDA La Cordialidad</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: P.txt2, letterSpacing: '.18em', textTransform: 'uppercase', marginTop: 3 }}>Centro de Diagnóstico Automotor</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 46, fontWeight: 800, color: P.txt, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{clock.time}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: P.txt2, marginTop: 4 }}>{clock.date}</div>
          </div>
        </header>

        {/* ── Main ─────────────────────────────────────── */}
        <main style={{ display: 'grid', gridTemplateColumns: '1.42fr 1fr', gap: 28, minHeight: 0 }}>

          {/* Hero */}
          <section ref={heroRef} style={{ ...card({ borderRadius: 26, borderLeft: `8px solid ${cur ? curCat.color : P.border}`, padding: '54px 58px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }) }}>
            {cur ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '.22em', color: P.txt3, textTransform: 'uppercase' }}>Turno en llamado</div>
                <div style={{ marginTop: 4, fontSize: 200, lineHeight: .86, fontWeight: 800, color: curCat.color, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {codigoDisplay(cur)}
                </div>
                <div style={{ marginTop: 28, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 11, padding: '11px 20px', borderRadius: 999, background: curCat.color + '18', border: `1.5px solid ${curCat.color}50` }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: curCat.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 23, fontWeight: 700, color: curCat.color }}>{cur.categoria}</span>
                </div>
                <div style={{ marginTop: 40, height: 1, background: P.border }} />
                <div style={{ marginTop: 30, display: 'flex', gap: 60, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: P.txt3 }}>Cliente</span>
                    <span style={{ fontSize: 38, fontWeight: 700, color: P.txt, lineHeight: 1.05 }}>{cur.nombre_cliente}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: P.txt3 }}>Placa</span>
                    <span style={{ alignSelf: 'flex-start', padding: '8px 18px', borderRadius: 11, background: P.bg, border: `1.5px solid ${P.border}`, fontFamily: 'ui-monospace, monospace', fontSize: 32, fontWeight: 700, letterSpacing: '.1em', color: P.txt }}>
                      {cur.placa_vehiculo}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: 0.3 }}>
                <div style={{ fontSize: 110, fontWeight: 800, color: P.txt3, lineHeight: 1 }}>—</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: P.txt3 }}>Sin turno activo</div>
              </div>
            )}
          </section>

          {/* Cola en espera */}
          <aside style={{ ...card({ borderRadius: 26 }), display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 30px 16px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: P.txt }}>En espera</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: P.txt3 }}>{waitingList.length} turnos</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 16px' }}>
              {waitingList.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 20, color: P.txt3, fontWeight: 600 }}>
                  Sin turnos en espera
                </div>
              ) : waitingList.map(t => {
                const cat = CATS[t.codigo]
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 12px', borderRadius: 14, borderBottom: `1px solid ${P.border}` }}>
                    <div style={{ width: 6, height: 48, borderRadius: 99, background: cat.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 34, fontWeight: 800, color: cat.color, fontVariantNumeric: 'tabular-nums', minWidth: 100, flexShrink: 0 }}>
                      {codigoDisplay(t)}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 21, fontWeight: 700, color: P.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre_cliente}</div>
                      <div style={{ fontSize: 16, fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '.09em', color: P.txt2, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 7, padding: '2px 9px', marginTop: 4, display: 'inline-block' }}>
                        {t.placa_vehiculo}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: cat.color + '18', border: `1.5px solid ${cat.color}40` }}>
                      <span style={{ width: 8, height: 8, borderRadius: 3, background: cat.color }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: cat.color }}>{cat.short}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>
        </main>

        {/* ── Barra de avisos ───────────────────────────── */}
        <footer style={{ background: P.footer, borderRadius: 16, padding: '20px 34px', display: 'flex', alignItems: 'center', gap: 24, boxShadow: `0 4px 16px rgba(161,98,7,.22)` }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,.22)', border: '1.5px solid rgba(255,255,255,.45)', flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: P.txt, animation: 'blink 1.6s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: P.txt }}>Aviso</span>
          </span>
          <span ref={avisoRef} style={{ fontSize: 24, fontWeight: 600, color: P.txt }}>{AVISOS[0]}</span>
        </footer>

      </div>
    </div>
  )
}
