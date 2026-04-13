"""
ensemble.py — Weighted voting layer for the AgriSense AI ensemble prediction system.

Combines probability outputs from three ML models:
  - RandomForestClassifier  (RF)  — weight: 0.40
  - SVC with probability    (SVM) — weight: 0.35
  - MLPClassifier           (MLP) — weight: 0.25

The weighted average probabilities are used to produce the final crop ranking.
Individual model outputs are also returned so the UI can render the 'debate' cards.
"""

from __future__ import annotations

import numpy as np
from typing import Any, Dict, List, Tuple


# ──────────────────────────────────────────────────────────────────────────────
# Default ensemble weights — must sum to 1.0
# Override by passing a custom `weights` dict to `ensemble_predict`.
# ──────────────────────────────────────────────────────────────────────────────
DEFAULT_WEIGHTS: Dict[str, float] = {
    "rf":  0.40,
    "svm": 0.35,
    "mlp": 0.25,
}

# Human-readable display names matched to model keys
MODEL_LABELS: Dict[str, str] = {
    "rf":  "Random Forest",
    "svm": "Support Vector Machine",
    "mlp": "Neural Network (MLP)",
}


def _get_top_n(
    probabilities: np.ndarray,
    class_labels: np.ndarray,
    n: int = 3,
    confidence_penalty: float = 0.0,
) -> List[Dict[str, Any]]:
    """
    Extract the top-N crop predictions from a probability vector.

    Args:
        probabilities:      1-D array of class probabilities (one per crop).
        class_labels:       Ordered array of class names matching probabilities.
        n:                  Number of top predictions to return.
        confidence_penalty: Float in [0, 0.5] subtracted from each confidence.

    Returns:
        List of dicts with keys: crop, confidence (float 0-1), confidence_pct (str).
    """
    top_indices = np.argsort(probabilities)[::-1][:n]
    results = []
    for idx in top_indices:
        adjusted = max(float(probabilities[idx]) - confidence_penalty, 0.01)
        results.append({
            "crop":           class_labels[idx],
            "confidence":     round(adjusted, 4),
            "confidence_pct": f"{adjusted * 100:.1f}%",
        })
    return results


def ensemble_predict(
    models: Dict[str, Any],
    scaled_features: np.ndarray,
    class_labels: np.ndarray,
    confidence_penalty: float = 0.0,
    weights: Dict[str, float] | None = None,
    top_n: int = 3,
) -> Dict[str, Any]:
    """
    Run inference on all available models and combine their outputs.

    Args:
        models:             Dict mapping model key → fitted sklearn model.
                            Keys must be a subset of {"rf", "svm", "mlp"}.
                            Missing models are skipped and reported as unavailable.
        scaled_features:    2-D numpy array of shape (1, n_features), already scaled.
        class_labels:       Ordered array of crop class names from any fitted model.
        confidence_penalty: Float penalty subtracted from adjusted confidence scores.
        weights:            Override for DEFAULT_WEIGHTS.  Absent models get 0 weight
                            and the remaining weights are re-normalised automatically.
        top_n:              Number of top crops to include in the ensemble result.

    Returns:
        Dict with keys:
          - ensemble_votes:    Per-model top-3 predictions.
          - recommendations:   Final weighted top-N crops with combined confidence.
          - top_crop:          Name of the #1 recommended crop.
          - top_confidence:    Confidence % string for the top crop.
          - weights_used:      Actual (normalised) weights applied.
    """
    effective_weights = dict(weights or DEFAULT_WEIGHTS)

    # ── Zero-out weights for unavailable models and re-normalise ──────────────
    available_keys = [k for k in effective_weights if k in models]
    if not available_keys:
        raise ValueError("No ensemble models are available. Cannot predict.")

    active_weights = {k: effective_weights[k] for k in available_keys}
    weight_total = sum(active_weights.values())
    normalised_weights = {k: v / weight_total for k, v in active_weights.items()}

    # ── Run each model and collect probabilities + per-model top-3 ────────────
    per_model_votes: Dict[str, Any] = {}
    weighted_probabilities: np.ndarray | None = None

    for key in available_keys:
        model = models[key]
        proba = model.predict_proba(scaled_features)[0]

        per_model_votes[key] = {
            "label":        MODEL_LABELS.get(key, key),
            "available":    True,
            "top_picks":    _get_top_n(proba, class_labels, n=top_n,
                                        confidence_penalty=confidence_penalty),
        }

        if weighted_probabilities is None:
            weighted_probabilities = normalised_weights[key] * proba
        else:
            weighted_probabilities += normalised_weights[key] * proba

    # ── Mark unavailable models in the response ────────────────────────────────
    for key in DEFAULT_WEIGHTS:
        if key not in per_model_votes:
            per_model_votes[key] = {
                "label":     MODEL_LABELS.get(key, key),
                "available": False,
                "top_picks": [],
            }

    # ── Build the final ensemble top-N from weighted probabilities ────────────
    final_predictions = _get_top_n(
        weighted_probabilities, class_labels, n=top_n,
        confidence_penalty=confidence_penalty,
    )

    top_crop = final_predictions[0]["crop"] if final_predictions else "Unknown"
    top_confidence = final_predictions[0]["confidence_pct"] if final_predictions else "N/A"

    return {
        "ensemble_votes":   per_model_votes,
        "recommendations":  final_predictions,
        "top_crop":         top_crop,
        "top_confidence":   top_confidence,
        "weights_used":     {k: round(v, 4) for k, v in normalised_weights.items()},
    }
