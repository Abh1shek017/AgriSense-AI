import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const NODES = [
  { id: 'temp',   x: 60,  y: 100, label: 'Temp Sensor',   icon: '🌡️', color: '#f59e0b' },
  { id: 'soil',   x: 60,  y: 200, label: 'Soil EC',       icon: '🌱', color: '#22c55e' },
  { id: 'humid',  x: 60,  y: 300, label: 'Humidity',      icon: '💧', color: '#06b6d4' },
  { id: 'light',  x: 60,  y: 400, label: 'Light/NDVI',    icon: '☀️', color: '#a855f7' },
  { id: 'mcu',    x: 260, y: 250, label: 'ESP32 MCU',     icon: '⚙️', color: '#10b981' },
  { id: 'edge',   x: 460, y: 250, label: 'Raspberry Pi\nEdge Node', icon: '🖥️', color: '#3b82f6' },
  { id: 'cloud',  x: 660, y: 250, label: 'FastAPI\nCloud', icon: '☁️', color: '#8b5cf6' },
  { id: 'ml',     x: 860, y: 250, label: 'ML Ensemble',   icon: '🧠', color: '#ec4899' },
]

const WIRES = [
  { from: 'temp',  to: 'mcu',   protocol: 'I²C'   },
  { from: 'soil',  to: 'mcu',   protocol: 'ADC'   },
  { from: 'humid', to: 'mcu',   protocol: 'UART'  },
  { from: 'light', to: 'mcu',   protocol: 'SPI'   },
  { from: 'mcu',   to: 'edge',  protocol: 'MQTT'  },
  { from: 'edge',  to: 'cloud', protocol: 'HTTPS' },
  { from: 'cloud', to: 'ml',    protocol: 'gRPC'  },
]

function getCenter(id) {
  const n = NODES.find(n => n.id === id)
  return n ? { x: n.x + 50, y: n.y + 40 } : { x: 0, y: 0 }
}

export default function CircuitAnimator() {
  const [tick, setTick] = useState(0)
  const [activeWire, setActiveWire] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1)
      setActiveWire(w => (w + 1) % WIRES.length)
    }, 600)
    return () => clearInterval(id)
  }, [])

  return (
    <SectionWrapper id="circuit">
      <SectionTitle
        icon="🔌"
        title="IoT Pipeline & Circuit Animator"
        subtitle="Real-time visualization of the sensor-to-cloud data pipeline. Watch data pulses flow from physical sensors through edge computing to the ML inference engine."
        badge={{ text: 'LIVE DATA FLOW', color: 'cyan', dot: true }}
      />

      <div className="glass-card" style={{ padding: 24, overflowX: 'auto' }}>
        <svg
          viewBox="0 0 960 520"
          style={{ width: '100%', minWidth: 700, height: 'auto', display: 'block' }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="960" height="520" fill="url(#grid)" />

          {/* Labels at top */}
          {[
            { x: 60,  label: 'SENSORS',    color: '#6b8f6e' },
            { x: 260, label: 'MCU',         color: '#6b8f6e' },
            { x: 460, label: 'EDGE NODE',   color: '#6b8f6e' },
            { x: 660, label: 'CLOUD API',   color: '#6b8f6e' },
            { x: 860, label: 'ML ENGINE',   color: '#6b8f6e' },
          ].map(({ x, label, color }) => (
            <text key={label} x={x + 50} y={30}
              textAnchor="middle" fill={color}
              fontSize="9" fontFamily="JetBrains Mono, monospace"
              letterSpacing="1" fontWeight="600"
            >{label}</text>
          ))}

          {/* Column dividers */}
          {[180, 380, 580, 780].map(x => (
            <line key={x} x1={x} y1={45} x2={x} y2={490}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 6" />
          ))}

          {/* Wires */}
          {WIRES.map((wire, i) => {
            const from = getCenter(wire.from)
            const to = getCenter(wire.to)
            const isActive = activeWire === i
            const mx = (from.x + to.x) / 2
            return (
              <g key={i}>
                {/* Base wire */}
                <path
                  d={`M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`}
                  fill="none"
                  stroke={isActive ? '#22c55e' : 'rgba(34,197,94,0.15)'}
                  strokeWidth={isActive ? 2 : 1.5}
                  filter={isActive ? 'url(#glow)' : undefined}
                  style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                />
                {/* Protocol label */}
                <text
                  x={mx} y={(from.y + to.y) / 2 - 6}
                  textAnchor="middle" fill="rgba(34,197,94,0.5)"
                  fontSize="8" fontFamily="JetBrains Mono, monospace"
                >
                  {wire.protocol}
                </text>
                {/* Animated packet */}
                {isActive && (
                  <>
                    {[0, 0.3, 0.6].map(offset => (
                      <circle key={offset} r="4" fill="#22c55e" filter="url(#glow)">
                        <animateMotion
                          dur="1.2s"
                          repeatCount="indefinite"
                          begin={`${-offset}s`}
                        >
                          <mpath href={`#wire-${i}`} />
                        </animateMotion>
                      </circle>
                    ))}
                    <path
                      id={`wire-${i}`}
                      d={`M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`}
                      fill="none"
                      style={{ display: 'none' }}
                    />
                  </>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {NODES.map(node => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              {/* Glow ring */}
              <circle cx={50} cy={40} r={38}
                fill="none"
                stroke={`${node.color}20`}
                strokeWidth="1"
              />
              {/* Card background */}
              <rect x={10} y={8} width={80} height={64}
                rx={10} ry={10}
                fill="rgba(13,26,16,0.9)"
                stroke={`${node.color}40`}
                strokeWidth="1"
              />
              {/* Icon circle */}
              <circle cx={50} cy={34} r={18}
                fill={`${node.color}18`}
                stroke={`${node.color}50`}
                strokeWidth="1"
              />
              <text x={50} y={40} textAnchor="middle" fontSize="14">{node.icon}</text>
              {/* Label */}
              {node.label.split('\n').map((line, j) => (
                <text key={j} x={50} y={62 + j * 11}
                  textAnchor="middle"
                  fill="rgba(160,200,165,0.9)"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >{line}</text>
              ))}
              {/* Status dot */}
              <circle cx={82} cy={16} r={4} fill="#22c55e">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          ))}

          {/* Output label */}
          <text x={940} y={255} textAnchor="end" fill="rgba(34,197,94,0.7)"
            fontSize="10" fontFamily="JetBrains Mono, monospace">
            → Prediction
          </text>
        </svg>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: 20, flexWrap: 'wrap',
          marginTop: 16, paddingTop: 16,
          borderTop: '1px solid var(--glass-border)',
        }}>
          {[
            { color: '#f59e0b', label: 'Temperature' },
            { color: '#22c55e', label: 'Soil/NPK' },
            { color: '#06b6d4', label: 'Humidity' },
            { color: '#a855f7', label: 'Light/NDVI' },
            { color: '#22c55e', label: 'Data Packet' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fault injection panel */}
      <div className="grid-3" style={{ marginTop: 24 }}>
        {[
          { icon: '⚡', label: 'Inject Sensor Fault', color: 'var(--red-400)', desc: 'Disable temp sensor, trigger fallback logic' },
          { icon: '📶', label: 'Simulate MQTT Drop', color: 'var(--amber-400)', desc: 'Interrupt broker connection, test retry' },
          { icon: '🔄', label: 'Reset All', color: 'var(--green-400)', desc: 'Restore full pipeline to nominal state' },
        ].map(({ icon, label, color, desc }) => (
          <button
            key={label}
            className="glass-card"
            onClick={() => {}}
            style={{
              padding: '16px 20px', textAlign: 'left', cursor: 'pointer',
              border: `1px solid ${color}20`,
              transition: 'all 0.2s',
              width: '100%', fontFamily: 'var(--font-sans)',
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = `${color}50`}
            onMouseOut={e => e.currentTarget.style.borderColor = `${color}20`}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
          </button>
        ))}
      </div>
    </SectionWrapper>
  )
}
