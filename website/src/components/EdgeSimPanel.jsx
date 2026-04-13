import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const EDGE_METRICS = [
  { label: 'CPU Usage',     unit: '%',     base: 34, variance: 12, color: '#22c55e',  warn: 80 },
  { label: 'RAM Used',      unit: 'MB',    base: 312, variance: 40, color: '#06b6d4', warn: 500 },
  { label: 'Temp (SoC)',    unit: '°C',    base: 52, variance: 6, color: '#f59e0b',   warn: 75  },
  { label: 'Disk I/O',      unit: 'KB/s',  base: 240, variance: 80, color: '#8b5cf6', warn: 900 },
  { label: 'MQTT Latency',  unit: 'ms',    base: 22, variance: 8, color: '#ec4899',   warn: 100 },
  { label: 'Dropped Pkts',  unit: '/min',  base: 0.4, variance: 0.5, color: '#f87171',warn: 5  },
]

const TWO_STAGE = [
  { icon: '🖥️', label: 'Edge Node', sub: 'Raspberry Pi 4B', color: '#3b82f6', desc: 'Local outlier filter · Kalman smoothing · Compression · TLS publish' },
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
        icon="🖥️"
        title="Edge Node Simulation Panel"
        subtitle="Two-stage processing: Raspberry Pi edge node handles local filtering and compression before publishing to the cloud API. Simulates real IoT edge computing behaviour."
        badge={{ text: 'EDGE COMPUTING DEMO', color: 'blue' }}
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
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>Raspberry Pi 4B — Live Metrics</h3>
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
            const isWarn = val > m.warn * 0.8
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
            Edge node CPU exceeded threshold. System switched to direct cloud pubish mode — skipping local filtering.
            Cloud API will handle validation. Alert sent to anomaly feed. Heartbeat monitor engaged.
          </p>
        </motion.div>
      )}
    </SectionWrapper>
  )
}
