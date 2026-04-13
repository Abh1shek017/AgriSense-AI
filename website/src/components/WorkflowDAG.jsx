import { useCallback } from 'react'
import {
  ReactFlow,
  addEdge, useNodesState, useEdgesState,
  Controls, Background, MiniMap, MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import SectionWrapper, { SectionTitle } from './SectionWrapper'

const nodeStyle = (color, bg = 'rgba(13,26,16,0.95)') => ({
  background: bg,
  border: `1px solid ${color}50`,
  borderRadius: 12,
  padding: '12px 18px',
  color: '#f0fdf4',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  fontWeight: 600,
  boxShadow: `0 0 20px ${color}20`,
  minWidth: 120,
  textAlign: 'center',
})

const INIT_NODES = [
  // Layer 0 — Sensors
  { id: 's1', position: { x: 20,  y: 60  }, data: { label: '🌡️ Temp Sensor'   }, style: nodeStyle('#f59e0b') },
  { id: 's2', position: { x: 20,  y: 150 }, data: { label: '🌱 Soil EC'        }, style: nodeStyle('#22c55e') },
  { id: 's3', position: { x: 20,  y: 240 }, data: { label: '💧 Humidity'       }, style: nodeStyle('#06b6d4') },
  { id: 's4', position: { x: 20,  y: 330 }, data: { label: '☀️ Light'          }, style: nodeStyle('#a855f7') },

  // Layer 1 — Edge Node
  { id: 'e1', position: { x: 230, y: 185 }, data: { label: '🖥️ Edge Node\n(Outlier Filter)' }, style: nodeStyle('#3b82f6', 'rgba(10,20,35,0.95)') },

  // Layer 2 — Kafka Pipeline
  { id: 'k1', position: { x: 420, y: 60  }, data: { label: '📥 Ingest'         }, style: nodeStyle('#10b981') },
  { id: 'k2', position: { x: 420, y: 150 }, data: { label: '✅ Validate'       }, style: nodeStyle('#22c55e') },
  { id: 'k3', position: { x: 420, y: 240 }, data: { label: '🔄 Transform'      }, style: nodeStyle('#06b6d4') },
  { id: 'k4', position: { x: 420, y: 330 }, data: { label: '🧮 Feature Eng.'   }, style: nodeStyle('#8b5cf6') },

  // Layer 3 — ML Models
  { id: 'm1', position: { x: 620, y: 60  }, data: { label: '🌲 Random Forest'   }, style: nodeStyle('#22c55e') },
  { id: 'm2', position: { x: 620, y: 185 }, data: { label: '📐 SVM (RBF)'      }, style: nodeStyle('#06b6d4') },
  { id: 'm3', position: { x: 620, y: 310 }, data: { label: '🔁 LSTM'           }, style: nodeStyle('#a855f7') },

  // Layer 4 — Ensemble + Output
  { id: 'en', position: { x: 820, y: 185 }, data: { label: '⚖️ Ensemble\nVoting' }, style: nodeStyle('#f59e0b', 'rgba(25,20,5,0.95)') },
  { id: 'out', position: { x: 1000, y: 185 }, data: { label: '🌾 Crop\nPrediction' }, style: nodeStyle('#22c55e', 'rgba(5,25,10,0.95)') },
]

const mkEdge = (source, target, label = '', color = '#22c55e') => ({
  id: `${source}-${target}`,
  source, target,
  label,
  labelStyle: { fill: '#6b8f6e', fontSize: 9, fontFamily: 'JetBrains Mono' },
  labelBgStyle: { fill: 'rgba(3,10,6,0.8)' },
  style: { stroke: color, strokeWidth: 1.5 },
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, color },
})

const INIT_EDGES = [
  mkEdge('s1', 'e1', 'I²C', '#f59e0b'),
  mkEdge('s2', 'e1', 'ADC', '#22c55e'),
  mkEdge('s3', 'e1', 'UART', '#06b6d4'),
  mkEdge('s4', 'e1', 'SPI', '#a855f7'),
  mkEdge('e1', 'k1', 'MQTT'),
  mkEdge('k1', 'k2'),
  mkEdge('k2', 'k3'),
  mkEdge('k3', 'k4'),
  mkEdge('k4', 'm1', 'RF features'),
  mkEdge('k4', 'm2', 'SVM features', '#06b6d4'),
  mkEdge('k4', 'm3', 'Time series', '#a855f7'),
  mkEdge('m1', 'en', '45%', '#22c55e'),
  mkEdge('m2', 'en', '35%', '#06b6d4'),
  mkEdge('m3', 'en', '20%', '#a855f7'),
  mkEdge('en', 'out', 'Verdict', '#f59e0b'),
]

export default function WorkflowDAG() {
  const [nodes, , onNodesChange] = useNodesState(INIT_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState(INIT_EDGES)

  const onConnect = useCallback(
    (params) => setEdges(e => addEdge({ ...params, animated: true, style: { stroke: '#22c55e' } }, e)),
    [setEdges]
  )

  return (
    <SectionWrapper id="dag">
      <SectionTitle
        icon="🔗"
        title="Workflow DAG Visualiser"
        subtitle="Interactive directed acyclic graph showing the full data flow from sensor nodes through edge processing, Kafka-style pipeline, parallel ML models, and weighted ensemble voting."
        badge={{ text: 'REACT FLOW · INTERACTIVE', color: 'green' }}
      />

      <div
        className="glass-card"
        style={{ height: 480, padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          style={{ borderRadius: 20 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(34,197,94,0.04)" gap={24} />
          <Controls
            style={{
              background: 'rgba(3,10,6,0.9)',
              border: '1px solid rgba(34,197,94,0.15)',
              borderRadius: 8,
            }}
          />
          <MiniMap
            nodeColor={(n) => n.style?.border?.replace(/50\)|30\)/, '99)') || '#22c55e'}
            style={{
              background: 'rgba(3,10,6,0.9)',
              border: '1px solid rgba(34,197,94,0.15)',
              borderRadius: 8,
            }}
            maskColor="rgba(3,10,6,0.7)"
          />
        </ReactFlow>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', marginTop: 12 }}>
        Drag nodes · Scroll to zoom · Click and drag to pan · Connect nodes to add edges
      </p>
    </SectionWrapper>
  )
}
