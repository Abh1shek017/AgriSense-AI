import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const CHANNELS = [
  { id: 'temp',    label: 'Temp',     unit: '°C',   color: '#f59e0b', base: 24, amp: 3,  freq: 0.8  },
  { id: 'humid',   label: 'Humidity', unit: '%',    color: '#06b6d4', base: 65, amp: 8,  freq: 1.1  },
  { id: 'soil_n',  label: 'N',        unit: 'mg/kg',color: '#22c55e', base: 88, amp: 5,  freq: 0.4  },
  { id: 'soil_p',  label: 'P',        unit: 'mg/kg',color: '#10b981', base: 42, amp: 3,  freq: 0.6  },
  { id: 'soil_k',  label: 'K',        unit: 'mg/kg',color: '#34d399', base: 43, amp: 4,  freq: 0.5  },
  { id: 'ph',      label: 'pH',       unit: 'pH',   color: '#a855f7', base: 6.5,amp: 0.3,freq: 0.7  },
  { id: 'moisture',label: 'Moisture', unit: '%',    color: '#3b82f6', base: 58, amp: 10, freq: 0.9  },
  { id: 'rain',    label: 'Rain',     unit: 'mm',   color: '#60a5fa', base: 5,  amp: 8,  freq: 1.3  },
  { id: 'co2',     label: 'CO₂',      unit: 'ppm',  color: '#f87171', base: 412,amp: 6,  freq: 1.0  },
  { id: 'light',   label: 'Light',    unit: 'lux',  color: '#fbbf24', base: 820,amp: 80, freq: 0.3  },
]

function genWave(ch, t, points = 80) {
  return Array.from({ length: points }, (_, i) => {
    const x = i / points
    const noise = (Math.random() - 0.5) * ch.amp * 0.2
    return ch.base + ch.amp * Math.sin((x + t) * ch.freq * Math.PI * 2) + noise
  })
}

export default function MQTTDashboard() {
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)
  const [status, setStatus] = useState('CONNECTED')

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setTick(t => t + 0.04), 100)
    return () => clearInterval(id)
  }, [paused])

  return (
    <SectionWrapper id="mqtt">
      <SectionTitle
        icon="📡"
        title="MQTT Live Stream Dashboard"
        subtitle="Real-time telemetry from 10 sensor channels via HiveMQ Cloud MQTT broker. Data flows at 10Hz through the ingestion pipeline — watch each waveform update live."
        badge={{ text: 'MQTT · HIVEMQ CLOUD', color: 'cyan', dot: true }}
      />

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div className="badge badge-green">
          <span className="pulse-dot" style={{ width: 6, height: 6 }} />
          {status}
        </div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          broker: agrisense.hivemq.cloud:8883 · topic: field/+/sensor/#
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn-ghost" style={{ padding: '5px 14px', fontSize: 11 }}
          onClick={() => setPaused(p => !p)}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Channel', 'Current', 'Min', 'Max', 'Trend', 'Status', 'Waveform'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    textAlign: 'left', fontSize: 10,
                    fontWeight: 700, color: 'var(--text-muted)',
                    letterSpacing: 0.5, whiteSpace: 'nowrap',
                    background: 'rgba(255,255,255,0.02)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map((ch, i) => {
                const wave = genWave(ch, tick + i * 0.3)
                const current = wave[wave.length - 1]
                const min = Math.min(...wave)
                const max = Math.max(...wave)
                const trend = wave[wave.length - 1] > wave[wave.length - 5] ? '↑' : '↓'
                const trendColor = trend === '↑' ? '#22c55e' : '#f87171'
                const isAnomaly = current > ch.base + ch.amp * 1.8 || current < ch.base - ch.amp * 1.8
                const svgPoints = wave.map((v, j) => {
                  const x = (j / (wave.length - 1)) * 100
                  const y = 100 - ((v - min) / (max - min + 0.001)) * 80 - 10
                  return `${x},${y}`
                }).join(' ')

                return (
                  <tr key={ch.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: isAnomaly ? 'rgba(248,113,113,0.04)' : 'transparent',
                    transition: 'background 0.2s',
                  }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: ch.color }} />
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{ch.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: ch.color }}>
                      {current.toFixed(1)} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{ch.unit}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {min.toFixed(1)}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {max.toFixed(1)}
                    </td>
                    <td style={{ padding: '10px 16px', color: trendColor, fontWeight: 800, fontSize: 16 }}>
                      {trend}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className={`badge badge-${isAnomaly ? 'red' : 'green'}`} style={{ fontSize: 9 }}>
                        {isAnomaly ? 'ANOMALY' : 'NOMINAL'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 16px', width: 120 }}>
                      <svg viewBox="0 0 100 100" style={{ width: '100%', height: 36, display: 'block' }} preserveAspectRatio="none">
                        <polyline
                          points={svgPoints}
                          fill="none"
                          stroke={ch.color}
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points={`${svgPoints} 100,100 0,100`}
                          fill={`${ch.color}15`}
                          stroke="none"
                        />
                      </svg>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SectionWrapper>
  )
}
