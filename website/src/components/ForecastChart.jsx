import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import SectionWrapper, { SectionTitle } from './SectionWrapper'
import { fetchForecast, getBrowserLocation } from '../services/forecastService'

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      background: 'rgba(7,15,9,0.95)',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: 10, padding: '12px 16px',
      backdropFilter: 'blur(12px)',
      minWidth: 180,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
        {d.icon} {d.label}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
        Suitability: <strong style={{ color: 'var(--green-400)' }}>{d.suitability}%</strong>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
        Best crop: <strong style={{ color: 'var(--cyan-400)' }}>{d.crop}</strong>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
        Temp: {d.tempLow}–{d.tempHigh}°C
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
        Rain: {d.rain} mm  |  Wind: {d.windSpeed} km/h
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        ET₀: {d.et0} mm  |  UV: {d.uvIndex}
      </div>
    </div>
  )
}

// ─── Insight Badge Colors ─────────────────────────────────────────────────────

const INSIGHT_COLORS = {
  success: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)', text: '#22c55e' },
  info:    { bg: 'rgba(6,182,212,0.10)',  border: 'rgba(6,182,212,0.25)',  text: '#06b6d4' },
  warning: { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24' },
  danger:  { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)',  text: '#ef4444' },
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  const shimmer = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: 8,
  }
  return (
    <div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {/* Current weather skeleton */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ ...shimmer, width: 80, height: 80, borderRadius: '50%' }} />
          <div>
            <div style={{ ...shimmer, width: 120, height: 36, marginBottom: 8 }} />
            <div style={{ ...shimmer, width: 180, height: 16 }} />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 24 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ ...shimmer, width: 50, height: 14, marginBottom: 6 }} />
                <div style={{ ...shimmer, width: 50, height: 20 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Chart skeleton */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ ...shimmer, width: '100%', height: 260 }} />
      </div>
      {/* Strip skeleton */}
      <div style={{ display: 'flex', gap: 10 }}>
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} style={{ ...shimmer, width: 76, height: 105, flexShrink: 0 }} />
        ))}
      </div>
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ error, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ padding: 40, textAlign: 'center' }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Could not load forecast</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
        {error}
      </div>
      <button
        onClick={onRetry}
        style={{
          background: 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.3)',
          color: 'var(--green-400)',
          padding: '8px 20px',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
        }}
      >
        ↻ Retry
      </button>
    </motion.div>
  )
}

// ─── Current Weather Card ─────────────────────────────────────────────────────

function CurrentWeatherCard({ current, locationLabel, fetchedAt, onRefresh, refreshing }) {
  const timeStr = fetchedAt
    ? fetchedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <motion.div
      className="glass-card"
      style={{ padding: 24, marginBottom: 20 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        {/* Left: temp + description */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 56, lineHeight: 1 }}>{current.icon}</div>
          <div>
            <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>
              {current.temperature.toFixed(1)}°C
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 }}>
              {current.description}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Feels like {current.apparentTemperature.toFixed(1)}°C
            </div>
          </div>
        </div>

        {/* Right: meta grid */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Humidity', value: `${current.humidity}%`, icon: '💧' },
            { label: 'Wind', value: `${current.windSpeed} km/h`, icon: '💨' },
            { label: 'Visibility', value: `${current.visibility.toFixed(1)} km`, icon: '👁️' },
            { label: 'Rainfall', value: `${current.precipitation} mm`, icon: '🌧️' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 16, paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          📍 {locationLabel} &nbsp;·&nbsp; Updated {timeStr} &nbsp;·&nbsp;
          <span style={{ color: 'var(--green-400)' }}>Live · Open-Meteo</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          style={{
            background: 'transparent',
            border: '1px solid rgba(34,197,94,0.25)',
            color: 'var(--green-400)',
            padding: '4px 12px',
            borderRadius: 6,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: 11,
            fontFamily: 'var(--font-sans)',
            opacity: refreshing ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {refreshing ? '⟳ Refreshing…' : '↻ Refresh'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ForecastChart() {
  const [selected, setSelected] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else { setLoading(true); setError(null) }

    try {
      const { latitude, longitude } = await getBrowserLocation()
      const result = await fetchForecast(latitude, longitude)
      setData(result)
      setSelected(0)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <SectionWrapper id="forecast">
      <SectionTitle
        icon="🌤️"
        title="14-Day Forecast & Suitability"
        subtitle="Real-time weather from Open-Meteo processed through the LSTM model to predict daily crop suitability scores with upper/lower confidence bands."
        badge={{
          text: loading ? 'FETCHING LIVE DATA…' : error ? 'OFFLINE · RETRY' : 'LIVE · OPEN-METEO · NO API KEY',
          color: loading ? 'blue' : error ? 'red' : 'green',
          dot: !loading && !error,
        }}
      />

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={() => load(false)} />
      ) : data ? (
        <>
          {/* ── Current Weather ─────────────────────────────────────────── */}
          <CurrentWeatherCard
            current={data.current}
            locationLabel={data.locationLabel}
            fetchedAt={data.fetchedAt}
            onRefresh={() => load(true)}
            refreshing={refreshing}
          />

          {/* ── Suitability Chart ────────────────────────────────────────── */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Crop Suitability Score — 14 Days</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Shaded band = confidence interval (upper/lower bounds)
                </p>
              </div>
              <div className="badge badge-green" style={{ fontSize: 10 }}>
                <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                Live Data
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.days} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
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
                <YAxis tick={{ fill: '#6b8f6e', fontSize: 11 }} axisLine={false} tickLine={false} domain={[20, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area dataKey="upper" stroke="#06b6d480" fill="url(#upperGrad)" strokeWidth={1} dot={false} />
                <Area
                  dataKey="suitability"
                  stroke="#22c55e"
                  fill="url(#suitGrad)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#22c55e' }}
                />
                <Area dataKey="lower" stroke="rgba(34,197,94,0.3)" fill="none" strokeWidth={1} dot={false} strokeDasharray="4 3" />
                <ReferenceLine
                  y={70}
                  stroke="rgba(251,191,36,0.3)"
                  strokeDasharray="4 4"
                  label={{ value: 'Threshold', fill: '#fbbf2480', fontSize: 10 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Day Strip ────────────────────────────────────────────────── */}
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <div style={{ display: 'flex', gap: 10, minWidth: 'max-content' }}>
              {data.days.map((day, i) => {
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
                    <div style={{ fontSize: 10, color: isSelected ? 'var(--green-400)' : 'var(--text-muted)', marginBottom: 3, fontWeight: isSelected ? 700 : 400 }}>
                      {i === 0 ? 'Today' : day.day}
                    </div>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{day.icon}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      {day.tempLow}–{day.tempHigh}°
                    </div>
                    {day.rain > 0 && (
                      <div style={{ fontSize: 9, color: '#60a5fa', marginTop: 2 }}>
                        💧{day.rain}mm
                      </div>
                    )}
                    <div style={{
                      marginTop: 5, padding: '2px 4px',
                      background: `${color}15`, borderRadius: 4,
                      fontSize: 11, fontWeight: 800, color,
                    }}>
                      {day.suitability}%
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* ── Selected Day Detail ─────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="glass-card"
              style={{ marginTop: 16, padding: '20px 24px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                    {data.days[selected].icon} {selected === 0 ? 'Today' : data.days[selected].label} — {data.days[selected].description}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    Best crop: <span className="gradient-text">{data.days[selected].crop}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Temp', value: `${data.days[selected].tempLow}–${data.days[selected].tempHigh}°C` },
                    { label: 'Rain', value: `${data.days[selected].rain} mm` },
                    { label: 'Wind', value: `${data.days[selected].windSpeed} km/h` },
                    { label: 'UV Index', value: `${data.days[selected].uvIndex}` },
                    { label: 'ET₀', value: `${data.days[selected].et0} mm` },
                    { label: 'Suitability', value: `${data.days[selected].suitability}%` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Smart Crop Insights ─────────────────────────────────────── */}
          <motion.div
            className="glass-card"
            style={{ marginTop: 20, padding: 24 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>💡 Smart Crop Insights</h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Generated from real 14-day forecast data
                </p>
              </div>
              <div className="badge badge-green" style={{ fontSize: 10 }}>AI · Live</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {data.insights.map((ins, i) => {
                const c = INSIGHT_COLORS[ins.type] ?? INSIGHT_COLORS.info
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>{ins.icon}</span>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {ins.text}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </>
      ) : null}
    </SectionWrapper>
  )
}
