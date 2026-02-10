"""
validators.py — Input validation utilities for the Crop Recommendation API.

Provides functions to:
  1. Validate that all required fields are present and numeric.
  2. Check whether input values fall within realistic agricultural ranges,
     returning warnings and a confidence penalty when they do not.
"""

from typing import Dict, List, Tuple, Any

# ──────────────────────────────────────────────────────────────────────────────
# Required fields that the ESP32 / client must send (rainfall is optional)
# ──────────────────────────────────────────────────────────────────────────────
REQUIRED_FIELDS = ["N", "P", "K", "ph", "moisture", "temperature", "humidity"]

# ──────────────────────────────────────────────────────────────────────────────
# Realistic ranges for safety checks.
# Format: field → (min, max, human-readable label)
# Values outside these ranges will trigger a warning.
# ──────────────────────────────────────────────────────────────────────────────
REALISTIC_RANGES = {
    "N":           (0, 200, "Nitrogen (N)"),
    "P":           (0, 200, "Phosphorus (P)"),
    "K":           (0, 300, "Potassium (K)"),
    "temperature": (-10, 60, "Temperature"),
    "humidity":    (0, 100, "Humidity"),
    "ph":          (0, 14, "pH"),
    "rainfall":    (0, 500, "Rainfall"),
    "moisture":    (0, 100, "Soil Moisture"),
}

# Each out-of-range field reduces confidence by this factor
CONFIDENCE_PENALTY_PER_WARNING = 0.10


def validate_input(data: Dict[str, Any]) -> List[str]:
    """
    Check that every required field is present and numeric.

    Args:
        data: The JSON body received from the request.

    Returns:
        A list of error strings.  Empty list means the input is valid.
    """
    errors: List[str] = []

    if data is None:
        return ["Request body is empty or not valid JSON."]

    for field in REQUIRED_FIELDS:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: '{field}'.")
        else:
            try:
                float(data[field])
            except (TypeError, ValueError):
                errors.append(
                    f"Field '{field}' must be a number, got: {data[field]!r}."
                )

    return errors


def check_realistic_ranges(data: Dict[str, Any]) -> Tuple[List[str], float]:
    """
    Verify that each sensor value falls within a plausible agricultural range.

    If a value is outside the expected range, a human-readable warning is
    generated and a confidence penalty accumulates.  The penalty is capped at
    0.50 so that the model still returns *some* prediction even with bad data.

    Args:
        data: The validated (numeric) input dictionary.

    Returns:
        A tuple of (warnings_list, total_confidence_penalty).
        - warnings_list: list of warning strings (empty if all values are OK).
        - total_confidence_penalty: float between 0.0 and 0.50.
    """
    warnings: List[str] = []
    total_penalty: float = 0.0

    for field, (low, high, label) in REALISTIC_RANGES.items():
        value = data.get(field)
        if value is None:
            continue  # optional field not provided — skip

        value = float(value)

        if value < low:
            warnings.append(f"Input {label} ({value}) is below the expected minimum ({low}).")
            total_penalty += CONFIDENCE_PENALTY_PER_WARNING
        elif value > high:
            warnings.append(f"Input {label} ({value}) is above the expected maximum ({high}).")
            total_penalty += CONFIDENCE_PENALTY_PER_WARNING

    # Cap the total penalty so we still return a usable prediction
    total_penalty = min(total_penalty, 0.50)

    return warnings, total_penalty
