import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { CATS, AVISOS, codigoDisplay } from './constants'

export default function PantallaTV() {
  const [history, setHistory]       = useState([])
  const [waitingList, setWaitingList] = useState([])
  const [avisoIdx, setAvisoIdx]     = useState(0)
  const [clock, setClock]           = useState({ time: '', date: '' })

  const stageRef    = useRef(null)
  const heroRef     = useRef(null)
  const avisoRef    = useRef(null)
  const prevHeroId  = useRef(null)

  // ── Scale 1920×1080 stage to fill the viewport ─────────────
  const fitStage = () => {
    const el = stageRef.current
    if (!el) return
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
    el.style.transform = `scale(${s})`
  }

  // ── Load data from Supabase ─────────────────────────────────
  const loadData = async () => {
    const [{ data: turnos }, { data: espera }] = await Promise.all([
      supabase
        .from('turnos')
        .select('*')
        .not('llamado_en', 'is', null)
        .order('llamado_en', { ascending: false })
        .limit(6),
      supabase
        .from('turnos')
        .select('*')
        .eq('estado', 'esperando')
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

  // ── Animations (imperative, same logic as prototype) ────────
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
    el.style.transition = 'none'
    el.style.opacity    = '0'
    el.style.transform  = 'translateY(7px)'
    void el.offsetWidth
    el.style.transition = 'opacity .5s ease, transform .5s ease'
    el.style.opacity    = '1'
    el.style.transform  = 'none'
    el.textContent      = text
    setTimeout(() => {
      if (!avisoRef.current) return
      avisoRef.current.style.transition = 'none'
      avisoRef.current.style.opacity    = '1'
      avisoRef.current.style.transform  = 'none'
    }, 650)
  }

  const tickClock = () => {
    const now = new Date()
    const time = now.toLocaleTimeString('es-CO', { hour12: false })
    let   date = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    date = date.charAt(0).toUpperCase() + date.slice(1)
    setClock({ time, date })
  }

  useEffect(() => {
    fitStage()
    window.addEventListener('resize', fitStage)

    loadData()
    tickClock()

    const clockT  = setInterval(tickClock, 1000)
    let curAvisoIdx = 0
    const avisoT  = setInterval(() => {
      curAvisoIdx = (curAvisoIdx + 1) % AVISOS.length
      setAvisoIdx(curAvisoIdx)
      animateAviso(AVISOS[curAvisoIdx])
    }, 7000)

    const canal = supabase
      .channel('tv-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, loadData)
      .subscribe()

    return () => {
      window.removeEventListener('resize', fitStage)
      clearInterval(clockT)
      clearInterval(avisoT)
      canal.unsubscribe()
    }
  }, [])

  const cur    = history[0]
  const curCat = cur ? CATS[cur.codigo] : null

  // ── Styles ──────────────────────────────────────────────────
  const S = {
    root:  { width: '100vw', height: '100vh', overflow: 'hidden', background: '#EEF1F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },
    stage: { width: 1920, height: 1080, flexShrink: 0, transformOrigin: 'center', background: '#EEF1F6', padding: '56px 56px 48px', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 36 },
    card:  { background: '#FFFFFF', border: '1px solid #E7EBF2', boxShadow: '0 4px 18px rgba(16,24,40,.06)' },
  }

  return (
    <div style={S.root}>
      <div ref={stageRef} style={S.stage}>

        {/* ── Header ────────────────────────────────────────── */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <img src="/logocda.png" alt="CDA La Cordialidad" style={{ height: 66, width: 'auto', objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 27, fontWeight: 800, color: '#0F172A', letterSpacing: '-.01em' }}>CDA La Cordialidad</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#7A8696', letterSpacing: '.16em', textTransform: 'uppercase' }}>Centro de Diagnóstico Automotor</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 46, fontWeight: 800, color: '#0F172A', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '.01em' }}>{clock.time}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#8A94A3' }}>{clock.date}</span>
          </div>
        </header>

        {/* ── Main ──────────────────────────────────────────── */}
        <main style={{ display: 'grid', gridTemplateColumns: '1.42fr 1fr', gap: 40, minHeight: 0 }}>

          {/* Hero — turno en llamado */}
          <section ref={heroRef} style={{ ...S.card, position: 'relative', overflow: 'hidden', borderRadius: 34, padding: '60px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {cur ? (
              <>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: curCat.color }} />
                <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '.24em', color: '#8A94A3', textTransform: 'uppercase' }}>Turno en llamado</div>
                <div style={{ marginTop: 6, fontSize: 208, lineHeight: .86, fontWeight: 800, color: curCat.color, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {codigoDisplay(cur)}
                </div>
                <div style={{ marginTop: 34, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 13, padding: '13px 24px', borderRadius: 999, background: curCat.color + '1A', border: `1px solid ${curCat.color}40` }}>
                  <span style={{ width: 15, height: 15, borderRadius: 5, background: curCat.color }} />
                  <span style={{ fontSize: 25, fontWeight: 700, color: curCat.color }}>{cur.categoria}</span>
                </div>
                <div style={{ marginTop: 46, height: 1, background: '#E7EBF2' }} />
                <div style={{ marginTop: 34, display: 'flex', gap: 72, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A94A3' }}>Cliente</span>
                    <span style={{ fontSize: 42, fontWeight: 700, color: '#1A2230', lineHeight: 1 }}>{cur.nombre_cliente}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A94A3' }}>Placa</span>
                    <span style={{ alignSelf: 'flex-start', padding: '9px 20px', borderRadius: 13, background: '#F1F3F7', border: '1px solid #DDE3EC', fontFamily: 'ui-monospace, monospace', fontSize: 36, fontWeight: 700, letterSpacing: '.1em', color: '#1A2230' }}>
                      {cur.placa_vehiculo}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: 0.35 }}>
                <div style={{ fontSize: 120, fontWeight: 800, color: '#8A94A3', lineHeight: 1 }}>—</div>
                <div style={{ fontSize: 32, fontWeight: 600, color: '#8A94A3' }}>Sin turno activo</div>
              </div>
            )}
          </section>

          {/* Cola en espera — ocupa todo el lado derecho */}
          <aside style={{ ...S.card, borderRadius: 28, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

            {/* Encabezado */}
            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #EFF1F5', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#1A2230' }}>En espera</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#8A94A3' }}>{waitingList.length} turnos</span>
            </div>

            {/* Lista scrolleable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
              {waitingList.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 22, color: '#8A94A3', fontWeight: 600 }}>
                  Sin turnos en espera
                </div>
              ) : waitingList.map(t => {
                const cat = CATS[t.codigo]
                return (
                  <div
                    key={t.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 16px', borderRadius: 18, borderBottom: '1px solid #F0F2F6' }}
                  >
                    {/* Barra de color de categoría */}
                    <div style={{ width: 8, height: 52, borderRadius: 99, background: cat.color, flexShrink: 0 }} />

                    {/* Código del turno */}
                    <span style={{ fontSize: 38, fontWeight: 800, color: cat.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', minWidth: 110, flexShrink: 0 }}>
                      {codigoDisplay(t)}
                    </span>

                    {/* Nombre y placa */}
                    <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span style={{ fontSize: 24, fontWeight: 700, color: '#1A2230', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.nombre_cliente}
                      </span>
                      <span style={{ fontSize: 20, fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '.1em', color: '#5A6475', background: '#F1F3F7', border: '1px solid #DDE3EC', borderRadius: 8, padding: '3px 12px', alignSelf: 'flex-start' }}>
                        {t.placa_vehiculo}
                      </span>
                    </div>

                    {/* Pill de categoría */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: cat.color + '18', border: `1px solid ${cat.color}40` }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 16, fontWeight: 700, color: cat.color, whiteSpace: 'nowrap' }}>{cat.short}</span>
                    </div>
                  </div>
                )
              })}
            </div>

          </aside>
        </main>

        {/* ── Footer / Avisos ───────────────────────────────── */}
        <footer style={{ ...S.card, borderRadius: 22, padding: '26px 38px', display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11, padding: '10px 18px', borderRadius: 999, background: 'rgba(59,130,246,.10)', border: '1px solid rgba(59,130,246,.28)', flexShrink: 0 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3B82F6', animation: 'blink 1.6s ease-in-out infinite' }} />
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#2563EB' }}>Aviso</span>
          </span>
          <span ref={avisoRef} style={{ fontSize: 27, fontWeight: 500, color: '#46505F' }}>{AVISOS[0]}</span>
        </footer>

      </div>
    </div>
  )
}
