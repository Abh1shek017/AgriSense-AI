"""
app.py — Flask REST API for the AgriSense AI Crop Recommendation System.

This API receives real-time soil and climate data from an ESP32 IoT device
(or any HTTP client), runs it through a trained RandomForest model, and
returns the top-3 most suitable crop recommendations.

Endpoints:
    GET  /              → Health-check
    POST /api/recommend → Crop recommendation (accepts JSON)

Startup:
    The trained model (crop_model.pkl) and scaler (scaler.pkl) are loaded
    once at module level for fast inference.

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


# ══════════════════════════════════════════════════════════════════════════════
# Flask application setup
# ══════════════════════════════════════════════════════════════════════════════
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes (allows frontend on a different origin)

# ──────────────────────────────────────────────────────────────────────────────
# Load ML artifacts at startup so we don't reload on every request
# ──────────────────────────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")
MODEL_PATH = os.path.join(MODEL_DIR, "crop_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

# Feature order MUST match the order used during training
FEATURE_ORDER = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

try:
    crop_model = joblib.load(MODEL_PATH)
    feature_scaler = joblib.load(SCALER_PATH)
    print(f"[✓] Model loaded from {MODEL_PATH}")
    print(f"[✓] Scaler loaded from {SCALER_PATH}")
except FileNotFoundError:
    crop_model = None
    feature_scaler = None
    print(
        "[✗] Model files not found. "
        "Run 'python model/train_model.py' first to generate them."
    )


# ══════════════════════════════════════════════════════════════════════════════
# Routes
# ══════════════════════════════════════════════════════════════════════════════


@app.route("/", methods=["GET"])
def health_check():
    """Simple health-check endpoint for monitoring / load-balancers."""
    model_status = "loaded" if crop_model is not None else "not loaded"
    return jsonify({
        "status": "ok",
        "service": "AgriSense AI — Crop Recommendation API",
        "model_status": model_status,
    })


@app.route("/api/recommend", methods=["POST"])
def recommend_crop():
    """
    Predict the top-3 suitable crops for the given soil/climate conditions.

    Expected JSON body:
    {
        "N": float,            # Nitrogen content (mg/kg)
        "P": float,            # Phosphorus content (mg/kg)
        "K": float,            # Potassium content (mg/kg)
        "ph": float,           # Soil pH
        "moisture": float,     # Soil moisture (%)
        "temperature": float,  # Ambient temperature (°C)
        "humidity": float,     # Relative humidity (%)
        "rainfall": float      # Rainfall in mm (OPTIONAL)
    }

    Returns:
    {
        "status": "success",
        "recommendations": [
            {"crop": "Rice", "confidence": "95%"},
            ...
        ],
        "warnings": [...] or null
    }
    """
    try:
        # ── Guard: model must be loaded ───────────────────────────────────
        if crop_model is None or feature_scaler is None:
            return jsonify({
                "status": "error",
                "message": (
                    "ML model is not loaded. "
                    "Please run 'python model/train_model.py' to train and "
                    "save the model before starting the API."
                ),
            }), 503

        # ── Parse JSON body ───────────────────────────────────────────────
        data = request.get_json(silent=True)

        # ── Step 1: Validate required fields ──────────────────────────────
        errors = validate_input(data)
        if errors:
            return jsonify({
                "status": "error",
                "message": "Input validation failed.",
                "errors": errors,
            }), 400

        # ── Step 2: Rainfall fallback ─────────────────────────────────────
        # If the 'rainfall' field is missing or null, we use a fallback
        # value.  This is common because many low-cost ESP32 kits don't
        # include a rain gauge sensor.  The fallback function tries a
        # (mock) weather API first, then falls back to a historical average.
        rainfall_source = "sensor"
        if data.get("rainfall") is None:
            data["rainfall"] = get_default_rainfall()
            rainfall_source = "estimated (fallback)"

        # ── Step 3: Safety / range checks ─────────────────────────────────
        warnings, confidence_penalty = check_realistic_ranges(data)

        # ── Step 4: Prepare feature vector ────────────────────────────────
        # The model expects features in a specific order.
        # 'moisture' from the sensor is not used by the model directly —
        # it's logged but the model was trained on the 7 core features.
        feature_values = np.array([[
            float(data["N"]),
            float(data["P"]),
            float(data["K"]),
            float(data["temperature"]),
            float(data["humidity"]),
            float(data["ph"]),
            float(data["rainfall"]),
        ]])

        # ── Step 5: Scale features ────────────────────────────────────────
        scaled_features = feature_scaler.transform(feature_values)

        # ── Step 6: Predict top-3 crops ───────────────────────────────────
        probabilities = crop_model.predict_proba(scaled_features)[0]
        class_labels = crop_model.classes_

        # Sort by probability descending and pick top 3
        top_indices = np.argsort(probabilities)[::-1][:3]

        recommendations = []
        for idx in top_indices:
            raw_confidence = probabilities[idx]

            # Apply penalty for unrealistic inputs
            adjusted_confidence = max(raw_confidence - confidence_penalty, 0.01)
            confidence_pct = f"{adjusted_confidence * 100:.0f}%"

            recommendations.append({
                "crop": class_labels[idx],
                "confidence": confidence_pct,
            })

        # ── Build response ────────────────────────────────────────────────
        response = {
            "status": "success",
            "recommendations": recommendations,
            "warnings": warnings if warnings else None,
            "metadata": {
                "rainfall_source": rainfall_source,
                "rainfall_value_used": float(data["rainfall"]),
            },
        }

        return jsonify(response), 200

    except Exception as exc:
        # Catch-all so the API never returns an unhandled 500
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"An unexpected error occurred: {str(exc)}",
        }), 500


# ══════════════════════════════════════════════════════════════════════════════
# Global error handlers
# ══════════════════════════════════════════════════════════════════════════════


@app.errorhandler(404)
def not_found(error):
    """Return JSON instead of the default HTML 404 page."""
    return jsonify({
        "status": "error",
        "message": "Endpoint not found. Use POST /api/recommend.",
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Return JSON for wrong HTTP method."""
    return jsonify({
        "status": "error",
        "message": "Method not allowed. The /api/recommend endpoint accepts POST only.",
    }), 405


# ══════════════════════════════════════════════════════════════════════════════
# Entry point
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("\n🌾 Starting AgriSense AI — Crop Recommendation API")
    print("   Docs: POST /api/recommend with JSON body\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
