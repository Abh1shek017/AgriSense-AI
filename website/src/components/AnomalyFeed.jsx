import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

let alertId = 0
function genAlert() {
  const sensors = ['Temp Sensor Z2', 'Soil pH Z1', 'Humidity Z3', 'Potassium Z4', 'MQTT Heartbeat']
  const actions = [
    'Check irrigation schedule', 'Adjust fertiliser application',
    'Verify sensor calibration', 'Review crop selection', 'Inspect field zone',
  ]
  const severities = [
    { level: 'Info',     color: 'var(--blue-400)',   p: 0.5 },
    { level: 'Warning',  color: 'var(--amber-400)',  p: 0.35 },
    { level: 'Critical', color: 'var(--red-400)',    p: 0.15 },
  ]
  const roll = Math.random()
  const sev = roll < 0.5 ? severities[0] : roll < 0.85 ? severities[1] : severities[2]
  const sensor = sensors[Math.floor(Math.random() * sensors.length)]
  return {
    id: ++alertId,
    sensor,
    severity: sev.level,
    color: sev.color,
    reading: (Math.random() * 100).toFixed(1),
    action: actions[Math.floor(Math.random() * actions.length)],
    time: new Date().toLocaleTimeString(),
    icon: sev.level === 'Critical' ? '🚨' : sev.level === 'Warning' ? '⚠️' : 'ℹ️',
  }
}

const INIT_ALERTS = Array.from({ length: 6 }, genAlert)

export default function AnomalyFeed() {
  const [alerts, setAlerts] = useState(INIT_ALERTS)
  const [filter, setFilter] = useState('All')
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setAlerts(prev => [genAlert(), ...prev.slice(0, 24)])
    }, 3000)
    return () => clearInterval(id)
  }, [paused])

  const filtered = filter === 'All' ? alerts : alerts.filter(a => a.severity === filter)

  const counts = {
    Critical: alerts.filter(a => a.severity === 'Critical').length,
    Warning:  alerts.filter(a => a.severity === 'Warning').length,
    Info:     alerts.filter(a => a.severity === 'Info').length,
  }

  return (
    <SectionWrapper id="anomaly">
      <SectionTitle
        icon="🚨"
        title="Anomaly Alert Feed"
        subtitle="Z-score and IQR-based anomaly detection runs on every sensor reading. Alerts are classified into three severity tiers with recommended agronomic actions."
        badge={{ text: 'REAL-TIME DETECTION', color: 'red', dot: true }}
      />

      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Critical', count: counts.Critical, color: 'var(--red-400)',   bg: 'rgba(248,113,113,0.08)', icon: '🚨' },
          { label: 'Warning',  count: counts.Warning,  color: 'var(--amber-400)', bg: 'rgba(251,191,36,0.08)', icon: '⚠️' },
          { label: 'Info',     count: counts.Info,     color: 'var(--blue-400)',  bg: 'rgba(96,165,250,0.08)', icon: 'ℹ️' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{
            padding: '16px 20px', background: s.bg,
            border: `1px solid ${s.color}20`,
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'var(--font-mono)' }}>
              {s.count}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label} Alerts</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {['All', 'Critical', 'Warning', 'Info'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={filter === f ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '6px 16px', fontSize: 12 }}>
            {f}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn-ghost" onClick={() => setPaused(p => !p)}
          style={{ padding: '6px 14px', fontSize: 12 }}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button className="btn-ghost" onClick={() => setAlerts([])}
          style={{ padding: '6px 14px', fontSize: 12 }}>
          🗑 Clear
        </button>
      </div>

      {/* Alert list */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', maxHeight: 480, overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No alerts to display
            </div>
          ) : filtered.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderLeft: `3px solid ${alert.color}`,
                background: i === 0 && !paused ? `${alert.color}08` : 'transparent',
                transition: 'background 0.5s',
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Severity icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${alert.color}15`, flexShrink: 0,
                }}>{alert.icon}</div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{alert.sensor}</span>
                    <span className="badge" style={{
                      background: `${alert.color}15`,
                      border: `1px solid ${alert.color}30`,
                      color: alert.color, fontSize: 9,
                    }}>{alert.severity}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                      {alert.time}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    Reading: <span style={{ fontFamily: 'var(--font-mono)', color: alert.color }}>
                      {alert.reading}
                    </span> — value outside expected range
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    💡 Action: {alert.action}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SectionWrapper>
  )
}
