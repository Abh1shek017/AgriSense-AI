// ─── Shared GPS Field Registry ────────────────────────────────────────────────
// Single source of truth for field data; imported by FieldMap & RotationPlanner

export const FIELDS = [
  {
    id: 1,
    name: 'Field Alpha — North Block',
    crop: 'Rice (Oryza sativa)',
    cropShort: 'Rice',
    variety: 'Pusa Basmati 1121',
    status: 'Active',
    statusColor: 'var(--green-400)',
    area_m2: 14320,
    perimeter_m: 484.6,
    ndvi: 0.74,
    soilPh: 6.8,
    moisture: 72,
    lastGPSFix: '2026-05-14 08:32 IST',
    elevation_m: 218,
    gpsAccuracy_cm: 12,
    coords: [
      { lat: 28.6100, lng: 77.2000 },
      { lat: 28.6200, lng: 77.2000 },
      { lat: 28.6200, lng: 77.2200 },
      { lat: 28.6100, lng: 77.2200 },
    ],
    polygon: [[10, 10], [90, 10], [90, 90], [10, 90]],
    // Rotation plan for this field
    rotation: [
      {
        season: 'Kharif 2025', months: 'Jun – Nov', crop: 'Rice', icon: '🌾',
        npk: { n: -45, p: -20, k: -35 }, marketPrice: '₹2,320/qtl', yieldEst: '4.2 t/ha',
        color: '#22c55e', soilNote: 'High water demand. Depletes N significantly.',
      },
      {
        season: 'Rabi 2025–26', months: 'Nov – Apr', crop: 'Wheat', icon: '🌿',
        npk: { n: -30, p: -15, k: -20 }, marketPrice: '₹2,275/qtl', yieldEst: '3.8 t/ha',
        color: '#f59e0b', soilNote: 'Moderate demand. Good after Rice rotation.',
      },
      {
        season: 'Zaid 2026', months: 'Mar – Jun', crop: 'Moong Dal', icon: '🫛',
        npk: { n: +20, p: -5, k: -8 }, marketPrice: '₹7,755/qtl', yieldEst: '1.1 t/ha',
        color: '#10b981', soilNote: 'Nitrogen-fixing legume — replenishes soil N.',
      },
      {
        season: 'Kharif 2026', months: 'Jun – Nov', crop: 'Maize', icon: '🌽',
        npk: { n: -40, p: -18, k: -30 }, marketPrice: '₹2,090/qtl', yieldEst: '5.1 t/ha',
        color: '#a855f7', soilNote: 'Breaks pest cycle from Rice. High yield potential.',
      },
    ],
  },
  {
    id: 2,
    name: 'Field Beta — East Sector',
    crop: 'Wheat (Triticum aestivum)',
    cropShort: 'Wheat',
    variety: 'HD 2967',
    status: 'Active',
    statusColor: 'var(--green-400)',
    area_m2: 9870,
    perimeter_m: 396.8,
    ndvi: 0.65,
    soilPh: 7.1,
    moisture: 58,
    lastGPSFix: '2026-05-14 09:05 IST',
    elevation_m: 204,
    gpsAccuracy_cm: 8,
    coords: [
      { lat: 28.6300, lng: 77.2100 },
      { lat: 28.6400, lng: 77.2100 },
      { lat: 28.6400, lng: 77.2300 },
      { lat: 28.6300, lng: 77.2300 },
    ],
    polygon: [[15, 20], [85, 15], [95, 85], [5, 80]],
    rotation: [
      {
        season: 'Rabi 2025–26', months: 'Nov – Apr', crop: 'Wheat', icon: '🌿',
        npk: { n: -30, p: -15, k: -20 }, marketPrice: '₹2,275/qtl', yieldEst: '3.8 t/ha',
        color: '#f59e0b', soilNote: 'Primary crop. Medium nutrient draw.',
      },
      {
        season: 'Zaid 2026', months: 'Mar – Jun', crop: 'Moong Dal', icon: '🫛',
        npk: { n: +20, p: -5, k: -8 }, marketPrice: '₹7,755/qtl', yieldEst: '0.9 t/ha',
        color: '#10b981', soilNote: 'Short-duration legume. Fixes nitrogen.',
      },
      {
        season: 'Kharif 2026', months: 'Jun – Nov', crop: 'Soybean', icon: '🌱',
        npk: { n: +10, p: -12, k: -18 }, marketPrice: '₹3,880/qtl', yieldEst: '2.2 t/ha',
        color: '#22c55e', soilNote: 'Nitrogen-fixing legume, good after Wheat.',
      },
      {
        season: 'Rabi 2026–27', months: 'Nov – Apr', crop: 'Mustard', icon: '🌼',
        npk: { n: -25, p: -14, k: -22 }, marketPrice: '₹5,450/qtl', yieldEst: '1.6 t/ha',
        color: '#eab308', soilNote: 'Deep-rooted. Improves soil structure post-Soybean.',
      },
    ],
  },
  {
    id: 3,
    name: 'Field Gamma — West Plot',
    crop: 'Maize (Zea mays)',
    cropShort: 'Maize',
    variety: 'Pioneer 30B07',
    status: 'Fallow',
    statusColor: 'var(--amber-400)',
    area_m2: 6540,
    perimeter_m: 325.2,
    ndvi: 0.45,
    soilPh: 6.3,
    moisture: 41,
    lastGPSFix: '2026-05-13 17:48 IST',
    elevation_m: 196,
    gpsAccuracy_cm: 15,
    coords: [
      { lat: 28.6150, lng: 77.2300 },
      { lat: 28.6230, lng: 77.2350 },
      { lat: 28.6200, lng: 77.2450 },
      { lat: 28.6100, lng: 77.2400 },
    ],
    polygon: [[20, 5], [80, 20], [85, 75], [10, 90]],
    rotation: [
      {
        season: 'Kharif 2025', months: 'Jun – Nov', crop: 'Maize', icon: '🌽',
        npk: { n: -40, p: -18, k: -30 }, marketPrice: '₹2,090/qtl', yieldEst: '4.8 t/ha',
        color: '#a855f7', soilNote: 'Current fallow recovery from Maize harvest.',
      },
      {
        season: 'Rabi 2025–26', months: 'Nov – Apr', crop: 'Chickpea', icon: '🫘',
        npk: { n: +15, p: -10, k: -12 }, marketPrice: '₹5,440/qtl', yieldEst: '1.4 t/ha',
        color: '#f97316', soilNote: 'Fallow recovery: Chickpea fixes N for next season.',
      },
      {
        season: 'Kharif 2026', months: 'Jun – Nov', crop: 'Cotton', icon: '☁️',
        npk: { n: -50, p: -20, k: -40 }, marketPrice: '₹6,740/qtl', yieldEst: '2.1 t/ha',
        color: '#06b6d4', soilNote: 'High value cash crop. Heavy feeder — pre-amend NPK.',
      },
      {
        season: 'Rabi 2026–27', months: 'Nov – Apr', crop: 'Lentil', icon: '🌿',
        npk: { n: +18, p: -8, k: -10 }, marketPrice: '₹6,000/qtl', yieldEst: '1.2 t/ha',
        color: '#84cc16', soilNote: 'Nitrogen restorer after Cotton. Break pest cycle.',
      },
    ],
  },
  {
    id: 4,
    name: 'Field Delta — South Reserve',
    crop: 'Soybean (Glycine max)',
    cropShort: 'Soybean',
    variety: 'JS 335',
    status: 'Harvested',
    statusColor: 'var(--blue-400)',
    area_m2: 11200,
    perimeter_m: 426.1,
    ndvi: 0.28,
    soilPh: 6.6,
    moisture: 35,
    lastGPSFix: '2026-05-14 07:15 IST',
    elevation_m: 210,
    gpsAccuracy_cm: 10,
    coords: [
      { lat: 28.6050, lng: 77.2100 },
      { lat: 28.6150, lng: 77.2080 },
      { lat: 28.6160, lng: 77.2280 },
      { lat: 28.6040, lng: 77.2300 },
    ],
    polygon: [[5, 15], [88, 10], [92, 82], [8, 88]],
    rotation: [
      {
        season: 'Kharif 2025', months: 'Jun – Nov', crop: 'Soybean', icon: '🌱',
        npk: { n: +10, p: -12, k: -18 }, marketPrice: '₹3,880/qtl', yieldEst: '2.0 t/ha',
        color: '#22c55e', soilNote: 'Harvested. Field now in post-harvest rest.',
      },
      {
        season: 'Rabi 2025–26', months: 'Nov – Apr', crop: 'Wheat', icon: '🌿',
        npk: { n: -30, p: -15, k: -20 }, marketPrice: '₹2,275/qtl', yieldEst: '4.0 t/ha',
        color: '#f59e0b', soilNote: 'Benefits from Soybean N-fixation. High yield expected.',
      },
      {
        season: 'Zaid 2026', months: 'Mar – Jun', crop: 'Sesame', icon: '🌻',
        npk: { n: -20, p: -10, k: -15 }, marketPrice: '₹14,000/qtl', yieldEst: '0.7 t/ha',
        color: '#fb923c', soilNote: 'Drought-tolerant, high value. Suits summer season.',
      },
      {
        season: 'Kharif 2026', months: 'Jun – Nov', crop: 'Rice', icon: '🌾',
        npk: { n: -45, p: -20, k: -35 }, marketPrice: '₹2,320/qtl', yieldEst: '4.5 t/ha',
        color: '#38bdf8', soilNote: 'Full NPK replenishment needed before transplanting.',
      },
    ],
  },
  {
    id: 5,
    name: 'Field Epsilon — Central Nursery',
    crop: 'Tomato (Solanum lycopersicum)',
    cropShort: 'Tomato',
    variety: 'Arka Vikas',
    status: 'Active',
    statusColor: 'var(--green-400)',
    area_m2: 3210,
    perimeter_m: 228.4,
    ndvi: 0.81,
    soilPh: 6.5,
    moisture: 85,
    lastGPSFix: '2026-05-14 10:22 IST',
    elevation_m: 225,
    gpsAccuracy_cm: 6,
    coords: [
      { lat: 28.6180, lng: 77.2150 },
      { lat: 28.6220, lng: 77.2150 },
      { lat: 28.6220, lng: 77.2250 },
      { lat: 28.6180, lng: 77.2250 },
    ],
    polygon: [[18, 18], [82, 18], [82, 82], [18, 82]],
    rotation: [
      {
        season: 'Kharif 2025', months: 'Jun – Nov', crop: 'Tomato', icon: '🍅',
        npk: { n: -35, p: -25, k: -45 }, marketPrice: '₹2,200/qtl', yieldEst: '28 t/ha',
        color: '#ef4444', soilNote: 'Active nursery. Very high K demand for fruit set.',
      },
      {
        season: 'Rabi 2025–26', months: 'Nov – Apr', crop: 'Onion', icon: '🧅',
        npk: { n: -28, p: -20, k: -30 }, marketPrice: '₹1,800/qtl', yieldEst: '22 t/ha',
        color: '#c084fc', soilNote: 'Companion rotation post-Tomato. Pest management.',
      },
      {
        season: 'Zaid 2026', months: 'Mar – Jun', crop: 'Cowpea', icon: '🫛',
        npk: { n: +22, p: -8, k: -10 }, marketPrice: '₹4,500/qtl', yieldEst: '1.3 t/ha',
        color: '#4ade80', soilNote: 'Nitrogen fixer, short-season, suits hot weather.',
      },
      {
        season: 'Kharif 2026', months: 'Jun – Nov', crop: 'Capsicum', icon: '🫑',
        npk: { n: -30, p: -22, k: -40 }, marketPrice: '₹3,500/qtl', yieldEst: '18 t/ha',
        color: '#f97316', soilNote: 'High value crop. Maintains nursery premium status.',
      },
    ],
  },
]

// Helpers shared across components
export function fmt(m2) {
  if (m2 >= 10000) return `${(m2 / 10000).toFixed(2)} ha`
  return `${m2.toLocaleString()} m²`
}

export function fmtAcres(m2) {
  return `${(m2 * 0.000247105).toFixed(3)} ac`
}

export function resolveColor(statusColor) {
  if (statusColor === 'var(--green-400)') return '#4ade80'
  if (statusColor === 'var(--amber-400)') return '#fbbf24'
  return '#60a5fa'
}
