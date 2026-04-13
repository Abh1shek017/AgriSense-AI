import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine, Legend,
} from 'recharts'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

// Generate 14-day mock forecast data
function genForecast() {
  const crops = ['Rice', 'Wheat', 'Rice', 'Maize', 'Rice', 'Rice', 'Wheat', 'Rice', 'Maize', 'Rice', 'Rice', 'Rice', 'Wheat', 'Maize']
  const icons = ['☀️', '⛅', '🌧️', '🌤️', '🌦️', '☀️', '⛅', '🌧️', '🌤️', '☀️', '⛅', '🌧️', '☀️', '🌤️']
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return Array.from({ length: 14 }, (_, i) => ({
    day: days[i % 7],
    date: `Apr ${13 + i}`,
    icon: icons[i],
    tempHigh: Math.round(26 + Math.sin(i * 0.8) * 5),
    tempLow: Math.round(18 + Math.sin(i * 0.8 + 1) * 4),
    rain: Math.round(Math.max(0, Math.sin(i * 0.6) * 15)),
    suitability: Math.round(65 + Math.sin(i * 0.5) * 20),
    upper: Math.round(80 + Math.sin(i * 0.5) * 10),
    lower: Math.round(55 + Math.sin(i * 0.5) * 15),
    crop: crops[i],
    temp: Math.round(22 + Math.sin(i * 0.8) * 5),
  }))
}

const FORECAST = genForecast()

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: 'rgba(7,15,9,0.95)',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: 10, padding: '12px 16px',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{d?.date}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        Suitability: <strong style={{ color: 'var(--green-400)' }}>{d?.suitability}%</strong>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        Best crop: <strong style={{ color: 'var(--cyan-400)' }}>{d?.crop}</strong>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Temp: {d?.tempLow}–{d?.tempHigh}°C | Rain: {d?.rain}mm
      </div>
    </div>
  )
}

export default function ForecastChart() {
  const [selected, setSelected] = useState(0)

  return (
    <SectionWrapper id="forecast">
      <SectionTitle
        icon="🌤️"
        title="14-Day Forecast & Suitability"
        subtitle="Open-Meteo 16-day forecast processed through the LSTM model to predict daily crop suitability scores with upper/lower confidence bands."
        badge={{ text: 'OPEN-METEO · PROPHET · LSTM', color: 'blue' }}
      />

      {/* Recharts area chart */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Crop Suitability Score — 14 Days</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Shaded band = confidence interval (upper/lower bounds)
            </p>
          </div>
          <div className="badge badge-green" style={{ fontSize: 10 }}>Live Forecast</div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={FORECAST} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="upperGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: '#6b8f6e', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b8f6e', fontSize: 11 }} axisLine={false} tickLine={false} domain={[40, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Area dataKey="upper" stroke="#06b6d480" fill="url(#upperGrad)" strokeWidth={1} dot={false} />
            <Area dataKey="suitability" stroke="#22c55e" fill="url(#suitGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#22c55e' }} />
            <Area dataKey="lower" stroke="rgba(34,197,94,0.3)" fill="none" strokeWidth={1} dot={false} strokeDasharray="4 3" />
            <ReferenceLine y={70} stroke="rgba(251,191,36,0.3)" strokeDasharray="4 4" label={{ value: 'Threshold', fill: '#fbbf2480', fontSize: 10 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Day card strip */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 10, minWidth: 'max-content' }}>
          {FORECAST.map((day, i) => {
            const isSelected = selected === i
            const color = day.suitability >= 75 ? 'var(--green-400)'
              : day.suitability >= 55 ? 'var(--amber-400)' : 'var(--red-400)'
            return (
              <motion.button
                key={i}
                onClick={() => setSelected(i)}
                whileHover={{ y: -3 }}
                style={{
                  width: 76, padding: '12px 8px',
                  background: isSelected ? 'rgba(34,197,94,0.12)' : 'var(--glass-bg)',
                  border: `1px solid ${isSelected ? 'rgba(34,197,94,0.35)' : 'var(--glass-border)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{day.day}</div>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{day.icon}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {day.tempLow}–{day.tempHigh}°
                </div>
                <div style={{
                  marginTop: 6, padding: '2px 4px',
                  background: `${color}15`, borderRadius: 4,
                  fontSize: 11, fontWeight: 800, color,
                }}>{day.suitability}%</div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected !== null && (
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ marginTop: 16, padding: '20px 24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                {FORECAST[selected].icon} {FORECAST[selected].date} Forecast
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                Best crop: <span className="gradient-text">{FORECAST[selected].crop}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: 'Temp', value: `${FORECAST[selected].tempLow}–${FORECAST[selected].tempHigh}°C` },
                { label: 'Rain', value: `${FORECAST[selected].rain}mm` },
                { label: 'Suitability', value: `${FORECAST[selected].suitability}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </SectionWrapper>
  )
}
