import { motion } from 'framer-motion'

/**
 * Reusable section wrapper — handles section id, padding, animated entrance
 */
export default function SectionWrapper({ id, children, style = {} }) {
  return (
    <motion.section
      id={id}
      className="section"
      style={{ position: 'relative', ...style }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="container">
        {children}
      </div>
    </motion.section>
  )
}

/**
 * Standard section title block
 */
export function SectionTitle({ icon, title, subtitle, badge }) {
  return (
    <div style={{ marginBottom: 36 }}>
      {badge && (
        <div className={`badge badge-${badge.color || 'green'}`} style={{ marginBottom: 14 }}>
          {badge.dot && <span className="pulse-dot" style={{ width: 6, height: 6 }} />}
          {badge.text}
        </div>
      )}
      <div className="section-header">
        {icon && (
          <div className="section-icon">
            {icon}
          </div>
        )}
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800 }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{
          color: 'var(--text-secondary)', fontSize: 15, maxWidth: 600,
          marginTop: 8, lineHeight: 1.65,
        }}>
          {subtitle}
        </p>
      )}
      <div style={{
        height: 2, width: 40,
        background: 'var(--gradient-green)',
        borderRadius: 1, marginTop: 16,
      }} />
    </div>
  )
}
