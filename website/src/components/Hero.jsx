import { motion } from 'framer-motion'
import SectionWrapper from './SectionWrapper'

const STATS = [
  { value: '99.2%', label: 'Prediction Accuracy' },
  { value: '3', label: 'ML Models Ensemble' },
  { value: '8', label: 'Sensor Inputs' },
  { value: '<120ms', label: 'Inference Latency' },
]

export default function Hero() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="hero" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: 'var(--nav-h)',
    }}>
      {/* Ambient glow orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ padding: '80px 24px', position: 'relative' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 60,
          alignItems: 'center',
        }}>
          {/* Left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="badge badge-green" style={{ marginBottom: 24 }}>
                <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                IoT · ML · Geospatial Intelligence
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}
            >
              Smart Crop<br />
              <span className="gradient-text">Prediction</span><br />
              Powered by IoT
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.75, marginBottom: 32, maxWidth: 500 }}
            >
              AgriSense AI fuses real-time IoT sensor data from ESP32/Raspberry Pi nodes
              with NASA POWER, SoilGrids, and Open-Meteo APIs — feeding a 3-model ML ensemble
              (Random Forest + SVM + LSTM) for precision crop recommendations with geospatial field intelligence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
            >
              <button className="btn-primary" onClick={() => scrollTo('sensor')}>
                🚀 Open Dashboard
              </button>
              <button className="btn-ghost" onClick={() => scrollTo('circuit')}>
                🔌 View IoT Pipeline
              </button>
            </motion.div>

            {/* Tech stack pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 32 }}
            >
              {['FastAPI', 'React', 'MQTT', 'PyTorch', 'Leaflet', 'Three.js', 'D3.js'].map(t => (
                <span key={t} style={{
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}>
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — stats grid + rotating orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* Main orb */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: 420,
              margin: '0 auto 32px',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Outer ring */}
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: 'absolute',
                  inset: `${i * 15}%`,
                  borderRadius: '50%',
                  border: `1px solid rgba(34,197,94,${0.3 - i * 0.08})`,
                  animation: `spin ${8 + i * 4}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
                }} />
              ))}

              {/* Center orb */}
              <div style={{
                width: '45%', height: '45%',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(34,197,94,0.7), rgba(21,128,61,0.9))',
                boxShadow: '0 0 60px rgba(34,197,94,0.4), inset 0 0 30px rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                animation: 'float 4s ease-in-out infinite',
              }}>
                🌱
              </div>

              {/* Orbiting nodes */}
              {[
                { icon: '📡', angle: 0, color: 'var(--cyan-400)' },
                { icon: '🧠', angle: 90, color: 'var(--purple-400)' },
                { icon: '🌡️', angle: 180, color: 'var(--amber-400)' },
                { icon: '💧', angle: 270, color: 'var(--blue-400)' },
              ].map(({ icon, angle, color }) => {
                const rad = (angle - 90) * Math.PI / 180
                const r = 41 // % from center
                const x = 50 + r * Math.cos(rad)
                const y = 50 + r * Math.sin(rad)
                return (
                  <div key={angle} style={{
                    position: 'absolute',
                    left: `${x}%`, top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 40, height: 40,
                    borderRadius: '50%',
                    background: 'var(--bg-card)',
                    border: `1px solid ${color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                    boxShadow: `0 0 15px ${color}30`,
                    animation: 'float 3s ease-in-out infinite',
                    animationDelay: `${angle / 90 * 0.5}s`,
                  }}>
                    {icon}
                  </div>
                )
              })}
            </div>

            {/* Stats */}
            <div className="grid-2" style={{ gap: 12 }}>
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="glass-card"
                  style={{ padding: '16px 20px', textAlign: 'center' }}
                >
                  <div className="stat-number" style={{ fontSize: '1.8rem' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            position: 'absolute',
            bottom: -48, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>
            Scroll to explore
          </span>
          <div style={{
            width: 1, height: 40,
            background: 'linear-gradient(to bottom, var(--green-400), transparent)',
            animation: 'float 2s ease-in-out infinite',
          }} />
        </motion.div>
      </div>
    </section>
  )
}
