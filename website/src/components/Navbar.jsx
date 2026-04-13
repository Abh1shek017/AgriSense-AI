import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { id: 'hero',        label: 'Home' },
  { id: 'sensor',      label: 'Sensor Hub' },
  { id: 'circuit',     label: 'IoT Pipeline' },
  { id: 'ensemble',    label: 'ML Ensemble' },
  { id: 'forecast',    label: 'Forecast' },
  { id: 'dag',         label: 'Workflow' },
  { id: 'fieldmap',    label: 'Field Map' },
  { id: 'mqtt',        label: 'Live Stream' },
  { id: 'anomaly',     label: 'Alerts' },
  { id: 'rotation',    label: 'Rotation' },
  { id: 'irrigation',  label: 'Irrigation' },
  { id: 'kafka',       label: 'Pipeline' },
  { id: 'edge',        label: 'Edge Node' },
  { id: 'rl',          label: 'RL Config' },
]

export default function Navbar({ activeSection }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 'var(--nav-h)',
        zIndex: 1000,
        background: scrolled ? 'rgba(3,10,6,0.92)' : 'rgba(3,10,6,0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(34,197,94,0.1)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--gradient-green)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(34,197,94,0.3)',
            fontSize: 18,
          }}>🌱</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>
              <span className="gradient-text">AgriSense</span>
              <span style={{ color: 'var(--text-secondary)' }}> AI</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
              IoT Crop Intelligence
            </div>
          </div>
        </div>

        {/* Nav Links — desktop */}
        <div style={{
          display: 'flex', gap: 2, flex: 1, justifyContent: 'center',
          overflowX: 'auto', scrollbarWidth: 'none',
        }} className="desktop-nav">
          {NAV_LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              style={{
                padding: '6px 12px',
                background: activeSection === link.id ? 'rgba(34,197,94,0.1)' : 'transparent',
                border: activeSection === link.id ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
                borderRadius: 8,
                color: activeSection === link.id ? 'var(--green-400)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Live badge */}
        <div className="badge badge-green" style={{ flexShrink: 0 }}>
          <span className="pulse-dot" style={{ width: 6, height: 6 }} />
          LIVE
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none', background: 'none', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer', padding: 4,
          }}
          className="mobile-menu-btn"
        >
          <div style={{ width: 20, height: 2, background: 'currentColor', marginBottom: 4 }} />
          <div style={{ width: 20, height: 2, background: 'currentColor', marginBottom: 4 }} />
          <div style={{ width: 20, height: 2, background: 'currentColor' }} />
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'fixed',
              top: 'var(--nav-h)', left: 0, right: 0,
              zIndex: 999,
              background: 'rgba(3,10,6,0.97)',
              borderBottom: '1px solid var(--glass-border)',
              padding: '16px 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >{link.label}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </>
  )
}
