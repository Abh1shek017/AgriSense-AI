import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const SENSOR_FIELDS = [
  { key: 'N',           label: 'Nitrogen (N)',     unit: 'mg/kg', icon: '🧪', default: '90'   },
  { key: 'P',           label: 'Phosphorus (P)',   unit: 'mg/kg', icon: '⚗️',  default: '42'   },
  { key: 'K',           label: 'Potassium (K)',    unit: 'mg/kg', icon: '⚡',  default: '43'   },
  { key: 'ph',          label: 'pH Level',         unit: 'pH',    icon: '💧',  default: '6.5'  },
  { key: 'temperature', label: 'Temperature',      unit: '°C',    icon: '🌡️',  default: '25'   },
  { key: 'humidity',    label: 'Humidity',         unit: '%',     icon: '☁️',  default: '80'   },
  { key: 'moisture',    label: 'Soil Moisture',    unit: '%',     icon: '🌊',  default: '60'   },
  { key: 'rainfall',    label: 'Rainfall',         unit: 'mm',    icon: '🌧️',  default: '120'  },
]

const MOCK_PREDICTIONS = [
  { crop: 'Rice',    confidence: 87.4, icon: '🌾', color: 'var(--green-400)' },
  { crop: 'Wheat',   confidence: 72.1, icon: '🌿', color: 'var(--emerald-400)' },
  { crop: 'Maize',   confidence: 61.8, icon: '🌽', color: 'var(--cyan-400)' },
]

export default function SensorPanel({ onPredict }) {
  const [values, setValues] = useState(
    Object.fromEntries(SENSOR_FIELDS.map(f => [f.key, f.default]))
  )
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const handlePredict = useCallback(async () => {
    setLoading(true)
    setResults(null)
    // Simulate API call — replace with actual fetch to backend
    await new Promise(r => setTimeout(r, 1400))
    setResults(MOCK_PREDICTIONS)
    setLoading(false)
    onPredict?.(MOCK_PREDICTIONS)
  }, [onPredict])

  return (
    <SectionWrapper id="sensor">
      <SectionTitle
        icon="📡"
        title="Sensor Hub"
        subtitle="Enter real-time ESP32 sensor readings or let the system auto-fetch from GPS coordinates, NASA POWER, and SoilGrids APIs."
        badge={{ text: 'ESP32 DATA STREAM', color: 'cyan', dot: true }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Input panel */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Sensor Readings</h3>
            <span style={{
              padding: '3px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--glass-border)',
              borderRadius: 6,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}>LIVE MODE</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 14,
            marginBottom: 24,
          }}>
            {SENSOR_FIELDS.map(field => (
              <div key={field.key}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}>
                  <span>{field.icon}</span> {field.label}
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
                  onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.35)'}
                  onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                >
                  <input
                    type="number"
                    value={values[field.key]}
                    onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                    style={{
                      flex: 1, padding: '9px 12px',
                      background: 'none', border: 'none',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14, fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                  <span style={{
                    padding: '0 10px',
                    fontSize: 11, fontWeight: 600,
                    color: 'var(--text-dim)',
                  }}>{field.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 14 }}
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Analyzing with ML Ensemble...
              </>
            ) : (
              <>✨ Get Crop Recommendation</>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
            Powered by RF + SVM + LSTM ensemble · {`< `}120ms inference
          </p>
        </div>

        {/* Live readings visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Sensor bars */}
          <div className="glass-card" style={{ padding: 24, flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)' }}>
              Live Sensor Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {SENSOR_FIELDS.slice(0, 6).map(field => {
                const val = parseFloat(values[field.key]) || 0
                const max = { N: 140, P: 145, K: 205, ph: 14, temperature: 50, humidity: 100, moisture: 100, rainfall: 300 }[field.key] || 100
                const pct = Math.min((val / max) * 100, 100)
                const color = pct > 80 ? 'var(--red-400)' : pct > 60 ? 'var(--amber-400)' : 'var(--green-400)'
                return (
                  <div key={field.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{field.label}</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color }}>
                        {values[field.key]} {field.unit}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        style={{ background: `linear-gradient(90deg, ${color}, ${color}90)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Results */}
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{ padding: 24 }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>
                🌾 Top Recommendations
              </h3>
              {results.map((r, i) => (
                <div key={r.crop} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < results.length - 1 ? '1px solid var(--glass-border)' : 'none',
                }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                  }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{r.crop}</div>
                    <div className="progress-bar" style={{ marginTop: 4, height: 4 }}>
                      <div className="progress-fill" style={{ width: `${r.confidence}%`, background: r.color }} />
                    </div>
                  </div>
                  <span style={{
                    fontSize: 15, fontWeight: 800,
                    color: r.color, fontFamily: 'var(--font-mono)',
                  }}>{r.confidence}%</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </SectionWrapper>
  )
}
