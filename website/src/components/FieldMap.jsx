import { useState, useEffect, useRef } from 'react'
import SectionWrapper, { SectionTitle } from './SectionWrapper'
import { motion, AnimatePresence } from 'framer-motion'

// Move to official India center
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 }

const ZONES = [
  {
    id: 'Z1', name: 'Zone Alpha', crop: 'Rice', confidence: 87, 
    color: '#22c55e', ndvi: 0.72,
    coords: [
      { lat: 28.61, lng: 77.20 },
      { lat: 28.62, lng: 77.20 },
      { lat: 28.62, lng: 77.22 },
      { lat: 28.61, lng: 77.22 }
    ],
  },
  {
    id: 'Z2', name: 'Zone Beta', crop: 'Wheat', confidence: 92, 
    color: '#3b82f6', ndvi: 0.65,
    coords: [
      { lat: 28.63, lng: 77.21 },
      { lat: 28.64, lng: 77.21 },
      { lat: 28.64, lng: 77.23 },
      { lat: 28.63, lng: 77.23 }
    ],
  },
  {
    id: 'Z3', name: 'Zone Gamma', crop: 'Maize', confidence: 64, 
    color: '#f59e0b', ndvi: 0.45,
    coords: [
      { lat: 28.615, lng: 77.23 },
      { lat: 28.625, lng: 77.23 },
      { lat: 28.625, lng: 77.245 },
      { lat: 28.615, lng: 77.245 }
    ],
  },
]

export default function FieldMap() {
  const [showNDVI, setShowNDVI] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const polygonsRef = useRef([])

  // Load MapInstance
  useEffect(() => {
    if (!window.mappls) return

    // Initialize map
    mapInstance.current = new window.mappls.Map(mapRef.current, {
      center: [28.62, 77.22], // Mappls uses [lat, lng] usually, but check SDK 3.0 docs
      zoom: 13,
      hybrid: showNDVI // MapmyIndia's way of showing satellite-hybrid layers
    })

    mapInstance.current.addListener('load', () => {
      renderPolygons()
    })

    return () => {
      if (mapInstance.current) {
        // Cleanup if necessary
      }
    }
  }, [])

  // Sync Satellite/NDVI view
  useEffect(() => {
    if (mapInstance.current && window.mappls) {
      if (showNDVI) {
        mapInstance.current.setBaseLayer('hybrid')
      } else {
        mapInstance.current.setBaseLayer('standard')
      }
    }
  }, [showNDVI])

  const renderPolygons = () => {
    if (!mapInstance.current || !window.mappls) return

    // Clear existing
    polygonsRef.current.forEach(p => p.remove())
    polygonsRef.current = []

    ZONES.forEach(zone => {
      const poly = new window.mappls.Polygon({
        map: mapInstance.current,
        paths: zone.coords,
        fillColor: zone.color,
        fillOpacity: 0.35,
        strokeColor: zone.color,
        strokeWeight: 2,
        fit: false
      })

      poly.addListener('click', () => setSelectedZone(zone))
      polygonsRef.current.push(poly)
    })
  }

  return (
    <SectionWrapper id="fieldmap">
      <SectionTitle
        icon="🗺️"
        title="MapmyIndia Geospatial Intel"
        subtitle="Native Indian mapping with sub-meter precision. Leveraging Mappls enterprise SDK for compliant, high-resolution agriculture telemetry."
        badge={{ text: 'MAPMYINDIA · HYPER-LOCAL', color: 'green' }}
      />

      <div className="glass-card" style={{ height: 450, position: 'relative', overflow: 'hidden' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Custom Controls */}
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
          <button
            className={`glass-card ${showNDVI ? 'active' : ''}`}
            onClick={() => setShowNDVI(!showNDVI)}
            style={{
              padding: '8px 16px',
              backgroundColor: showNDVI ? 'var(--green-500)' : 'rgba(0,0,0,0.6)',
              color: 'white',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
            }}
          >
            {showNDVI ? '📡 NDVI ACTIVE' : '🛰️ SATELLITE VIEW'}
          </button>
        </div>

        {/* Zone Detail Overlay */}
        <AnimatePresence>
          {selectedZone && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="glass-card"
              style={{
                position: 'absolute', top: 20, right: 20, width: 280,
                zIndex: 11, padding: 20, borderLeft: `4px solid ${selectedZone.color}`,
                marginTop: 60 // Shift down to avoid overlapping the Satellite toggle
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 16 }}>{selectedZone.name}</h4>
                <button onClick={() => setSelectedZone(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
              </div>
              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>CROP TYPE</div>
                  <div style={{ fontWeight: 600 }}>{selectedZone.crop}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>NDVI SCORE</div>
                  <div style={{ fontWeight: 600, color: 'var(--green-400)' }}>{selectedZone.ndvi}</div>
                </div>
              </div>
              <div style={{ marginTop: 15 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>ML CONFIDENCE</div>
                <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${selectedZone.confidence}%`, background: selectedZone.color, borderRadius: 3 }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: 10, marginTop: 4 }}>{selectedZone.confidence}% Accurate</div>
              </div>
              <button className="btn-primary" style={{ width: '100%', marginTop: 20, fontSize: 11 }}>
                GET HARVEST REPORT
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Status Bar */}
        <div style={{
          position: 'absolute', bottom: 20, left: 20,
          padding: '4px 12px', background: 'rgba(0,0,0,0.6)',
          borderRadius: 20, fontSize: 10, color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 8,
          backdropFilter: 'blur(5px)', border: '1px solid var(--glass-border)',
          zIndex: 5
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-400)' }} />
          POWERED BY MAPMYINDIA (MAPPLS) SDK 3.0
        </div>
      </div>
    </SectionWrapper>
  )
}
