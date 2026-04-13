import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const STAGES = [
  { id: 'ingest',    label: 'Ingest',          icon: '📥', color: '#22c55e',  detail: 'MQTT messages received from HiveMQ broker and queued for processing' },
  { id: 'validate',  label: 'Validate',        icon: '✅', color: '#10b981',  detail: 'Schema validation against Pydantic models — malformed readings rejected to DLQ' },
  { id: 'transform', label: 'Transform',       icon: '🔄', color: '#06b6d4',  detail: 'Unit normalization, outlier filtering (Z-score), and timestamp alignment' },
  { id: 'feature',   label: 'Feature Eng.',    icon: '🧮', color: '#8b5cf6',  detail: 'Compute ET₀, soil moisture deficit, heat accumulation GDD, NDVI delta' },
  { id: 'inference', label: 'Inference',       icon: '🧠', color: '#ec4899',  detail: 'Parallel RF + SVM + LSTM inference — weighted ensemble vote computed' },
  { id: 'store',     label: 'Store',           icon: '🗄️', color: '#f59e0b',  detail: 'Results persisted to PostgreSQL time-series table and Firebase Realtime DB' },
]

function randCount(base, variance) {
  return Math.round(base + (Math.random() - 0.5) * variance)
}

export default function KafkaMonitor() {
  const [stats, setStats] = useState(() => STAGES.map(s => ({
    throughput: randCount(340, 60),
    latency: randCount(18, 8),
    errors: Math.round(Math.random() * 3),
  })))
  const [active, setActive] = useState(null)

  useEffect(() => {
    const id = setInterval(() => {
      setStats(prev => prev.map(s => ({
        throughput: Math.max(10, s.throughput + randCount(0, 30)),
        latency: Math.max(2, s.latency + randCount(0, 4)),
        errors: Math.random() < 0.1 ? s.errors + 1 : s.errors,
      })))
    }, 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <SectionWrapper id="kafka">
      <SectionTitle
        icon="⚙️"
        title="Kafka-Style Pipeline Monitor"
        subtitle="Real-time visibility into the data ingestion pipeline. Every message flows through 6 processing stages from raw MQTT ingest to ML inference and database storage."
        badge={{ text: 'PIPELINE STAGES', color: 'cyan', dot: true }}
      />

      {/* Pipeline flow */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24, overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 600, gap: 0 }}>
          {STAGES.map((stage, i) => (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {/* Stage node */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => setActive(active === stage.id ? null : stage.id)}
                style={{
                  flex: 1, textAlign: 'center', cursor: 'pointer',
                  padding: '12px 8px',
                  background: active === stage.id ? `${stage.color}18` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active === stage.id ? stage.color + '50' : stage.color + '20'}`,
                  borderRadius: 12,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{stage.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: stage.color }}>{stage.label}</div>
                <div style={{
                  fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 800,
                  color: 'var(--text-primary)', marginTop: 4,
                }}>{stats[i].throughput}/s</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{stats[i].latency}ms</div>
                {stats[i].errors > 0 && (
                  <div style={{
                    marginTop: 4, padding: '1px 6px',
                    background: 'rgba(248,113,113,0.15)', borderRadius: 4,
                    fontSize: 9, color: 'var(--red-400)',
                  }}>
                    {stats[i].errors} err
                  </div>
                )}
              </motion.div>

              {/* Arrow connector */}
              {i < STAGES.length - 1 && (
                <div style={{ padding: '0 4px', flexShrink: 0 }}>
                  <svg width="24" height="16" viewBox="0 0 24 16">
                    <path d="M0 8 L18 8" stroke={STAGES[i].color} strokeWidth="1.5" opacity="0.5" />
                    <path d="M14 4 L20 8 L14 12" stroke={STAGES[i].color} strokeWidth="1.5" fill="none" opacity="0.5" />
                    {/* Animated packet */}
                    <circle r="2.5" fill={STAGES[i].color} opacity="0.9">
                      <animateMotion dur="1.5s" repeatCount="indefinite" path="M0 8 L22 8" />
                    </circle>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage detail */}
      {active && (
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            padding: 20, marginBottom: 20,
            border: `1px solid ${STAGES.find(s => s.id === active)?.color}30`,
          }}
        >
          {(() => {
            const s = STAGES.find(s => s.id === active)
            const si = STAGES.findIndex(s => s.id === active)
            return (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
                    {s.icon} {s.label} Stage
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.detail}</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'Throughput', value: `${stats[si].throughput}/s` },
                    { label: 'Latency',    value: `${stats[si].latency}ms` },
                    { label: 'Errors',     value: stats[si].errors       },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color }}>{value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </motion.div>
      )}

      {/* Stats table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Stage', 'Throughput', 'Latency', 'Errors', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '10px 18px', textAlign: 'left',
                  fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--glass-border)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STAGES.map((stage, i) => (
              <tr key={stage.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '10px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{stage.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: stage.color }}>{stage.label}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 18px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800 }}>
                  {stats[i].throughput}/s
                </td>
                <td style={{ padding: '10px 18px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {stats[i].latency}ms
                </td>
                <td style={{ padding: '10px 18px', fontFamily: 'var(--font-mono)', fontSize: 13, color: stats[i].errors > 0 ? 'var(--red-400)' : 'var(--text-muted)' }}>
                  {stats[i].errors}
                </td>
                <td style={{ padding: '10px 18px' }}>
                  <span className={`badge ${stats[i].errors > 5 ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 9 }}>
                    {stats[i].errors > 5 ? 'DEGRADED' : 'HEALTHY'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  )
}
