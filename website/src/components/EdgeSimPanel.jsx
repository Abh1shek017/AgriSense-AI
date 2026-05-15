import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const EDGE_METRICS = [
  { label: 'CPU Usage',     unit: '%',     base: 22, variance: 8,  color: '#22c55e',  warn: 85 },
  { label: 'Free Heap',     unit: 'KB',    base: 312, variance: 20, color: '#06b6d4', warn: 50 },
  { label: 'Internal Temp', unit: '°C',    base: 42, variance: 4,  color: '#f59e0b',   warn: 70  },
  { label: 'WiFi Signal',   unit: 'dBm',   base: -55, variance: 10, color: '#8b5cf6', warn: -85 },
  { label: 'MQTT Latency',  unit: 'ms',    base: 45, variance: 15, color: '#ec4899',   warn: 150 },
  { label: 'Dropped Pkts',  unit: '/min',  base: 0.1, variance: 0.2, color: '#f87171',warn: 2  },
]

const TWO_STAGE = [
  { icon: '📟', label: 'Edge Node', sub: 'ESP32-WROOM-32', color: '#3b82f6', desc: 'Low-power sensing · Kalman smoothing · Message compression · MQTT publish' },
  { icon: '☁️', label: 'Cloud API', sub: 'FastAPI on Cloud Run', color: '#8b5cf6', desc: 'Full feature engineering · ML ensemble · Database write · WebSocket push' },
]

export default function EdgeSimPanel() {
  const [metrics, setMetrics] = useState(() => EDGE_METRICS.map(m => m.base))
  const [faultActive, setFaultActive] = useState(false)
  const [stage, setStage] = useState('edge')

  useEffect(() => {
    const id = setInterval(() => {
      setMetrics(prev => EDGE_METRICS.map((m, i) => {
        const base = faultActive && i === 0 ? m.warn * 0.95 : m.base
        return Math.max(0, base + (Math.random() - 0.5) * m.variance)
      }))
    }, 800)
    return () => clearInterval(id)
  }, [faultActive])

  return (
    <SectionWrapper id="edge">
      <SectionTitle
        icon="📟"
        title="Edge Node Simulation Panel"
        subtitle="Two-stage processing: ESP32 edge node handles sensor acquisition and basic filtering before publishing to the cloud. Simulates power-efficient IoT logic."
        badge={{ text: 'ESP32 EDGE DEMO', color: 'blue' }}
      />

      {/* Two-stage diagram */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {TWO_STAGE.map((s, i) => (
          <motion.div
            key={s.label}
            onClick={() => setStage(i === 0 ? 'edge' : 'cloud')}
            whileHover={{ scale: 1.02 }}
            className="glass-card"
            style={{
              padding: 24, cursor: 'pointer',
              border: `1px solid ${(stage === 'edge' && i === 0) || (stage === 'cloud' && i === 1) ? s.color + '60' : s.color + '20'}`,
              background: (stage === 'edge' && i === 0) || (stage === 'cloud' && i === 1) ? `${s.color}08` : 'var(--glass-bg)',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{s.sub}</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.desc}</p>
            {i === 0 && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
              }}>
                <span className={`badge ${faultActive ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 9 }}>
                  {faultActive ? 'FAULT' : 'OK'}
                </span>
              </div>
            )}
          </motion.div>
        ))}

        {/* Arrow between */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gridColumn: 'span 1',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>MQTT + TLS</div>
            <div style={{ fontSize: 24 }}>→</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>8883</div>
          </div>
        </div>
      </div>

      {/* Edge metrics */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>ESP32-WROOM-32 — Live Metrics</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFaultActive(f => !f)}
              className={faultActive ? 'btn-primary' : 'btn-ghost'}
              style={{
                padding: '6px 14px', fontSize: 11,
                background: faultActive ? 'rgba(248,113,113,0.2)' : undefined,
              }}
            >
              {faultActive ? '🔴 Fault Active' : '⚡ Inject Fault'}
            </button>
            {faultActive && (
              <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 11 }}
                onClick={() => setFaultActive(false)}>
                🔄 Reset
              </button>
            )}
          </div>
        </div>

        <div className="grid-3" style={{ gap: 14 }}>
          {EDGE_METRICS.map((m, i) => {
            const val = metrics[i]
            const pct = Math.min((val / m.warn) * 100, 100)
            const isWarn = m.label === 'WiFi Signal' ? val < m.warn : val > m.warn * 0.8
            const barColor = isWarn ? 'var(--red-400)' : m.color
            return (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</span>
                  <span style={{
                    fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 800,
                    color: isWarn ? 'var(--red-400)' : m.color,
                  }}>
                    {val.toFixed(val < 10 ? 1 : 0)} {m.unit}
                  </span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                    style={{
                      height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, ${barColor}, ${barColor}90)`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Fallback logic */}
      {faultActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card"
          style={{
            padding: '16px 20px',
            border: '1px solid rgba(248,113,113,0.3)',
            background: 'rgba(248,113,113,0.05)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red-400)', marginBottom: 6 }}>
            🚨 Fault Detected — Fallback Logic Activated
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            ESP32 core thermal threshold exceeded. System switched to direct cloud bypass — skipping local filters.
            Cloud API will handle raw sensor validation. Alert sent to anomaly feed. Deep-sleep cycles suspended.
          </p>
        </motion.div>
      )}
    </SectionWrapper>
  )
}
