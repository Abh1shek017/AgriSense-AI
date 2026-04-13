"""
anomaly.py — Z-score based anomaly detection for AgriSense AI sensor streams.

Detection pipeline per reading:
  1. Map the reading's field to a known baseline (mean, std).
  2. Compute the absolute Z-score: |x − μ| / σ
  3. Classify severity:
       |z| < 2.0  → normal  (not reported)
       2.0 ≤ |z| < 3.0 → Info
       3.0 ≤ |z| < 4.5 → Warning
       |z| ≥ 4.5  → Critical
  4. Attach a human-readable action recommendation.

Baselines are derived from the realistic agricultural ranges that the ML
training dataset also uses. They can be overridden at call time.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple


# ──────────────────────────────────────────────────────────────────────────────
# Baseline statistics (mean, std) per sensor field
# Derived from midpoint and spread of realistic agricultural ranges.
# ──────────────────────────────────────────────────────────────────────────────
BASELINES: Dict[str, Tuple[float, float]] = {   # field → (mean, std)
    "temperature": (27.0,  6.0),
    "humidity":    (70.0, 15.0),
    "ph":          (6.5,   0.8),
    "N":           (70.0, 30.0),
    "P":           (45.0, 35.0),
    "K":           (45.0, 40.0),
    "moisture":    (55.0, 20.0),
    "rainfall":    (120.0, 80.0),
}

# Z-score thresholds for each severity tier
THRESHOLDS = {
    "info":     2.0,
    "warning":  3.0,
    "critical": 4.5,
}

# ──────────────────────────────────────────────────────────────────────────────
# Action recommendation strings per field and direction (high / low)
# ──────────────────────────────────────────────────────────────────────────────
ACTIONS: Dict[str, Dict[str, str]] = {
    "temperature": {
        "high": "Activate shading nets or irrigation cooling. Check for heat stress symptoms on crops.",
        "low":  "Risk of frost damage. Cover sensitive crops; delay irrigation until temperatures rise.",
    },
    "humidity": {
        "high": "High fungal disease risk. Improve air circulation; reduce overhead irrigation.",
        "low":  "Dry-stress risk. Increase irrigation frequency; apply mulch to retain soil moisture.",
    },
    "ph": {
        "high": "Alkaline spike — apply elemental sulfur or acidifying fertilizers such as ammonium sulfate.",
        "low":  "Acidic spike — apply agricultural lime (CaCO₃) to raise pH to optimal 6.0–7.5 range.",
    },
    "N": {
        "high": "Excess nitrogen risk — reduce urea application. Risk of leaf burn and groundwater leaching.",
        "low":  "Nitrogen deficiency — apply urea or DAP fertiliser; consider legume intercrop.",
    },
    "P": {
        "high": "Excess phosphorus may lock out zinc and iron. Avoid additional P application.",
        "low":  "Phosphorus deficiency — apply SSP or DAP; till in organic matter to improve availability.",
    },
    "K": {
        "high": "Excess potassium can interfere with calcium and magnesium uptake. Pause K fertilisation.",
        "low":  "Potassium deficiency — apply MOP (muriate of potash); affects drought tolerance and yield.",
    },
    "moisture": {
        "high": "Waterlogging risk — check drainage; delay irrigation. Risk of root rot.",
        "low":  "Drought stress — immediate irrigation recommended. Check drip emitters for blockages.",
    },
    "rainfall": {
        "high": "Heavy rainfall — monitor for waterlogging and fungal outbreaks. Check drainage channels.",
        "low":  "Unusually low rainfall — activate supplemental irrigation; review crop water budget.",
    },
}

_DEFAULT_ACTION = "Verify sensor calibration. If confirmed, consult an agronomist."


def _classify_severity(z_score: float) -> Optional[str]:
    """Return severity string or None if the reading is within normal range."""
    z_abs = abs(z_score)
    if z_abs >= THRESHOLDS["critical"]:
        return "critical"
    if z_abs >= THRESHOLDS["warning"]:
        return "warning"
    if z_abs >= THRESHOLDS["info"]:
        return "info"
    return None  # normal


def _get_action(field: str, value: float, mean: float) -> str:
    """Return the appropriate action recommendation string."""
    field_actions = ACTIONS.get(field)
    if not field_actions:
        return _DEFAULT_ACTION
    direction = "high" if value > mean else "low"
    return field_actions.get(direction, _DEFAULT_ACTION)


def detect_anomalies(
    readings: List[Dict[str, Any]],
    baselines: Optional[Dict[str, Tuple[float, float]]] = None,
) -> List[Dict[str, Any]]:
    """
    Detect anomalies in a batch of sensor readings using Z-scores.

    Args:
        readings:  List of reading dicts.  Each must have:
                     - "field":     str  — sensor name (e.g. "temperature")
                     - "value":     float — current reading
                     - "timestamp": str  — ISO-8601 timestamp (optional but encouraged)
        baselines: Override the default BASELINES dict.  Useful for per-farm
                   calibrations once historical data is available.

    Returns:
        List of anomaly dicts for readings classified as Info/Warning/Critical.
        Normal readings are excluded to keep the response payload concise.
        Each dict contains:
          - field, value, timestamp
          - mean, std, z_score
          - severity ("info" | "warning" | "critical")
          - action (recommended response string)
    """
    effective_baselines = baselines if baselines is not None else BASELINES
    anomalies: List[Dict[str, Any]] = []

    for reading in readings:
        field = reading.get("field", "")
        raw_value = reading.get("value")
        timestamp = reading.get("timestamp", "")

        # ── Skip if we have no baseline for this field ─────────────────────────
        if field not in effective_baselines or raw_value is None:
            continue

        value = float(raw_value)
        mean, std = effective_baselines[field]

        # Guard against zero std (would cause division by zero)
        if std <= 0:
            continue

        z_score = (value - mean) / std
        severity = _classify_severity(z_score)

        if severity is None:
            continue  # Normal reading — skip

        anomalies.append({
            "field":     field,
            "value":     value,
            "timestamp": timestamp,
            "mean":      mean,
            "std":       std,
            "z_score":   round(z_score, 3),
            "severity":  severity,
            "action":    _get_action(field, value, mean),
        })

    # Sort by severity (critical first) then by |z_score| descending
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    anomalies.sort(key=lambda a: (severity_order[a["severity"]], -abs(a["z_score"])))

    return anomalies
