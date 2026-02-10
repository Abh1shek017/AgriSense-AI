"""
rainfall.py — Rainfall fallback utility for the Crop Recommendation API.

When the ESP32 sensor payload does not include a 'rainfall' value (the field
is optional because most low-cost IoT kits lack a rain gauge), the system
needs a reasonable default so the ML model can still make a prediction.

Fallback Strategy (in order of preference):
  1. Query a live weather API (e.g., OpenWeatherMap, Visual Crossing) using
     the device's GPS coordinates to get recent / forecasted rainfall.
     → This is a PLACEHOLDER; it currently returns a mock value.
  2. Use a historical district-level average from a local lookup table.
     → This is what the mock function below simulates.

TODO: Replace `fetch_rainfall_from_weather_api()` with a real HTTP call
      once an API key and GPS integration are available.
"""

import random
from typing import Optional


# ──────────────────────────────────────────────────────────────────────────────
# Historical average rainfall (mm) — mock lookup table
# In production this would be a database keyed by (district, month).
# ──────────────────────────────────────────────────────────────────────────────
HISTORICAL_RAINFALL_AVERAGES = {
    "default": 120.0,   # All-India Kharif-season average (approximate)
    "january":  15.0,
    "february": 20.0,
    "march":    30.0,
    "april":    45.0,
    "may":      65.0,
    "june":     165.0,
    "july":     280.0,
    "august":   260.0,
    "september":195.0,
    "october":  110.0,
    "november": 40.0,
    "december": 15.0,
}


def fetch_rainfall_from_weather_api(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> Optional[float]:
    """
    PLACEHOLDER — Query a weather API for recent rainfall data.

    In production, this function would:
      1. Accept the device's GPS coordinates.
      2. Call an external weather API (e.g., OpenWeatherMap /data/2.5/weather).
      3. Parse the response and return the rainfall in mm for the last 24h.

    For now, it returns a mock value between 50–200 mm to simulate a
    successful API response.

    Args:
        latitude:  GPS latitude of the IoT device (unused in mock).
        longitude: GPS longitude of the IoT device (unused in mock).

    Returns:
        Estimated rainfall in mm, or None if the API call fails.
    """
    # Simulated API response — replace with a real HTTP call in production
    try:
        mock_rainfall = round(random.uniform(50.0, 200.0), 1)
        return mock_rainfall
    except Exception:
        return None


def get_default_rainfall() -> float:
    """
    Return a reasonable default rainfall value when the sensor payload
    does not include one.

    The fallback chain is:
      1. Try the weather API placeholder  →  use its value if successful.
      2. Fall back to the historical all-India average (120 mm).

    This ensures the ML model always receives a numeric rainfall input,
    even if the IoT device does not have a rain gauge.

    Returns:
        float — Estimated rainfall in mm.
    """
    # Attempt 1: Try the (mock) weather API
    api_rainfall = fetch_rainfall_from_weather_api()
    if api_rainfall is not None:
        return api_rainfall

    # Attempt 2: Historical average fallback
    return HISTORICAL_RAINFALL_AVERAGES["default"]
