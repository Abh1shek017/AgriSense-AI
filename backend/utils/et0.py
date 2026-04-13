"""
et0.py — FAO Hargreaves Reference Evapotranspiration (ET0) and irrigation
         scheduling utilities for the AgriSense AI backend.

Formula (Hargreaves & Samani, 1985 — FAO-56 simplified):
    ET0 = 0.0023 * Ra * (T_mean + 17.8) * (T_max - T_min) ** 0.5

Where:
    Ra   = Extraterrestrial solar radiation (MJ/m²/day)
    Ra is approximated from latitude and day-of-year when not directly provided.

Reference:
    Allen, R.G. et al. (1998). FAO Irrigation and Drainage Paper No. 56.
"""

from __future__ import annotations

import math
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional


# ──────────────────────────────────────────────────────────────────────────────
# Crop coefficient (Kc) table — mid-season values (FAO-56 Table 12)
# Used to convert ET0 → ETc (crop evapotranspiration)
# ──────────────────────────────────────────────────────────────────────────────
CROP_KC: Dict[str, float] = {
    "Rice":       1.20,
    "Wheat":      1.15,
    "Maize":      1.20,
    "Cotton":     1.15,
    "Sugarcane":  1.25,
    "Soybean":    1.15,
    "Potato":     1.10,
    "Tomato":     1.15,
    "Banana":     1.20,
    "Mango":      0.90,
    "Grapes":     0.90,
    "Apple":      0.90,
    "Coffee":     1.00,
    "Tea":        1.00,
    "Coconut":    1.00,
    "Jute":       1.10,
    "Lentil":     1.05,
    "Chickpea":   1.05,
    "Muskmelon":  1.05,
    "Watermelon": 1.00,
    "Orange":     0.85,
    "Papaya":     1.05,
    "Soya beans": 1.15,
    "default":    1.00,
}

# Irrigation status thresholds (mm/day)
STATUS_THRESHOLDS = {
    "low":      5.0,   # ≤ 5 mm/day → normal (blue)
    "high":     8.0,   # > 5 and ≤ 8 mm/day → high demand (orange)
    # > 8 mm/day → critical deficit (red)
}


def _extraterrestrial_radiation(latitude_deg: float, day_of_year: int) -> float:
    """
    Compute daily extraterrestrial solar radiation Ra (MJ/m²/day).

    Uses the standard FAO-56 formula (Allen et al., 1998, Eq. 21).

    Args:
        latitude_deg: Latitude of the field in decimal degrees (−90 to 90).
        day_of_year:  Julian day number (1 = Jan 1, 365/366 = Dec 31).

    Returns:
        Ra in MJ/m²/day.
    """
    lat_rad = math.radians(latitude_deg)

    # Inverse relative distance Earth-Sun (Eq. 23)
    dr = 1 + 0.033 * math.cos(2 * math.pi / 365 * day_of_year)

    # Solar declination (Eq. 24)
    delta = 0.409 * math.sin(2 * math.pi / 365 * day_of_year - 1.39)

    # Sunset hour angle (Eq. 25)
    cos_ws_arg = -math.tan(lat_rad) * math.tan(delta)
    # Clamp to valid acos domain to handle polar edge cases
    cos_ws_arg = max(-1.0, min(1.0, cos_ws_arg))
    ws = math.acos(cos_ws_arg)

    # Solar constant (MJ/m²/min)
    gsc = 0.0820

    # Ra (Eq. 21)
    ra = (24 * 60 / math.pi) * gsc * dr * (
        ws * math.sin(lat_rad) * math.sin(delta)
        + math.cos(lat_rad) * math.cos(delta) * math.sin(ws)
    )
    return max(ra, 0.0)


def compute_et0_hargreaves(
    temp_max: float,
    temp_min: float,
    latitude_deg: float,
    day_of_year: int,
    solar_radiation_mj: Optional[float] = None,
) -> float:
    """
    Compute reference evapotranspiration using the Hargreaves equation.

    If `solar_radiation_mj` is not provided, Ra is estimated from latitude
    and day-of-year — adequate for planning purposes where measured Rs is
    unavailable.

    Args:
        temp_max:              Daily maximum temperature (°C).
        temp_min:              Daily minimum temperature (°C).
        latitude_deg:          Field latitude (decimal degrees).
        day_of_year:           Julian day number.
        solar_radiation_mj:    Measured solar radiation (MJ/m²/day). Optional.

    Returns:
        ET0 in mm/day (clamped ≥ 0).
    """
    t_mean = (temp_max + temp_min) / 2
    t_range = max(temp_max - temp_min, 0.0)

    ra = solar_radiation_mj if solar_radiation_mj is not None else (
        _extraterrestrial_radiation(latitude_deg, day_of_year)
    )

    et0 = 0.0023 * ra * (t_mean + 17.8) * (t_range ** 0.5)
    return max(round(et0, 2), 0.0)


def _irrigation_status(irrigation_mm: float) -> str:
    """Return colour-coded status string for the irrigation requirement."""
    if irrigation_mm <= STATUS_THRESHOLDS["low"]:
        return "normal"
    if irrigation_mm <= STATUS_THRESHOLDS["high"]:
        return "high_demand"
    return "critical_deficit"


def build_irrigation_schedule(
    zones: int,
    zone_crops: List[str],
    field_id: str,
    latitude_deg: float,
    forecast_days: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Generate today's irrigation schedule for all zones in a field.

    Uses today's date to compute day-of-year and derives temperature ranges
    from the Open-Meteo forecast if provided, falling back to seasonal defaults.

    Args:
        zones:         Number of zones in the field.
        zone_crops:    List of crop names, one per zone.
                       If shorter than `zones`, the last crop is repeated.
        field_id:      Arbitrary field identifier string.
        latitude_deg:  Field latitude for ET0 Ra estimation.
        forecast_days: Optional list of daily forecast dicts from Open-Meteo
                       (each having keys: temp_max, temp_min, rainfall_mm).

    Returns:
        Structured dict suitable for the /api/irrigation/today response.
    """
    today = date.today()
    doy = today.timetuple().tm_yday

    # Pad zone_crops if fewer crops than zones were specified
    while len(zone_crops) < zones:
        zone_crops.append(zone_crops[-1] if zone_crops else "default")

    # Use today's forecast entry if available
    today_forecast: Optional[Dict[str, Any]] = None
    if forecast_days:
        today_forecast = forecast_days[0]

    # Seasonal temperature defaults for India (approximate)
    if today_forecast:
        temp_max = float(today_forecast.get("temp_max", 32.0))
        temp_min = float(today_forecast.get("temp_min", 22.0))
        rainfall_today = float(today_forecast.get("rainfall_mm", 0.0))
    else:
        # Simple seasonal defaults by month
        month = today.month
        seasonal_defaults = {
            1: (26, 14), 2: (29, 16), 3: (33, 20), 4: (36, 24),
            5: (38, 27), 6: (35, 27), 7: (32, 26), 8: (31, 25),
            9: (32, 25), 10: (32, 22), 11: (29, 18), 12: (26, 14),
        }
        temp_max, temp_min = seasonal_defaults.get(month, (32, 22))
        rainfall_today = 0.0

    et0 = compute_et0_hargreaves(temp_max, temp_min, latitude_deg, doy)

    zone_results = []
    for i in range(zones):
        crop = zone_crops[i]
        kc = CROP_KC.get(crop, CROP_KC["default"])
        etc = round(et0 * kc, 2)                     # Crop ET (ETc = ET0 × Kc)
        irrigation_mm = max(round(etc - rainfall_today, 2), 0.0)
        status = _irrigation_status(irrigation_mm)

        zone_results.append({
            "zone_id":        f"zone_{i + 1}",
            "crop":           crop,
            "et0_mm":         et0,
            "kc":             kc,
            "etc_mm":         etc,
            "rainfall_mm":    rainfall_today,
            "irrigation_mm":  irrigation_mm,
            "status":         status,
        })

    return {
        "field_id":     field_id,
        "date":         today.isoformat(),
        "temp_max":     temp_max,
        "temp_min":     temp_min,
        "et0_mm_day":   et0,
        "zones":        zone_results,
    }
