import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const MODELS = [
  {
    id: 'rf',
    name: 'Random Forest',
    icon: '🌲',
    color: '#22c55e',
    accent: 'rgba(34,197,94,0.12)',
    badge: 'Tabular Expert',
    topPick: 'Rice',
    confidence: 87.4,
    features: ['Soil NPK', 'pH', 'Rainfall', 'Humidity'],
    desc: 'Ensemble of 200 decision trees trained on the Kaggle Crop Recommendation dataset. Handles non-linear feature interactions naturally and provides feature importance scores.',
  },
  {
    id: 'svm',
    name: 'SVM (RBF Kernel)',
    icon: '📐',
    color: '#06b6d4',
    accent: 'rgba(6,182,212,0.12)',
    badge: 'Boundary Finder',
    topPick: 'Rice',
    confidence: 82.9,
    features: ['Temperature', 'Humidity', 'pH', 'N'],
    desc: 'Support Vector Machine with radial basis function kernel. Excels at finding optimal decision boundaries in high-dimensional feature space for crop suitability classification.',
  },
  {
    id: 'lstm',
    name: 'LSTM Network',
    icon: '🔁',
    color: '#a855f7',
    accent: 'rgba(168,85,247,0.12)',
    badge: 'Temporal Expert',
    topPick: 'Wheat',
    confidence: 74.3,
    features: ['14-day forecast', 'Temp trend', 'Rainfall seq'],
    desc: 'Long Short-Term Memory network trained on 30-day weather sequences. Captures seasonal patterns and temporal dependencies that tabular models miss.',
  },
]

const FINAL = {
  crop: 'Rice',
  confidence: 82.7,
  weights: { rf: 0.45, svm: 0.35, lstm: 0.20 },
}

export default function EnsemblePanel() {
  const [activeModel, setActiveModel] = useState(null)
  const [animated, setAnimated] = useState(false)

  return (
    <SectionWrapper id="ensemble">
      <SectionTitle
        icon="🧠"
        title="ML Ensemble Voting Panel"
        subtitle="Three specialized models debate each prediction. RF handles soil chemistry, SVM finds class boundaries, LSTM reads temporal weather patterns — weighted voting produces the final verdict."
        badge={{ text: 'ENSEMBLE ARCHITECTURE', color: 'purple' }}
      />

      {/* Model cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {MODELS.map((model, i) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="glass-card"
            onClick={() => setActiveModel(activeModel === model.id ? null : model.id)}
            style={{
              padding: 24, cursor: 'pointer',
              border: `1px solid ${activeModel === model.id ? model.color + '50' : 'var(--glass-border)'}`,
              background: activeModel === model.id ? model.accent : 'var(--glass-bg)',
              transition: 'all 0.25s',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: model.accent,
                border: `1px solid ${model.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>{model.icon}</div>
              <span className="badge" style={{
                background: model.accent,
                border: `1px solid ${model.color}30`,
                color: model.color,
                fontSize: 9,
              }}>{model.badge}</span>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{model.name}</h3>

            {/* Top pick */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 16, padding: '8px 12px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8, border: '1px solid var(--glass-border)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Top pick:</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: model.color }}>{model.topPick}</span>
            </div>

            {/* Confidence */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Confidence</span>
                <span style={{
                  fontSize: 20, fontWeight: 900,
                  color: model.color, fontFamily: 'var(--font-mono)',
                }}>{model.confidence}%</span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  style={{ background: `linear-gradient(90deg, ${model.color}, ${model.color}80)` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${model.confidence}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.15 }}
                />
              </div>
            </div>

            {/* Key features */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
              {model.features.map(f => (
                <span key={f} style={{
                  padding: '2px 8px',
                  background: `${model.color}10`,
                  border: `1px solid ${model.color}20`,
                  borderRadius: 4,
                  fontSize: 10, color: model.color,
                  fontFamily: 'var(--font-mono)',
                }}>{f}</span>
              ))}
            </div>

            {/* Weight in ensemble */}
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              Ensemble weight: <strong style={{ color: model.color }}>
                {(FINAL.weights[model.id] * 100).toFixed(0)}%
              </strong>
            </div>

            {/* Description (expanded) */}
            {activeModel === model.id && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  fontSize: 12, color: 'var(--text-secondary)',
                  marginTop: 14, lineHeight: 1.65,
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: 12,
                }}
              >{model.desc}</motion.p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Final verdict */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card"
        style={{
          padding: 28,
          border: '1px solid rgba(34,197,94,0.3)',
          background: 'rgba(34,197,94,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>
              🏆 ENSEMBLE FINAL VERDICT
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              🌾 <span className="gradient-text">{FINAL.crop}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Weighted vote: RF(45%) + SVM(35%) + LSTM(20%)
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }} className="gradient-text">
              {FINAL.confidence}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Overall Confidence</div>
          </div>
        </div>

        {/* Weight visualization */}
        <div style={{ marginTop: 20, height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', gap: 2 }}>
          {MODELS.map(m => (
            <motion.div
              key={m.id}
              initial={{ flex: 0 }}
              whileInView={{ flex: FINAL.weights[m.id] * 100 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              style={{ background: m.color, borderRadius: 3 }}
              title={`${m.name}: ${(FINAL.weights[m.id] * 100).toFixed(0)}%`}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {MODELS.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {m.name.split(' ')[0]} {(FINAL.weights[m.id] * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </SectionWrapper>
  )
}
