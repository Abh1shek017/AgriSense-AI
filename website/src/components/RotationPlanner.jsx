import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'
import { FIELDS, fmt, fmtAcres, resolveColor } from '../data/fields'

const MARKET_PRICES = { Rice: 2320, Wheat: 2275, Maize: 2090, Cotton: 6740, Soybean: 3880 }
const MARKET_CROPS = Object.keys(MARKET_PRICES)

// ─── Mini polygon SVG (same style as FieldMap) ─────────────────────────────
function MiniPolygon({ points, color }) {
  const pts = points.map(([x, y]) => `${x},${y}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <defs>
        <filter id={`glow-planner-${color.replace('#', '')}`}>
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[20, 40, 60, 80].map(v => (
        <g key={v}>
          <line x1={v} y1={0} x2={v} y2={100} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <line x1={0} y1={v} x2={100} y2={v} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        </g>
      ))}
      <polygon
        points={pts}
        fill={`${color}28`}
        stroke={color}
        strokeWidth="1.5"
        filter={`url(#glow-planner-${color.replace('#', '')})`}
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={color} opacity="0.9" />
      ))}
      <text x="50" y="8"  textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.2)">N</text>
      <text x="50" y="97" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.2)">S</text>
      <text x="4"  y="52" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.2)">W</text>
      <text x="96" y="52" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.2)">E</text>
    </svg>
  )
}

// ─── Field Selector Card ────────────────────────────────────────────────────
function FieldSelectorCard({ field, isSelected, onClick, index }) {
  const color = resolveColor(field.statusColor)
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 16px',
        borderRadius: 14,
        border: `1px solid ${isSelected ? color + '70' : 'rgba(255,255,255,0.07)'}`,
        background: isSelected ? `${color}10` : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* Active glow line */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }} />
      )}

      {/* GPS Polygon preview */}
      <div style={{
        height: 72, borderRadius: 8, overflow: 'hidden',
        background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: 10, padding: 6,
      }}>
        <MiniPolygon points={field.polygon} color={color} />
      </div>

      {/* Field ID + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{
          fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-mono)',
          color: isSelected ? color : 'var(--text-dim)', letterSpacing: 1,
        }}>FIELD #{field.id}</span>
        <span style={{
          fontSize: 8, padding: '2px 7px', borderRadius: 20, fontWeight: 700,
          background: `${color}15`, color, border: `1px solid ${color}30`,
        }}>{field.status}</span>
      </div>

      <div style={{ fontWeight: 700, fontSize: 12, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: 2, lineHeight: 1.3 }}>
        {field.name}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>{field.cropShort}</div>

      {/* Area */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '6px 8px', borderRadius: 8,
        background: isSelected ? `${color}10` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isSelected ? color + '25' : 'rgba(255,255,255,0.05)'}`,
      }}>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>GPS Area</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color }}>{fmt(field.area_m2)}</span>
      </div>
    </motion.button>
  )
}

// ─── Season Card ─────────────────────────────────────────────────────────────
function SeasonCard({ s, i, isSelected, onClick }) {
  return (
    <motion.div
      key={s.season}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.08 }}
      onClick={onClick}
      className="glass-card"
      style={{
        padding: 18, cursor: 'pointer',
        border: `1px solid ${isSelected ? s.color + '60' : 'var(--glass-border)'}`,
        background: isSelected ? `${s.color}08` : 'var(--glass-bg)',
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      {/* Season number badge */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        width: 20, height: 20, borderRadius: '50%',
        background: `${s.color}20`, border: `1px solid ${s.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 900, color: s.color,
      }}>{i + 1}</div>

      {/* Crop icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${s.color}15`, border: `1px solid ${s.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, marginBottom: 10,
      }}>{s.icon}</div>

      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>{s.season}</div>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2, color: s.color }}>{s.crop}</div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 10 }}>{s.months}</div>

      {/* NPK mini bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {[['N', s.npk.n], ['P', s.npk.p], ['K', s.npk.k]].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, fontSize: 9, color: 'var(--text-dim)' }}>{k}</span>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${Math.min(Math.abs(v) * 0.7, 100)}%`,
                background: v > 0 ? '#22c55e' : '#f87171',
                marginLeft: v < 0 ? 'auto' : 0,
              }} />
            </div>
            <span style={{
              width: 24, fontSize: 9, fontFamily: 'var(--font-mono)',
              color: v > 0 ? '#22c55e' : '#f87171', textAlign: 'right',
            }}>{v > 0 ? '+' : ''}{v}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.marketPrice}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Est. {s.yieldEst}</div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RotationPlanner() {
  const [selectedFieldId, setSelectedFieldId] = useState(FIELDS[0].id)
  const [selectedSeason, setSelectedSeason]   = useState(0)

  const field    = FIELDS.find(f => f.id === selectedFieldId) ?? FIELDS[0]
  const fieldColor = resolveColor(field.statusColor)
  const seasons  = field.rotation

  const totalNpk = seasons.reduce((acc, s) => ({
    n: acc.n + s.npk.n, p: acc.p + s.npk.p, k: acc.k + s.npk.k,
  }), { n: 0, p: 0, k: 0 })

  return (
    <SectionWrapper id="rotation">
      <SectionTitle
        icon="🔄"
        title="4-Season Crop Rotation Planner"
        subtitle="Select a GPS-mapped field to view its AI-optimised multi-season rotation plan. Each plan is computed per-field using soil pH, NDVI, and market price data."
        badge={{ text: 'ML ROTATION ENGINE · FIELD-LINKED', color: 'green' }}
      />

      {/* ── Field Selector ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
          letterSpacing: 1, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#4ade80',
            boxShadow: '0 0 6px #4ade80', display: 'inline-block',
          }} />
          SELECT GPS FIELD — {FIELDS.length} REGISTERED
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}>
          {FIELDS.map((f, i) => (
            <FieldSelectorCard
              key={f.id}
              field={f}
              index={i}
              isSelected={selectedFieldId === f.id}
              onClick={() => { setSelectedFieldId(f.id); setSelectedSeason(0) }}
            />
          ))}
        </div>
      </div>

      {/* ── Field Summary Banner ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={field.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 20, alignItems: 'center',
            padding: '16px 22px', borderRadius: 14, marginBottom: 24,
            background: `linear-gradient(135deg, ${fieldColor}10, rgba(255,255,255,0.02))`,
            border: `1px solid ${fieldColor}30`,
          }}
        >
          {/* GPS polygon thumb */}
          <div style={{
            width: 80, height: 80, borderRadius: 12, overflow: 'hidden',
            background: 'rgba(0,0,0,0.3)', border: `1px solid ${fieldColor}30`, padding: 6,
          }}>
            <MiniPolygon points={field.polygon} color={fieldColor} />
          </div>

          {/* Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontWeight: 900, fontSize: 16 }}>{field.name}</span>
              <span style={{
                fontSize: 9, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                background: `${fieldColor}18`, color: fieldColor, border: `1px solid ${fieldColor}40`,
              }}>{field.status}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              {field.crop} · {field.variety}
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { icon: '📐', label: 'GPS Area', val: fmt(field.area_m2) },
                { icon: '📏', label: 'Acres',    val: fmtAcres(field.area_m2) },
                { icon: '🧪', label: 'Soil pH',  val: field.soilPh },
                { icon: '📡', label: 'GPS Fix',  val: `±${field.gpsAccuracy_cm} cm` },
                { icon: '🌿', label: 'NDVI',     val: field.ndvi },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ fontSize: 11 }}>
                  <span style={{ marginRight: 4 }}>{icon}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{label}: </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: fieldColor }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Corner coords */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 6 }}>GPS CORNERS</div>
            {field.coords.map((c, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                P{i + 1} {c.lat.toFixed(4)}°N {c.lng.toFixed(4)}°E
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── 4-Season Rotation Cards ──────────────────────────────────────── */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 14 }}>
          ROTATION PLAN — {field.name.split('—')[0].trim().toUpperCase()}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`seasons-${field.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid-4"
          style={{ marginBottom: 24 }}
        >
          {seasons.map((s, i) => (
            <SeasonCard
              key={`${field.id}-${s.season}`}
              s={s}
              i={i}
              isSelected={selectedSeason === i}
              onClick={() => setSelectedSeason(i)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ── Detail + NPK + Market ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

        {/* Selected season detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${field.id}-detail-${selectedSeason}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card"
            style={{ padding: 24, border: `1px solid ${seasons[selectedSeason].color}30` }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
              {seasons[selectedSeason].icon} {seasons[selectedSeason].crop} — {seasons[selectedSeason].season}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.65 }}>
              {seasons[selectedSeason].soilNote}
            </p>
            {[
              { label: 'Field',         value: field.name },
              { label: 'GPS Area',      value: `${fmt(field.area_m2)} (${fmtAcres(field.area_m2)})` },
              { label: 'Period',        value: seasons[selectedSeason].months },
              { label: 'Market Price',  value: seasons[selectedSeason].marketPrice },
              { label: 'Yield Estimate', value: seasons[selectedSeason].yieldEst },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: seasons[selectedSeason].color,
                  maxWidth: '55%', textAlign: 'right',
                }}>{value}</span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Cumulative NPK for this field's rotation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${field.id}-npk`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card"
            style={{ padding: 24 }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              Cumulative NPK Balance
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>
              4-season total for {field.name}
            </p>
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
                  }}>{v > 0 ? '+' : ''}{v} {unit}</span>
                </div>
                <div className="progress-bar">
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.min(Math.abs(v) / 1.5, 100)}%`,
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
                ? 'Significant nitrogen depletion. Apply 80 kg/ha urea before next season.'
                : 'Nutrient balance is healthy. Minimal amendment required.'}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Live Market Prices */}
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
