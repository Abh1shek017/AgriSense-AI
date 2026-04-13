"""
app.py — Flask REST API for the AgriSense AI Crop Recommendation System (v2).

This API receives real-time soil and climate data from an ESP32 IoT device
(or any HTTP client), runs it through a trained ensemble of ML models, and
returns crop recommendations along with irrigation scheduling, crop rotation
plans, anomaly alerts, and proxied external environmental data.

Endpoints:
    GET  /                        → Health-check
    POST /api/recommend           → Top-3 crops (legacy, backward-compatible)
    POST /api/predict             → Ensemble prediction (RF + SVM + MLP)
    GET  /api/weather/forecast    → 14-day Open-Meteo forecast proxy
    GET  /api/soil/profile        → SoilGrids ISRIC soil properties proxy
    GET  /api/nasa/solar          → NASA POWER solar radiation proxy
    GET  /api/irrigation/today    → ET0-based daily irrigation schedule
    GET  /api/rotation/plan       → 3-season crop rotation planner
    POST /api/anomaly/check       → Z-score anomaly detection on sensor batch

Startup:
    All trained models (rf_model.pkl, svm_model.pkl, mlp_model.pkl) and
    the shared scaler (scaler.pkl) are loaded once at module level.

Usage:
    python app.py          # Development server on port 5000
    gunicorn app:app       # Production (Linux / Docker)
"""

import os
import traceback

import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

from utils.validators import validate_input, check_realistic_ranges
from utils.rainfall import get_default_rainfall
from utils.ensemble import ensemble_predict
from utils.et0 import build_irrigation_schedule
from utils.rotation import get_rotation_plan
from utils.anomaly import detect_anomalies
from utils.external_apis import (
    fetch_openmeteo_forecast,
    fetch_soilgrids_profile,
    fetch_nasa_solar,
)


# ══════════════════════════════════════════════════════════════════════════════
# Flask application setup
# ══════════════════════════════════════════════════════════════════════════════
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes (allows any frontend origin)

# ──────────────────────────────────────────────────────────────────────────────
# Load ML artifacts at startup — one-time load for fast per-request inference
# ──────────────────────────────────────────────────────────────────────────────
MODEL_DIR    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")
FEATURE_ORDER = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]


def _load_artifact(filename: str):
    """Load a joblib artifact from MODEL_DIR; return None on failure."""
    path = os.path.join(MODEL_DIR, filename)
    try:
        obj = joblib.load(path)
        print(f"[OK] Loaded {filename}")
        return obj
    except FileNotFoundError:
        print(f"[!] Not found: {filename} - run 'python model/train_model.py' first.")
        return None


print("\n[*] AgriSense AI - Loading ML artifacts...")

# Legacy RandomForest (for /api/recommend backward compat)
crop_model     = _load_artifact("crop_model.pkl")
feature_scaler = _load_artifact("scaler.pkl")

# Ensemble models
rf_model  = _load_artifact("rf_model.pkl")
svm_model = _load_artifact("svm_model.pkl")
mlp_model = _load_artifact("mlp_model.pkl")

# Assemble the ensemble dict — only include models that loaded successfully
ensemble_models = {}
if rf_model  is not None: ensemble_models["rf"]  = rf_model
if svm_model is not None: ensemble_models["svm"] = svm_model
if mlp_model is not None: ensemble_models["mlp"] = mlp_model

# Use any available model to get the class labels (all share the same label set)
_label_source = rf_model or svm_model or mlp_model or crop_model
CLASS_LABELS  = _label_source.classes_ if _label_source is not None else []

print(f"[OK] Ensemble ready: {list(ensemble_models.keys())} | Classes: {len(CLASS_LABELS)}\n")


# ──────────────────────────────────────────────────────────────────────────────
# Shared input parsing helper
# ──────────────────────────────────────────────────────────────────────────────

def _parse_and_validate_sensor_input():
    """
    Parse the JSON body, validate required fields, apply rainfall fallback,
    run range checks, and return a tuple:
      (data, feature_vector_2d, warnings, confidence_penalty, error_response)

    If validation fails, error_response is a tuple (json_body, status_code)
    and all other return values are None.
    """
    data = request.get_json(silent=True)

    errors = validate_input(data)
    if errors:
        return None, None, None, None, (
            jsonify({"status": "error",
                     "message": "Input validation failed.",
                     "errors": errors}), 400
        )

    rainfall_source = "sensor"
    if data.get("rainfall") is None:
        data["rainfall"] = get_default_rainfall()
        rainfall_source = "estimated (fallback)"

    warnings, confidence_penalty = check_realistic_ranges(data)

    feature_vector = np.array([[
        float(data["N"]),
        float(data["P"]),
        float(data["K"]),
        float(data["temperature"]),
        float(data["humidity"]),
        float(data["ph"]),
        float(data["rainfall"]),
    ]])

    data["_rainfall_source"] = rainfall_source
    return data, feature_vector, warnings, confidence_penalty, None


# ══════════════════════════════════════════════════════════════════════════════
# Routes
# ══════════════════════════════════════════════════════════════════════════════


# ── Health-check ─────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health_check():
    """Simple health-check endpoint for monitoring / load-balancers."""
    return jsonify({
        "status":       "ok",
        "service":      "AgriSense AI — Crop Recommendation API v2",
        "model_status": {
            "legacy_rf":  "loaded" if crop_model  is not None else "not loaded",
            "ensemble_rf":  "loaded" if rf_model   is not None else "not loaded",
            "ensemble_svm": "loaded" if svm_model  is not None else "not loaded",
            "ensemble_mlp": "loaded" if mlp_model  is not None else "not loaded",
        },
        "endpoints": [
            "POST /api/recommend",
            "POST /api/predict",
            "GET  /api/weather/forecast",
            "GET  /api/soil/profile",
            "GET  /api/nasa/solar",
            "GET  /api/irrigation/today",
            "GET  /api/rotation/plan",
            "POST /api/anomaly/check",
        ],
    })


# ── Legacy endpoint — kept for backward compatibility ─────────────────────────

@app.route("/api/recommend", methods=["POST"])
def recommend_crop():
    """
    Predict the top-3 suitable crops (legacy endpoint — original response shape).

    Expected JSON body:
    {
        "N": float, "P": float, "K": float,
        "ph": float, "moisture": float,
        "temperature": float, "humidity": float,
        "rainfall": float  (OPTIONAL)
    }
    """
    try:
        if crop_model is None or feature_scaler is None:
            return jsonify({
                "status":  "error",
                "message": "ML model not loaded. Run 'python model/train_model.py'.",
            }), 503

        data, feature_vector, warnings, confidence_penalty, err = _parse_and_validate_sensor_input()
        if err:
            return err

        scaled = feature_scaler.transform(feature_vector)
        probabilities = crop_model.predict_proba(scaled)[0]
        class_labels  = crop_model.classes_
        top_indices   = np.argsort(probabilities)[::-1][:3]

        recommendations = []
        for idx in top_indices:
            adjusted = max(probabilities[idx] - confidence_penalty, 0.01)
            recommendations.append({
                "crop":       class_labels[idx],
                "confidence": f"{adjusted * 100:.0f}%",
            })

        return jsonify({
            "status":          "success",
            "recommendations": recommendations,
            "warnings":        warnings if warnings else None,
            "metadata": {
                "rainfall_source":     data["_rainfall_source"],
                "rainfall_value_used": float(data["rainfall"]),
            },
        }), 200

    except Exception as exc:
        traceback.print_exc()
        return jsonify({
            "status":  "error",
            "message": f"Unexpected error: {str(exc)}",
        }), 500


# ── Ensemble prediction endpoint ──────────────────────────────────────────────

@app.route("/api/predict", methods=["POST"])
def predict_ensemble():
    """
    Ensemble crop prediction from RF + SVM + MLP with per-model vote breakdown.

    Expected JSON body: same as /api/recommend.

    Returns:
    {
        "status": "success",
        "top_crop": "Rice",
        "top_confidence": "91.2%",
        "ensemble": {
            "rf":  { "label": "Random Forest", "available": true, "top_picks": [...] },
            "svm": { ... },
            "mlp": { ... }
        },
        "recommendations": [ { "crop": ..., "confidence": ..., "confidence_pct": ... } ],
        "weights_used": { "rf": 0.4, "svm": 0.35, "mlp": 0.25 },
        "warnings": [...] or null,
        "metadata": { ... }
    }
    """
    try:
        if not ensemble_models:
            return jsonify({
                "status":  "error",
                "message": "No ensemble models loaded. Run 'python model/train_model.py'.",
            }), 503

        data, feature_vector, warnings, confidence_penalty, err = _parse_and_validate_sensor_input()
        if err:
            return err

        scaled = feature_scaler.transform(feature_vector)

        result = ensemble_predict(
            models=ensemble_models,
            scaled_features=scaled,
            class_labels=CLASS_LABELS,
            confidence_penalty=confidence_penalty,
        )

        return jsonify({
            "status":          "success",
            "top_crop":        result["top_crop"],
            "top_confidence":  result["top_confidence"],
            "ensemble":        result["ensemble_votes"],
            "recommendations": result["recommendations"],
            "weights_used":    result["weights_used"],
            "warnings":        warnings if warnings else None,
            "metadata": {
                "rainfall_source":     data["_rainfall_source"],
                "rainfall_value_used": float(data["rainfall"]),
                "models_available":    list(ensemble_models.keys()),
            },
        }), 200

    except Exception as exc:
        traceback.print_exc()
        return jsonify({
            "status":  "error",
            "message": f"Unexpected error: {str(exc)}",
        }), 500


# ── Weather forecast proxy ────────────────────────────────────────────────────

@app.route("/api/weather/forecast", methods=["GET"])
def weather_forecast():
    """
    Proxy 14-day daily weather forecast from Open-Meteo.

    Query params:
        lat (float, required) — GPS latitude
        lon (float, required) — GPS longitude

    Returns: { source, days: [ { date, temp_max, temp_min, rainfall_mm, ... } ], units }
    """
    try:
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)

        if lat is None or lon is None:
            return jsonify({
                "status":  "error",
                "message": "Query parameters 'lat' and 'lon' are required.",
            }), 400

        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return jsonify({
                "status":  "error",
                "message": "Invalid coordinates. lat ∈ [-90, 90], lon ∈ [-180, 180].",
            }), 400

        result = fetch_openmeteo_forecast(lat, lon)
        if result.get("error"):
            return jsonify({"status": "error", "message": result["message"]}), 502

        return jsonify({"status": "success", **result}), 200

    except Exception as exc:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(exc)}), 500


# ── SoilGrids soil profile proxy ──────────────────────────────────────────────

@app.route("/api/soil/profile", methods=["GET"])
def soil_profile():
    """
    Proxy topsoil (0–5 cm) properties from SoilGrids ISRIC v2.0.

    Query params:
        lat (float, required) — GPS latitude
        lon (float, required) — GPS longitude

    Returns: { ph, nitrogen, clay, sand, silt, organic_carbon, bulk_density, depth, source }
    """
    try:
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)

        if lat is None or lon is None:
            return jsonify({
                "status":  "error",
                "message": "Query parameters 'lat' and 'lon' are required.",
            }), 400

        result = fetch_soilgrids_profile(lat, lon)
        if result.get("error"):
            return jsonify({"status": "error", "message": result["message"]}), 502

        return jsonify({"status": "success", **result}), 200

    except Exception as exc:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(exc)}), 500


# ── NASA POWER solar radiation proxy ─────────────────────────────────────────

@app.route("/api/nasa/solar", methods=["GET"])
def nasa_solar():
    """
    Proxy 7-day averaged solar radiation from NASA POWER.

    Query params:
        lat (float, required) — GPS latitude
        lon (float, required) — GPS longitude

    Returns: { solar_radiation_kwh_m2_day, solar_radiation_mj_m2_day,
               temperature_c, surface_pressure_kpa, source, parameter_units }
    """
    try:
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)

        if lat is None or lon is None:
            return jsonify({
                "status":  "error",
                "message": "Query parameters 'lat' and 'lon' are required.",
            }), 400

        result = fetch_nasa_solar(lat, lon)
        if result.get("error"):
            return jsonify({"status": "error", "message": result["message"]}), 502

        return jsonify({"status": "success", **result}), 200

    except Exception as exc:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(exc)}), 500


# ── Irrigation scheduler ──────────────────────────────────────────────────────

@app.route("/api/irrigation/today", methods=["GET"])
def irrigation_today():
    """
    Return today's ET0-based irrigation schedule for all zones in a field.

    Query params:
        field_id (str, optional)  — arbitrary field identifier, default "field_1"
        zones    (int, optional)  — number of zones, default 3
        crops    (str, optional)  — comma-separated crop names per zone
                                    e.g. "Rice,Wheat,Maize"
        lat      (float, optional) — field latitude for ET0 Ra, default 20.5
        lon      (float, optional) — field longitude (used to fetch forecast)

    Returns:
    {
        "status": "success",
        "field_id": ...,
        "date": "2026-04-14",
        "et0_mm_day": ...,
        "zones": [
            { "zone_id", "crop", "et0_mm", "kc", "irrigation_mm", "status" }, ...
        ]
    }
    """
    try:
        field_id  = request.args.get("field_id", "field_1")
        num_zones = request.args.get("zones", 3, type=int)
        crops_str = request.args.get("crops", "")
        lat       = request.args.get("lat", 20.5, type=float)
        lon       = request.args.get("lon", 78.9, type=float)

        # Parse crop list; fill with generic "default" if not enough provided
        zone_crops = [c.strip() for c in crops_str.split(",") if c.strip()] if crops_str else []

        # Try to get today's forecast for more accurate ET0
        forecast_data = fetch_openmeteo_forecast(lat, lon)
        today_days = forecast_data.get("days", []) if not forecast_data.get("error") else []

        schedule = build_irrigation_schedule(
            zones=num_zones,
            zone_crops=zone_crops,
            field_id=field_id,
            latitude_deg=lat,
            forecast_days=today_days if today_days else None,
        )

        return jsonify({"status": "success", **schedule}), 200

    except Exception as exc:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(exc)}), 500


# ── Crop rotation planner ─────────────────────────────────────────────────────

@app.route("/api/rotation/plan", methods=["GET"])
def rotation_plan():
    """
    Return a 3-season crop rotation plan for the given current crop.

    Query params:
        crop (str, required)   — current crop name (e.g. "Rice")
        n    (float, optional) — current soil Nitrogen (mg/kg)
        p    (float, optional) — current soil Phosphorus (mg/kg)
        k    (float, optional) — current soil Potassium (mg/kg)

    Returns:
    {
        "status": "success",
        "current_crop": "Rice",
        "seasons": [
            { "season", "crop", "why", "npk_impact", "market_value_inr" },
            ...   (3 entries)
        ],
        "advisory": [ "⚠️ Low soil Nitrogen — ...", ... ] or null
    }
    """
    try:
        crop = request.args.get("crop", "").strip()
        if not crop:
            return jsonify({
                "status":  "error",
                "message": "Query parameter 'crop' is required.",
            }), 400

        n_val = request.args.get("n", type=float)
        p_val = request.args.get("p", type=float)
        k_val = request.args.get("k", type=float)

        plan = get_rotation_plan(crop, n_value=n_val, p_value=p_val, k_value=k_val)

        return jsonify({"status": "success", **plan}), 200

    except Exception as exc:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(exc)}), 500


# ── Anomaly detection ─────────────────────────────────────────────────────────

@app.route("/api/anomaly/check", methods=["POST"])
def anomaly_check():
    """
    Detect sensor anomalies from a batch of readings using Z-score analysis.

    Expected JSON body:
    {
        "readings": [
            { "field": "temperature", "value": 75, "timestamp": "2026-04-14T00:00:00Z" },
            { "field": "ph", "value": 2.1, "timestamp": "2026-04-14T00:00:00Z" },
            ...
        ]
    }

    Returns:
    {
        "status": "success",
        "total_checked": 5,
        "anomaly_count": 2,
        "anomalies": [
            { "field", "value", "timestamp", "mean", "std",
              "z_score", "severity", "action" },
            ...
        ]
    }
    """
    try:
        body = request.get_json(silent=True)
        if not body or "readings" not in body:
            return jsonify({
                "status":  "error",
                "message": "Request body must include a 'readings' list.",
            }), 400

        readings = body["readings"]
        if not isinstance(readings, list):
            return jsonify({
                "status":  "error",
                "message": "'readings' must be a JSON array.",
            }), 400

        anomalies = detect_anomalies(readings)

        return jsonify({
            "status":        "success",
            "total_checked": len(readings),
            "anomaly_count": len(anomalies),
            "anomalies":     anomalies,
        }), 200

    except Exception as exc:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(exc)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# Global error handlers
# ══════════════════════════════════════════════════════════════════════════════


@app.errorhandler(404)
def not_found(error):
    """Return JSON instead of the default HTML 404 page."""
    return jsonify({
        "status":  "error",
        "message": "Endpoint not found.",
        "hint":    "GET / for available endpoints.",
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Return JSON for wrong HTTP method."""
    return jsonify({
        "status":  "error",
        "message": "HTTP method not allowed for this endpoint.",
    }), 405


# ══════════════════════════════════════════════════════════════════════════════
# Entry point
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("[*] Starting AgriSense AI - Crop Recommendation API v2")
    print("   Docs: GET / for full endpoint list\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
