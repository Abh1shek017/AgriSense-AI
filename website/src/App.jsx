import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SensorPanel from './components/SensorPanel'
import CircuitAnimator from './components/CircuitAnimator'
import EnsemblePanel from './components/EnsemblePanel'
import ForecastChart from './components/ForecastChart'
import WorkflowDAG from './components/WorkflowDAG'
import FieldMap from './components/FieldMap'
import MQTTDashboard from './components/MQTTDashboard'
import AnomalyFeed from './components/AnomalyFeed'
import RotationPlanner from './components/RotationPlanner'
import IrrigationScheduler from './components/IrrigationScheduler'
import KafkaMonitor from './components/KafkaMonitor'
import EdgeSimPanel from './components/EdgeSimPanel'
import RLConfig from './components/RLConfig'

const SECTIONS = [
  'hero', 'sensor', 'circuit', 'ensemble', 'forecast', 'dag',
  'fieldmap', 'mqtt', 'anomaly', 'rotation', 'irrigation',
  'kafka', 'edge', 'rl',
]

export default function App() {
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    const observers = SECTIONS.map(id => {
      const el = document.getElementById(id)
      if (!el) return null
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.3 }
      )
      observer.observe(el)
      return observer
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  return (
    <div>
      <Navbar activeSection={activeSection} />

      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <Hero />

        {/* Divider between hero and dashboard */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.2), transparent)',
          margin: '0 24px',
        }} />

        <SensorPanel />
        <CircuitAnimator />
        <EnsemblePanel />
        <ForecastChart />
        <WorkflowDAG />
        <FieldMap />
        <MQTTDashboard />
        <AnomalyFeed />
        <RotationPlanner />
        <IrrigationScheduler />
        <KafkaMonitor />
        <EdgeSimPanel />
        <RLConfig />

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid var(--glass-border)',
          padding: '32px 24px',
          textAlign: 'center',
          marginTop: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28,
              background: 'var(--gradient-green)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>🌱</div>
            <span style={{ fontSize: 15, fontWeight: 800 }}>
              <span className="gradient-text">AgriSense AI</span>
              <span style={{ color: 'var(--text-muted)' }}> — IoT Smart Crop Prediction System</span>
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            FastAPI · React · MQTT · PyTorch · Leaflet.js · Three.js · D3.js · PostgreSQL · Firebase
          </p>
        </footer>
      </main>
    </div>
  )
}
