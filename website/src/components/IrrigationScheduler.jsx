import { motion } from 'framer-motion'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const ZONES_IRRIGATION = [
  { id: 'Z1', name: 'Zone Alpha', et0: 5.8, rain: 2.1, kc: 1.05, crop: 'Rice' },
  { id: 'Z2', name: 'Zone Beta',  et0: 5.8, rain: 2.1, kc: 0.85, crop: 'Wheat' },
  { id: 'Z3', name: 'Zone Gamma', et0: 5.8, rain: 2.1, kc: 0.70, crop: 'Maize' },
  { id: 'Z4', name: 'Zone Delta', et0: 5.8, rain: 2.1, kc: 1.05, crop: 'Rice' },
]

function calcRequirement(zone) {
  const etc = zone.et0 * zone.kc
  const req = Math.max(0, etc - zone.rain)
  return { etc: etc.toFixed(1), req: req.toFixed(1), raw: req }
}

export default function IrrigationScheduler() {
  return (
    <SectionWrapper id="irrigation">
      <SectionTitle
        icon="💧"
        title="Irrigation Scheduler"
        subtitle="Daily water requirements per zone calculated using the FAO Penman-Monteith ET₀ formula. Soil water holding capacity, crop coefficient (Kc), and rainfall forecast are factored in."
        badge={{ text: 'FAO-56 PM FORMULA', color: 'blue' }}
      />

      {/* Formula card */}
      <div className="glass-card" style={{ padding: '16px 24px', marginBottom: 24, borderColor: 'rgba(96,165,250,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Formula:</span>
          <code style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--blue-400)',
            background: 'rgba(96,165,250,0.08)', padding: '4px 12px', borderRadius: 6,
          }}>
            ETc = Kc × ET₀
          </code>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>|</span>
          <code style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--cyan-400)',
            background: 'rgba(6,182,212,0.08)', padding: '4px 12px', borderRadius: 6,
          }}>
            Net Req = ETc − Effective Rainfall
          </code>
        </div>
      </div>

      {/* Per-zone grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {ZONES_IRRIGATION.map((zone, i) => {
          const { etc, req, raw } = calcRequirement(zone)
          const color = raw > 5 ? 'var(--red-400)' : raw > 3 ? 'var(--amber-400)' : 'var(--blue-400)'
          const label = raw > 5 ? 'Critical' : raw > 3 ? 'High' : 'Normal'
          const badgeClass = raw > 5 ? 'badge-red' : raw > 3 ? 'badge-amber' : 'badge-blue'

          return (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card"
              style={{ padding: 22, border: `1px solid ${color}25` }}
            >
              {/* Zone header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{zone.id}</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{zone.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{zone.crop}</div>
                </div>
                <span className={`badge ${badgeClass}`} style={{ fontSize: 9 }}>{label}</span>
              </div>

              {/* Water drop + mm value */}
              <div style={{ textAlign: 'center', margin: '16px 0' }}>
                <div style={{ fontSize: 36 }}>
                  {raw > 5 ? '🔴' : raw > 3 ? '🟡' : '💧'}
                </div>
                <div style={{
                  fontSize: 36, fontWeight: 900, fontFamily: 'var(--font-mono)',
                  color, lineHeight: 1.1,
                }}>{req}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>mm required today</div>
              </div>

              {/* ET details */}
              {[
                { label: 'ET₀', value: `${zone.et0} mm/day` },
                { label: 'Kc', value: zone.kc },
                { label: 'ETc', value: `${etc} mm` },
                { label: 'Rain', value: `${zone.rain} mm` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </motion.div>
          )
        })}
      </div>

      {/* Weekly schedule chart */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
          7-Day Irrigation Schedule — Zone Alpha (Rice)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
            const mm = [3.7, 4.1, 5.8, 5.2, 2.1, 3.4, 4.6][i]
            const color = mm > 5 ? 'var(--red-400)' : mm > 3.5 ? 'var(--amber-400)' : 'var(--blue-400)'
            return (
              <div key={day} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>{day}</div>
                <div style={{
                  height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  marginBottom: 6,
                }}>
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${(mm / 6) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                    style={{
                      width: '60%', borderRadius: '4px 4px 0 0',
                      background: `linear-gradient(to top, ${color}, ${color}80)`,
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>
                  {mm}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>mm</div>
              </div>
            )
          })}
        </div>
      </div>
    </SectionWrapper>
  )
}
