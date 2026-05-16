import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'
import { FIELDS, fmt, fmtAcres } from '../data/fields'

function NdviBar({ value }) {
  const color = value >= 0.7 ? 'var(--green-400)' : value >= 0.5 ? 'var(--amber-400)' : 'var(--red-400)'
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
        <span>NDVI Index</span><span style={{ color, fontFamily: 'var(--font-mono)' }}>{value}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  )
}

function PolygonPreview({ points, color }) {
  const pts = points.map(([x, y]) => `${x},${y}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Grid */}
      {[20, 40, 60, 80].map(v => (
        <g key={v}>
          <line x1={v} y1={0} x2={v} y2={100} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <line x1={0} y1={v} x2={100} y2={v} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        </g>
      ))}
      {/* Field polygon */}
      <polygon
        points={pts}
        fill={`${color}28`}
        stroke={color}
        strokeWidth="1.5"
        filter="url(#glow)"
      />
      {/* Corner markers */}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={color} opacity="0.9" />
      ))}
      {/* Cardinal labels */}
      <text x="50" y="8"  textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.25)">N</text>
      <text x="50" y="97" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.25)">S</text>
      <text x="4"  y="52" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.25)">W</text>
      <text x="96" y="52" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.25)">E</text>
    </svg>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function FieldDetail({ field, onClose }) {
  const POLY_COLOR = field.statusColor.replace('var(', '').replace(')', '')
  const polyColorVal =
    field.statusColor === 'var(--green-400)' ? '#4ade80'
    : field.statusColor === 'var(--amber-400)' ? '#fbbf24'
    : '#60a5fa'

  const detailRows = [
    { label: 'Area (m²)',       value: `${field.area_m2.toLocaleString()} m²`,    icon: '📐' },
    { label: 'Area (Hectares)', value: fmt(field.area_m2),                         icon: '🌾' },
    { label: 'Area (Acres)',    value: fmtAcres(field.area_m2),                   icon: '📏' },
    { label: 'Perimeter',      value: `${field.perimeter_m} m`,                   icon: '🔲' },
    { label: 'Elevation',      value: `${field.elevation_m} m ASL`,               icon: '⛰️' },
    { label: 'GPS Accuracy',   value: `±${field.gpsAccuracy_cm} cm`,              icon: '📡' },
    { label: 'Soil pH',        value: field.soilPh,                               icon: '🧪' },
    { label: 'Soil Moisture',  value: `${field.moisture}%`,                       icon: '💧' },
    { label: 'Last GPS Fix',   value: field.lastGPSFix,                           icon: '🕐' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 20 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card"
      style={{ padding: 0, overflow: 'hidden', border: `1px solid ${polyColorVal}30` }}
    >
      {/* Header */}
      <div style={{
        padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: `linear-gradient(135deg, ${polyColorVal}12, transparent)`,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${polyColorVal}20`, border: `1px solid ${polyColorVal}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>#{field.id}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{field.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{field.crop}</div>
        </div>
        <div style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700,
          background: `${polyColorVal}18`, border: `1px solid ${polyColorVal}40`,
          color: polyColorVal,
        }}>{field.status}</div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-muted)', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Left — Details */}
        <div style={{ padding: '20px 22px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 14 }}>
            GPS MEASUREMENT DATA
          </div>

          {/* Big area stat */}
          <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 10, background: `${polyColorVal}10`, border: `1px solid ${polyColorVal}20` }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL FIELD AREA</div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-mono)', color: polyColorVal }}>
              {fmt(field.area_m2)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {field.area_m2.toLocaleString()} m² · {fmtAcres(field.area_m2)}
            </div>
          </div>

          {/* Detail rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detailRows.map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{r.icon}</span>
                <span style={{ color: 'var(--text-muted)', flex: 1 }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: 11 }}>{r.value}</span>
              </div>
            ))}
          </div>

          <NdviBar value={field.ndvi} />

          {/* Variety */}
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>CROP VARIETY</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{field.variety}</div>
          </div>
        </div>

        {/* Right — Polygon + Coords */}
        <div style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 14 }}>
            FIELD BOUNDARY (GPS TRACE)
          </div>

          {/* Polygon SVG */}
          <div style={{
            height: 160, borderRadius: 10, overflow: 'hidden',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 16, padding: 8,
          }}>
            <PolygonPreview points={field.polygon} color={polyColorVal} />
          </div>

          {/* GPS Coordinates */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10 }}>
            CORNER COORDINATES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {field.coords.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: `${polyColorVal}20`, border: `1px solid ${polyColorVal}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: polyColorVal,
                }}>P{i + 1}</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                  {c.lat.toFixed(4)}°N, {c.lng.toFixed(4)}°E
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Field Card (in the list) ─────────────────────────────────────────────────
function FieldCard({ field, index, isSelected, onClick }) {
  const polyColorVal =
    field.statusColor === 'var(--green-400)' ? '#4ade80'
    : field.statusColor === 'var(--amber-400)' ? '#fbbf24'
    : '#60a5fa'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      onClick={onClick}
      className="glass-card"
      style={{
        padding: '16px 18px',
        cursor: 'pointer',
        border: isSelected ? `1px solid ${polyColorVal}60` : '1px solid rgba(255,255,255,0.06)',
        background: isSelected ? `${polyColorVal}0a` : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s ease',
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Field Number Badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: isSelected ? `${polyColorVal}25` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${isSelected ? polyColorVal + '50' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <div style={{ fontSize: 8, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: 0.5 }}>FIELD</div>
          <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-mono)', color: isSelected ? polyColorVal : 'var(--text-primary)', lineHeight: 1 }}>
            #{field.id}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {field.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{field.crop}</div>
        </div>

        {/* Area + Status */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: polyColorVal }}>
            {fmt(field.area_m2)}
          </div>
          <div style={{
            fontSize: 9, fontWeight: 700, marginTop: 4, padding: '2px 8px',
            borderRadius: 20, display: 'inline-block',
            background: `${polyColorVal}15`, color: polyColorVal, border: `1px solid ${polyColorVal}30`,
          }}>{field.status}</div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isSelected ? 90 : 0 }}
          style={{ color: 'var(--text-dim)', fontSize: 12, flexShrink: 0 }}
        >›</motion.div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function FieldMap() {
  const [selectedId, setSelectedId] = useState(null)
  const selected = FIELDS.find(f => f.id === selectedId)

  const totalArea = FIELDS.reduce((s, f) => s + f.area_m2, 0)
  const activeCount = FIELDS.filter(f => f.status === 'Active').length

  return (
    <SectionWrapper id="fieldmap">
      <SectionTitle
        icon="📡"
        title="GPS Field Intelligence"
        subtitle="Real-time field boundary mapping using RTK-GPS modules. Each field's polygon is traced, area computed via Shoelace formula, and synced to the AgriSense IoT network."
        badge={{ text: 'RTK-GPS · SUB-METER PRECISION', color: 'green', dot: true }}
      />

      {/* Summary Stats */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          {
            label: 'Total Fields',
            value: FIELDS.length,
            sub: `${activeCount} active`,
            icon: '🗺️',
            color: 'var(--green-400)',
            bg: 'rgba(74,222,128,0.08)',
          },
          {
            label: 'Total Farm Area',
            value: fmt(totalArea),
            sub: fmtAcres(totalArea),
            icon: '📐',
            color: 'var(--blue-400)',
            bg: 'rgba(96,165,250,0.08)',
          },
          {
            label: 'GPS Fix Quality',
            value: 'RTK-FIXED',
            sub: 'Avg ±10 cm accuracy',
            icon: '📡',
            color: 'var(--amber-400)',
            bg: 'rgba(251,191,36,0.08)',
          },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{
            padding: '18px 20px',
            background: s.bg,
            border: `1px solid ${s.color.replace('var(', '').replace(')', '')}20`,
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Field List + Detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.6fr' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Field List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
            letterSpacing: 1, marginBottom: 4, paddingLeft: 2,
          }}>
            {FIELDS.length} REGISTERED FIELDS — CLICK TO EXPAND
          </div>
          {FIELDS.map((field, i) => (
            <FieldCard
              key={field.id}
              field={field}
              index={i}
              isSelected={selectedId === field.id}
              onClick={() => setSelectedId(prev => prev === field.id ? null : field.id)}
            />
          ))}
        </div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          {selected && (
            <FieldDetail
              key={selected.id}
              field={selected}
              onClose={() => setSelectedId(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      {!selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 20, textAlign: 'center',
            fontSize: 12, color: 'var(--text-dim)',
            padding: '10px 0',
          }}
        >
          Select a field above to view GPS boundary data, coordinates & crop intelligence ↑
        </motion.div>
      )}
    </SectionWrapper>
  )
}
