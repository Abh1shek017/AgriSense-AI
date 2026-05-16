/**
 * forecastService.js
 * Fetches real-time 14-day weather forecast from Open-Meteo.
 * Free API — no key required. Docs: https://open-meteo.com/en/docs
 */

const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

/**
 * Get the user's current GPS coordinates via the browser Geolocation API.
 * Returns { latitude, longitude, locationLabel }
 */
export async function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(`Location access denied: ${err.message}`)),
      { timeout: 10000, maximumAge: 300000 }
    )
  })
}

/**
 * Fetch 14-day forecast + current conditions from Open-Meteo.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<ForecastResult>}
 */
export async function fetchForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'visibility',
      'precipitation',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'wind_speed_10m_max',
      'uv_index_max',
      'et0_fao_evapotranspiration',
    ].join(','),
    timezone: 'auto',
    forecast_days: '14',
  })

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Open-Meteo API error: ${res.status}`)
  const data = await res.json()

  // ── Current weather ──────────────────────────────────────────────────────
  const cur = data.current
  const current = {
    temperature: cur.temperature_2m,
    humidity: cur.relative_humidity_2m,
    apparentTemperature: cur.apparent_temperature,
    weatherCode: cur.weather_code,
    windSpeed: cur.wind_speed_10m,
    visibility: (cur.visibility ?? 10000) / 1000, // convert m → km
    precipitation: cur.precipitation ?? 0,
    description: wmoDescription(cur.weather_code),
    icon: wmoEmoji(cur.weather_code),
  }

  // ── 14-day daily ─────────────────────────────────────────────────────────
  const d = data.daily
  const days = d.time.map((dateStr, i) => {
    const date = new Date(dateStr)
    const maxTemp = d.temperature_2m_max[i] ?? 0
    const minTemp = d.temperature_2m_min[i] ?? 0
    const precip = d.precipitation_sum[i] ?? 0
    const wind = d.wind_speed_10m_max[i] ?? 0
    const code = d.weather_code[i] ?? 0
    const uv = d.uv_index_max[i] ?? 0
    const et0 = d.et0_fao_evapotranspiration[i] ?? 0

    // Suitability score: heuristic based on temp + rain + UV
    const tempScore = maxTemp >= 20 && maxTemp <= 34 ? 100 : maxTemp < 15 ? 30 : maxTemp > 40 ? 20 : 60
    const rainScore = precip === 0 ? 80 : precip < 5 ? 100 : precip < 15 ? 85 : precip < 30 ? 60 : 30
    const uvScore = uv < 6 ? 100 : uv < 9 ? 85 : 65
    const suitability = Math.round(tempScore * 0.45 + rainScore * 0.35 + uvScore * 0.20)
    const upper = Math.min(100, suitability + Math.round(5 + Math.random() * 8))
    const lower = Math.max(20, suitability - Math.round(5 + Math.random() * 10))

    return {
      date,
      dateStr,
      day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      icon: wmoEmoji(code),
      tempHigh: Math.round(maxTemp),
      tempLow: Math.round(minTemp),
      rain: parseFloat(precip.toFixed(1)),
      windSpeed: parseFloat(wind.toFixed(1)),
      uvIndex: parseFloat(uv.toFixed(1)),
      et0: parseFloat(et0.toFixed(1)),
      weatherCode: code,
      description: wmoDescription(code),
      suitability,
      upper,
      lower,
      crop: bestCropForDay(maxTemp, precip, code),
    }
  })

  // ── Location label from timezone ─────────────────────────────────────────
  const tz = data.timezone ?? 'Unknown'
  const locationLabel = tz.replace(/_/g, ' ').split('/').pop()

  // ── Smart crop insights ──────────────────────────────────────────────────
  const insights = generateInsights(days, current)

  return { current, days, locationLabel, insights, fetchedAt: new Date() }
}

// ─── Crop Insights ──────────────────────────────────────────────────────────

function generateInsights(days, current) {
  const insights = []

  // 1. Optimal sowing window
  const clearCount = days.slice(0, 5).filter(d => d.rain < 2 && d.weatherCode < 50).length
  if (clearCount >= 3) {
    insights.push({
      type: 'success',
      icon: '🌱',
      text: `Optimal sowing window: ${clearCount} clear days in the next 5 days. Ideal for field operations.`,
    })
  }

  // 2. Heavy rain alert
  const heavyRain = days.find(d => d.rain > 25)
  if (heavyRain) {
    insights.push({
      type: 'warning',
      icon: '🌧️',
      text: `Heavy rainfall (${heavyRain.rain} mm) expected on ${heavyRain.label}. Delay field operations and inspect drainage channels.`,
    })
  }

  // 3. High ET₀ irrigation alert
  const highEt = days.slice(0, 7).find(d => d.et0 > 6)
  if (highEt) {
    insights.push({
      type: 'info',
      icon: '💧',
      text: `High evapotranspiration (${highEt.et0} mm/day) on ${highEt.label}. Increase irrigation to prevent water stress.`,
    })
  }

  // 4. Cold night warning
  const coldNight = days.find(d => d.tempLow < 10)
  if (coldNight) {
    insights.push({
      type: 'warning',
      icon: '🌡️',
      text: `Night temperatures drop to ${coldNight.tempLow}°C around ${coldNight.label}. Protect seedlings and frost-sensitive crops.`,
    })
  }

  // 5. Heat stress
  const hotDay = days.find(d => d.tempHigh > 38)
  if (hotDay) {
    insights.push({
      type: 'danger',
      icon: '🔥',
      text: `Heat stress risk: ${hotDay.tempHigh}°C on ${hotDay.label}. Consider mulching and shift irrigation to early morning.`,
    })
  }

  // 6. High UV
  const highUv = days.slice(0, 7).find(d => d.uvIndex > 8)
  if (highUv) {
    insights.push({
      type: 'info',
      icon: '☀️',
      text: `UV Index ${highUv.uvIndex} expected on ${highUv.label}. Risk of leaf scorch on young crops.`,
    })
  }

  // 7. Dry spell
  let streak = 0, maxStreak = 0
  for (const d of days) {
    streak = d.rain < 2 ? streak + 1 : 0
    if (streak > maxStreak) maxStreak = streak
  }
  if (maxStreak >= 7) {
    insights.push({
      type: 'warning',
      icon: '🏜️',
      text: `Dry spell alert: ${maxStreak} consecutive days with <2 mm rainfall. Monitor soil moisture closely.`,
    })
  }

  if (insights.length === 0) {
    insights.push({
      type: 'success',
      icon: '✅',
      text: 'Conditions look stable over the next 14 days. Continue regular monitoring.',
    })
  }

  return insights
}

// ─── WMO Weather Code Helpers ────────────────────────────────────────────────

function wmoDescription(code) {
  if (code === 0) return 'Clear Sky'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 9) return 'Overcast'
  if (code <= 29) return 'Fog / Mist'
  if (code <= 39) return 'Drizzle'
  if (code <= 49) return 'Fog'
  if (code <= 59) return 'Drizzle'
  if (code <= 69) return 'Rain'
  if (code <= 79) return 'Snow'
  if (code <= 84) return 'Rain Showers'
  if (code <= 94) return 'Thunderstorm'
  return 'Heavy Thunderstorm'
}

function wmoEmoji(code) {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code <= 3) return '⛅'
  if (code <= 9) return '☁️'
  if (code <= 49) return '🌫️'
  if (code <= 69) return '🌧️'
  if (code <= 79) return '🌨️'
  if (code <= 84) return '🌦️'
  return '⛈️'
}

function bestCropForDay(maxTemp, rain, code) {
  if (code >= 80) return 'Avoid sowing'
  if (maxTemp > 38) return 'Heat-tolerant (Bajra)'
  if (maxTemp < 15) return 'Cool-season (Mustard)'
  if (rain > 20) return 'Paddy (Rice)'
  if (maxTemp >= 25 && maxTemp <= 34 && rain < 10) return 'Maize'
  if (maxTemp >= 20 && maxTemp <= 30) return 'Wheat'
  return 'Rice'
}
