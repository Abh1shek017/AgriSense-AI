"""
external_apis.py — HTTP clients for free public environmental APIs used by AgriSense AI.

APIs covered:
  1. Open-Meteo   — free, no key required — 14-day weather forecast
  2. SoilGrids    — ISRIC REST API, free — soil property profiles per GPS coordinate
  3. NASA POWER   — free, no key required — solar radiation and surface meteorology

All functions return a normalised dict. On failure (timeout, non-200 status,
JSON parse error), they return a dict with "error": True and "message": <str>
so that the Flask route can decide whether to return a partial or failed response.

Timeout for all requests: 10 seconds.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
import requests

# ──────────────────────────────────────────────────────────────────────────────
# Shared HTTP settings
# ──────────────────────────────────────────────────────────────────────────────
_TIMEOUT = 10  # seconds
_HEADERS = {"User-Agent": "AgriSense-AI-Backend/1.0 (contact: agrisense@example.com)"}


def _safe_get(url: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Perform a GET request and return the parsed JSON body.

    Returns None if the request fails for any reason.  All exceptions are
    caught so that a failing external API never brings down the Flask process.
    """
    try:
        response = requests.get(url, params=params, headers=_HEADERS, timeout=_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        return None
    except requests.exceptions.HTTPError:
        return None
    except requests.exceptions.RequestException:
        return None
    except ValueError:
        return None


# ══════════════════════════════════════════════════════════════════════════════
# 1. Open-Meteo — 14-day weather forecast
# ══════════════════════════════════════════════════════════════════════════════

_OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def fetch_openmeteo_forecast(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Fetch a 14-day daily weather forecast from Open-Meteo.

    Args:
        latitude:  GPS latitude (decimal degrees).
        longitude: GPS longitude (decimal degrees).

    Returns:
        Dict with:
          - "days": List of 14 daily dicts each containing:
              date, temp_max, temp_min, rainfall_mm, humidity_pct,
              windspeed_max_kmh, weathercode
          - "units": dict of units per variable
        On error:
          - "error": True, "message": <reason>
    """
    params = {
        "latitude":               latitude,
        "longitude":              longitude,
        "daily":                  [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "relative_humidity_2m_max",
            "windspeed_10m_max",
            "weathercode",
        ],
        "forecast_days":          14,
        "timezone":               "auto",
    }

    data = _safe_get(_OPEN_METEO_URL, params)

    if data is None:
        return {"error": True, "message": "Open-Meteo API request failed or timed out."}

    # ── Normalise the response into a flat list of daily dicts ────────────────
    try:
        daily = data["daily"]
        days: List[Dict[str, Any]] = []
        n = len(daily["time"])
        for i in range(n):
            days.append({
                "date":              daily["time"][i],
                "temp_max":          daily["temperature_2m_max"][i],
                "temp_min":          daily["temperature_2m_min"][i],
                "rainfall_mm":       daily["precipitation_sum"][i] or 0.0,
                "humidity_pct":      daily.get("relative_humidity_2m_max", [None] * n)[i],
                "windspeed_max_kmh": daily["windspeed_10m_max"][i],
                "weathercode":       daily["weathercode"][i],
            })
        return {
            "source": "Open-Meteo",
            "days":   days,
            "units": {
                "temp_max":          "°C",
                "temp_min":          "°C",
                "rainfall_mm":       "mm",
                "humidity_pct":      "%",
                "windspeed_max_kmh": "km/h",
            },
        }
    except (KeyError, TypeError, IndexError):
        return {"error": True, "message": "Unexpected Open-Meteo response format."}


# ══════════════════════════════════════════════════════════════════════════════
# 2. SoilGrids ISRIC — soil properties per GPS coordinate
# ══════════════════════════════════════════════════════════════════════════════

_SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"

_SOILGRIDS_PROPERTIES = [
    "phh2o",       # Soil pH in water
    "nitrogen",    # Total nitrogen (cg/kg)
    "clay",        # Clay content (g/kg)
    "sand",        # Sand content (g/kg)
    "silt",        # Silt content (g/kg)
    "soc",         # Soil organic carbon (dg/kg)
    "bdod",        # Bulk density (cg/cm³)
]

_SOILGRIDS_DEPTH = "0-5cm"   # Topsoil layer


def fetch_soilgrids_profile(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Fetch topsoil (0–5 cm) properties from SoilGrids ISRIC v2.0.

    Args:
        latitude:  GPS latitude (decimal degrees).
        longitude: GPS longitude (decimal degrees).

    Returns:
        Dict with:
          - "ph":             Soil pH (0–14)
          - "nitrogen":       Total N (g/kg)
          - "clay":           Clay fraction (%)
          - "sand":           Sand fraction (%)
          - "silt":           Silt fraction (%)
          - "organic_carbon": SOC (g/kg)
          - "bulk_density":   Bulk density (g/cm³)
          - "depth":          "0-5cm"
          - "source":         "SoilGrids ISRIC v2.0"
        On error:
          - "error": True, "message": <reason>
    """
    params = {
        "lon":        longitude,
        "lat":        latitude,
        "property":   _SOILGRIDS_PROPERTIES,
        "depth":      _SOILGRIDS_DEPTH,
        "value":      "mean",
    }

    # SoilGrids requires repeated "property" params — requests handles list automatically
    data = _safe_get(_SOILGRIDS_URL, params)

    if data is None:
        return {"error": True, "message": "SoilGrids API request failed or timed out."}

    try:
        props = data["properties"]["layers"]
        result: Dict[str, Any] = {"source": "SoilGrids ISRIC v2.0", "depth": _SOILGRIDS_DEPTH}

        for layer in props:
            name = layer["name"]
            depths = layer.get("depths", [])
            if not depths:
                continue
            mean_val = depths[0]["values"].get("mean")

            # Apply unit conversion to human-friendly values
            if name == "phh2o":
                result["ph"] = round(mean_val / 10, 2) if mean_val else None
            elif name == "nitrogen":
                result["nitrogen"] = round(mean_val / 100, 2) if mean_val else None  # g/kg
            elif name == "clay":
                result["clay"] = round(mean_val / 10, 1) if mean_val else None       # %
            elif name == "sand":
                result["sand"] = round(mean_val / 10, 1) if mean_val else None       # %
            elif name == "silt":
                result["silt"] = round(mean_val / 10, 1) if mean_val else None       # %
            elif name == "soc":
                result["organic_carbon"] = round(mean_val / 10, 2) if mean_val else None
            elif name == "bdod":
                result["bulk_density"] = round(mean_val / 100, 3) if mean_val else None

        return result
    except (KeyError, TypeError, IndexError):
        return {"error": True, "message": "Unexpected SoilGrids response format."}


# ══════════════════════════════════════════════════════════════════════════════
# 3. NASA POWER — solar radiation and surface meteorology
# ══════════════════════════════════════════════════════════════════════════════

_NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def fetch_nasa_solar(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Fetch recent surface solar radiation data from NASA POWER.

    Retrieves the last 7 days of daily averages for:
      - ALLSKY_SFC_SW_DWN: Surface shortwave downwelling (kWh/m²/day)
      - T2M:               Temperature at 2m height (°C)
      - PS:                Surface pressure (kPa)

    Args:
        latitude:  GPS latitude.
        longitude: GPS longitude.

    Returns:
        Dict with:
          - "solar_radiation_kwh_m2_day": 7-day average solar radiation
          - "temperature_c":              7-day average temperature
          - "surface_pressure_kpa":       7-day average surface pressure
          - "solar_radiation_mj_m2_day":  Converted to MJ/m²/day (×3.6), for ET0
          - "source": "NASA POWER"
        On error:
          - "error": True, "message": <reason>
    """
    from datetime import date, timedelta
    end = date.today()
    start = end - timedelta(days=7)

    params = {
        "parameters":    "ALLSKY_SFC_SW_DWN,T2M,PS",
        "community":     "AG",
        "longitude":     longitude,
        "latitude":      latitude,
        "start":         start.strftime("%Y%m%d"),
        "end":           end.strftime("%Y%m%d"),
        "format":        "JSON",
    }

    data = _safe_get(_NASA_POWER_URL, params)

    if data is None:
        return {"error": True, "message": "NASA POWER API request failed or timed out."}

    try:
        params_data = data["properties"]["parameter"]

        def _avg(d: Dict[str, float]) -> float:
            vals = [v for v in d.values() if v is not None and float(v) > -900]
            return round(sum(vals) / len(vals), 3) if vals else 0.0

        solar_kwh = _avg(params_data["ALLSKY_SFC_SW_DWN"])
        temp = _avg(params_data["T2M"])
        pressure = _avg(params_data["PS"])

        return {
            "source":                       "NASA POWER",
            "solar_radiation_kwh_m2_day":   solar_kwh,
            "solar_radiation_mj_m2_day":    round(solar_kwh * 3.6, 3),  # 1 kWh = 3.6 MJ
            "temperature_c":                temp,
            "surface_pressure_kpa":         pressure,
            "parameter_units": {
                "solar_radiation_kwh_m2_day": "kWh/m²/day",
                "solar_radiation_mj_m2_day":  "MJ/m²/day",
                "temperature_c":              "°C",
                "surface_pressure_kpa":       "kPa",
            },
        }
    except (KeyError, TypeError):
        return {"error": True, "message": "Unexpected NASA POWER response format."}
