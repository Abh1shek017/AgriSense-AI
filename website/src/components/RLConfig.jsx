import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const MODELS_RL = [
  { key: 'rf', label: 'Random Forest', weight: 45, color: '#22c55e' },
  { key: 'svm', label: 'SVM (RBF)',    weight: 35, color: '#06b6d4' },
  { key: 'lstm', label: 'LSTM',        weight: 20, color: '#a855f7' },
]

const REWARDS = [
  { key: 'yield',    label: 'Yield Outcome',       value: 0.45, desc: 'Reward shape based on simulated end-of-season final yield vs. projected' },
  { key: 'water',    label: 'Water Efficiency',    value: 0.25, desc: 'Penalty for excessive irrigation vs. ET₀ baseline' },
  { key: 'market',   label: 'Market Price Signal', value: 0.20, desc: 'Bonus when recommended crop aligns with high MSP / market demand' },
  { key: 'soil',     label: 'Soil Health Delta',   value: 0.10, desc: 'Negative reward when NPK balance drops below replenishment threshold' },
]

export default function RLConfig() {
  const [weights, setWeights] = useState({ rf: 45, svm: 35, lstm: 20 })
  const [rewards, setRewards] = useState({ yield: 0.45, water: 0.25, market: 0.20, soil: 0.10 })
  const [saved, setSaved] = useState(false)
  const [episodes, setEpisodes] = useState(1240)

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0)
  const totalReward = Object.values(rewards).reduce((s, v) => s + v, 0)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SectionWrapper id="rl">
      <SectionTitle
        icon="🔬"
        title="RL Feedback & Model Configuration"
        subtitle="Configure Q-learning reward weights and ensemble model voting weights. The RL feedback loop simulates accelerated growing seasons and tunes model weights based on yield outcomes."
        badge={{ text: 'Q-LEARNING REWARD SHAPING', color: 'purple' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Ensemble weights */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Ensemble Voting Weights</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
            Adjust how much each model contributes to the final prediction. Total must equal 100%.
          </p>

          {MODELS_RL.map(m => (
            <div key={m.key} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.label}</span>
                <span style={{
                  fontSize: 16, fontWeight: 900,
                  fontFamily: 'var(--font-mono)', color: m.color,
                }}>{weights[m.key]}%</span>
              </div>
              <input
                type="range" min={5} max={70}
                value={weights[m.key]}
                onChange={e => setWeights(w => ({ ...w, [m.key]: parseInt(e.target.value) }))}
                style={{ width: '100%', accentColor: m.color, cursor: 'pointer' }}
              />
            </div>
          ))}

          <div style={{
            padding: '10px 14px',
            background: totalWeight !== 100 ? 'rgba(248,113,113,0.08)' : 'rgba(34,197,94,0.06)',
            border: `1px solid ${totalWeight !== 100 ? 'rgba(248,113,113,0.25)' : 'rgba(34,197,94,0.2)'}`,
            borderRadius: 8, fontSize: 12,
            color: totalWeight !== 100 ? 'var(--red-400)' : 'var(--green-400)',
          }}>
            Total: {totalWeight}% {totalWeight !== 100 ? `⚠️ Must be 100%` : '✓ Valid'}
          </div>
        </div>

        {/* Reward shaping */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Q-Learning Reward Weights</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
            Shape the RL reward function to balance yield, water use, market value, and soil health.
          </p>

          {REWARDS.map(r => (
            <div key={r.key} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{r.label}</span>
                <span style={{
                  fontSize: 14, fontWeight: 900,
                  fontFamily: 'var(--font-mono)', color: 'var(--purple-400)',
                }}>{rewards[r.key].toFixed(2)}</span>
              </div>
              <input
                type="range" min={0.01} max={0.8} step={0.01}
                value={rewards[r.key]}
                onChange={e => setRewards(rw => ({ ...rw, [r.key]: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer', marginBottom: 4 }}
              />
              <p style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5 }}>{r.desc}</p>
            </div>
          ))}

          <div style={{
            padding: '8px 14px', background: 'rgba(168,85,247,0.06)',
            border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8,
            fontSize: 11, color: 'var(--purple-400)',
          }}>
            Σ reward weights = {totalReward.toFixed(2)}
          </div>
        </div>

        {/* RL Training stats */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Training Status</h3>

          <div className="grid-2" style={{ gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Episodes Simulated', value: episodes.toLocaleString(), color: 'var(--green-400)' },
              { label: 'Avg Reward', value: '0.724', color: 'var(--purple-400)' },
              { label: 'Q-Loss', value: '0.0312', color: 'var(--amber-400)' },
              { label: 'Convergence', value: '78%', color: 'var(--cyan-400)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card" style={{ padding: 14, textAlign: 'center' }}>
                <div style={{
                  fontSize: 22, fontWeight: 900,
                  fontFamily: 'var(--font-mono)', color,
                }}>{value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Season simulation progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
              <span>Season Simulation Progress</span>
              <span style={{ color: 'var(--green-400)', fontFamily: 'var(--font-mono)' }}>Season 3/5</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: '60%' }} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className={saved ? 'btn-primary' : 'btn-primary'}
              style={{ justifyContent: 'center', opacity: saved ? 0.8 : 1 }}
              onClick={handleSave}
            >
              {saved ? '✅ Saved & Applied' : '💾 Save & Retrain'}
            </button>
            <button className="btn-ghost" style={{ justifyContent: 'center' }}
              onClick={() => { setWeights({ rf: 45, svm: 35, lstm: 20 }); setRewards({ yield: 0.45, water: 0.25, market: 0.20, soil: 0.10 }) }}>
              ↩ Reset to Defaults
            </button>
            <button className="btn-ghost" style={{ justifyContent: 'center', color: 'var(--purple-400)' }}
              onClick={() => setEpisodes(e => e + Math.round(Math.random() * 50 + 10))}>
              ▶ Run 50 Episodes
            </button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
