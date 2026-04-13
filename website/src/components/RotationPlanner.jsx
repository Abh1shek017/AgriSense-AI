import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const SEASONS = [
  {
    season: 'Kharif 2025',
    months: 'Jun – Nov',
    crop: 'Rice',
    icon: '🌾',
    npk: { n: -45, p: -20, k: -35 },
    marketPrice: '₹2,320/qtl',
    yieldEst: '4.2 t/ha',
    color: '#22c55e',
    soilNote: 'High water demand. Depletes N significantly.',
  },
  {
    season: 'Rabi 2025–26',
    months: 'Nov – Apr',
    crop: 'Wheat',
    icon: '🌿',
    npk: { n: -30, p: -15, k: -20 },
    marketPrice: '₹2,275/qtl',
    yieldEst: '3.8 t/ha',
    color: '#f59e0b',
    soilNote: 'Moderate demand. Good after Rice rotation.',
  },
  {
    season: 'Zaid 2026',
    months: 'Mar – Jun',
    crop: 'Moong Dal',
    icon: '🫛',
    npk: { n: +20, p: -5, k: -8 },
    marketPrice: '₹7,755/qtl',
    yieldEst: '1.1 t/ha',
    color: '#10b981',
    soilNote: 'Nitrogen-fixing legume — replenishes soil N.',
  },
  {
    season: 'Kharif 2026',
    months: 'Jun – Nov',
    crop: 'Maize',
    icon: '🌽',
    npk: { n: -40, p: -18, k: -30 },
    marketPrice: '₹2,090/qtl',
    yieldEst: '5.1 t/ha',
    color: '#a855f7',
    soilNote: 'Breaks pest cycle from Rice. High yield potential.',
  },
]

const MARKET_CROPS = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean']
const MARKET_PRICES = { Rice: 2320, Wheat: 2275, Maize: 2090, Cotton: 6740, Soybean: 3880 }

export default function RotationPlanner() {
  const [selected, setSelected] = useState(0)

  const totalNpk = SEASONS.reduce((acc, s) => ({
    n: acc.n + s.npk.n, p: acc.p + s.npk.p, k: acc.k + s.npk.k,
  }), { n: 0, p: 0, k: 0 })

  return (
    <SectionWrapper id="rotation">
      <SectionTitle
        icon="🔄"
        title="4-Season Crop Rotation Planner"
        subtitle="Multi-season rotation sequences optimized for soil nutrient recovery, pest break cycles, and market value. Nutrient depletion tracked across all four seasons."
        badge={{ text: 'ML ROTATION ENGINE', color: 'green' }}
      />

      {/* 4-Season cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {SEASONS.map((s, i) => (
          <motion.div
            key={s.season}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelected(i)}
            className="glass-card"
            style={{
              padding: 20, cursor: 'pointer',
              border: `1px solid ${selected === i ? s.color + '60' : 'var(--glass-border)'}`,
              background: selected === i ? `${s.color}08` : 'var(--glass-bg)',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            {/* Season number */}
            <div style={{
              position: 'absolute', top: 12, right: 12,
              width: 22, height: 22, borderRadius: '50%',
              background: `${s.color}20`, border: `1px solid ${s.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: s.color,
            }}>{i + 1}</div>

            {/* Crop icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `${s.color}15`, border: `1px solid ${s.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, marginBottom: 12,
            }}>{s.icon}</div>

            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{s.season}</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2, color: s.color }}>{s.crop}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 10 }}>{s.months}</div>

            {/* NPK mini bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              {[['N', s.npk.n], ['P', s.npk.p], ['K', s.npk.k]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, fontSize: 9, color: 'var(--text-dim)' }}>{k}</span>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${Math.abs(v) * 0.65}%`,
                      background: v > 0 ? '#22c55e' : '#f87171',
                      marginLeft: v < 0 ? 'auto' : 0,
                    }} />
                  </div>
                  <span style={{ width: 24, fontSize: 9, fontFamily: 'var(--font-mono)', color: v > 0 ? '#22c55e' : '#f87171', textAlign: 'right' }}>
                    {v > 0 ? '+' : ''}{v}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.marketPrice}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Est. {s.yieldEst}</div>
          </motion.div>
        ))}
      </div>

      {/* Detail + NPK summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Selected season detail */}
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ padding: 24, border: `1px solid ${SEASONS[selected].color}30` }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
            {SEASONS[selected].icon} {SEASONS[selected].crop} — {SEASONS[selected].season}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.65 }}>
            {SEASONS[selected].soilNote}
          </p>
          {[
            { label: 'Period', value: SEASONS[selected].months },
            { label: 'Market Price', value: SEASONS[selected].marketPrice },
            { label: 'Yield Estimate', value: SEASONS[selected].yieldEst },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: SEASONS[selected].color }}>{value}</span>
            </div>
          ))}
        </motion.div>

        {/* Cumulative NPK */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            Cumulative NPK Balance (4 Seasons)
          </h3>
          {[
            { k: 'Nitrogen (N)',   v: totalNpk.n, unit: 'kg/ha' },
            { k: 'Phosphorus (P)', v: totalNpk.p, unit: 'kg/ha' },
            { k: 'Potassium (K)',  v: totalNpk.k, unit: 'kg/ha' },
          ].map(({ k, v, unit }) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                <span style={{
                  fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)',
                  color: v >= 0 ? '#22c55e' : '#f87171',
                }}>
                  {v > 0 ? '+' : ''}{v} {unit}
                </span>
              </div>
              <div className="progress-bar">
                <div style={{
                  height: '100%', borderRadius: 3, width: `${Math.min(Math.abs(v) / 1.5, 100)}%`,
                  background: v >= 0 ? 'var(--gradient-green)' : 'linear-gradient(90deg, #f87171, #ef4444)',
                  marginLeft: v < 0 ? 'auto' : 0,
                }} />
              </div>
            </div>
          ))}

          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: totalNpk.n >= -50 ? 'rgba(34,197,94,0.06)' : 'rgba(248,113,113,0.06)',
            border: `1px solid ${totalNpk.n >= -50 ? 'rgba(34,197,94,0.2)' : 'rgba(248,113,113,0.2)'}`,
            borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55,
          }}>
            💡 {totalNpk.n < -50
              ? 'Significant nitrogen depletion. Apply 80kg/ha urea before next season.'
              : 'Nutrient balance is healthy. Minimal amendment required.'}
          </div>
        </div>

        {/* Market prices table */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Live Market Prices</h3>
          {MARKET_CROPS.map((crop, i) => (
            <div key={crop} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{crop}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800,
                color: i === 0 ? 'var(--green-400)' : 'var(--text-secondary)',
              }}>₹{MARKET_PRICES[crop].toLocaleString()}</span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>/qtl</span>
            </div>
          ))}
          <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 10 }}>
            Source: AGMARKNET API (simulated)
          </p>
        </div>
      </div>
    </SectionWrapper>
  )
}
