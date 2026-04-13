"""
rotation.py — Rule-based 3-season crop rotation planner for AgriSense AI.

Selects the next two crop seasons after the current recommended crop, based on:
  - NPK depletion / restoration patterns
  - Pest break logic (avoid same family consecutively)
  - Approximate market value for planning incentive

Rules are encoded as a directed rotation graph. If no direct rule exists
for a crop, a generic legume → cereal fallback sequence is applied.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple


# ──────────────────────────────────────────────────────────────────────────────
# Crop family groupings (for pest break logic)
# ──────────────────────────────────────────────────────────────────────────────
CROP_FAMILY: Dict[str, str] = {
    "Rice":       "cereal",
    "Wheat":      "cereal",
    "Maize":      "cereal",
    "Soybean":    "legume",
    "Lentil":     "legume",
    "Chickpea":   "legume",
    "Cotton":     "fiber",
    "Sugarcane":  "sugar",
    "Jute":       "fiber",
    "Potato":     "tuber",
    "Tomato":     "vegetable",
    "Banana":     "fruit",
    "Mango":      "fruit",
    "Grapes":     "fruit",
    "Apple":      "fruit",
    "Orange":     "fruit",
    "Papaya":     "fruit",
    "Muskmelon":  "cucurbit",
    "Watermelon": "cucurbit",
    "Coconut":    "palm",
    "Coffee":     "beverage",
    "Tea":        "beverage",
}

# ──────────────────────────────────────────────────────────────────────────────
# NPK impact per season
# Negative = depletes soil nutrient; Positive = restores / fixes.
# Values are relative (not absolute mg/kg) for planning guidance only.
# ──────────────────────────────────────────────────────────────────────────────
NPK_IMPACT: Dict[str, Tuple[int, int, int]] = {   # (N, P, K)
    "Rice":       (-3, -2, -2),
    "Wheat":      (-3, -2, -1),
    "Maize":      (-2, -1, -2),
    "Soybean":    (+4, +1,  0),   # Nitrogen-fixing legume
    "Lentil":     (+3, +1,  0),
    "Chickpea":   (+3, +1,  0),
    "Cotton":     (-2, -1, -1),
    "Sugarcane":  (-3, -2, -3),
    "Jute":       (-2, -1, -1),
    "Potato":     (-2, -1, -2),
    "Tomato":     (-2, -1, -1),
    "Banana":     (-2, -2, -3),
    "Mango":      (-1, -1, -1),
    "Grapes":     (-1, -1, -1),
    "Apple":      (-1, -1, -2),
    "Orange":     (-1,  0, -1),
    "Papaya":     (-2, -1, -1),
    "Muskmelon":  (-1,  0, -1),
    "Watermelon": (-1,  0, -1),
    "Coconut":    (-1,  0, -2),
    "Coffee":     (-1,  0,  0),
    "Tea":        (-1,  0,  0),
}

# ──────────────────────────────────────────────────────────────────────────────
# Approximate wholesale market values (INR/quintal, mid-2025 approximate)
# Source: Agmarknet / NCDEX reference — indicative only
# ──────────────────────────────────────────────────────────────────────────────
MARKET_VALUE_INR: Dict[str, int] = {
    "Rice":       2200,
    "Wheat":      2275,
    "Maize":      1850,
    "Soybean":    4400,
    "Lentil":     6000,
    "Chickpea":   5500,
    "Cotton":     6600,
    "Sugarcane":  350,    # per quintal of cane
    "Jute":       4500,
    "Potato":     1400,
    "Tomato":     2200,
    "Banana":     2000,
    "Mango":      6000,
    "Grapes":     9000,
    "Apple":      7500,
    "Orange":     3500,
    "Papaya":     2500,
    "Muskmelon":  1800,
    "Watermelon": 1200,
    "Coconut":    2800,
    "Coffee":     16000,
    "Tea":        18000,
}

# ──────────────────────────────────────────────────────────────────────────────
# Rotation rules — preferred successor per crop
# Each entry: (next_crop, agronomic_reason)
# ──────────────────────────────────────────────────────────────────────────────
ROTATION_RULES: Dict[str, Tuple[str, str]] = {
    "Rice":       ("Lentil",     "Legume fixes nitrogen depleted by paddy"),
    "Wheat":      ("Chickpea",   "Legume breaks wheat root diseases; fixes N"),
    "Maize":      ("Soybean",    "Soybean restores N; maize stalks add organic matter"),
    "Soybean":    ("Wheat",      "Wheat utilises fixed N; different root depth"),
    "Lentil":     ("Wheat",      "Wheat benefits from residual N left by lentil"),
    "Chickpea":   ("Rice",       "Rice follows legume to benefit from residual N"),
    "Cotton":     ("Wheat",      "Wheat breaks bollworm cycle; uses different nutrients"),
    "Sugarcane":  ("Lentil",     "Legume restores N heavily depleted by sugarcane"),
    "Jute":       ("Rice",       "Rice-jute rotation is traditional and balanced"),
    "Potato":     ("Maize",      "Maize breaks potato cyst nematodes; different family"),
    "Tomato":     ("Wheat",      "Cereal breaks solanaceous pest cycle"),
    "Banana":     ("Lentil",     "Short-duration legume restores K and N"),
    "Mango":      ("Chickpea",   "Inter-season legume improves orchard soil"),
    "Grapes":     ("Wheat",      "Winter wheat is compatible intercrop in vineyard off-season"),
    "Apple":      ("Soybean",    "Legume cover crop improves orchard soil health"),
    "Orange":     ("Maize",      "Maize as intercrop breaks citrus nematode cycles"),
    "Papaya":     ("Soybean",    "Short rotation legume refreshes exhausted soil"),
    "Muskmelon":  ("Chickpea",   "Legume breaks cucurbit diseases; fast rotation"),
    "Watermelon": ("Maize",      "Cereal breaks fusarium wilt common in watermelon"),
    "Coconut":    ("Banana",     "Compatible inter-crop; moisture-sharing root zones"),
    "Coffee":     ("Maize",      "Shade intercrop; maize provides temporary cover"),
    "Tea":        ("Lentil",     "Legume cover crop fixes N under tea canopy"),
}

# Fallback rotation for unknown crops
_FALLBACK_SEQUENCE = [
    ("Lentil",  "Legume to restore soil nitrogen after an exhausting crop"),
    ("Wheat",   "Cereal to utilise residual nitrogen fixed by legume"),
]


def _format_npk_impact(crop: str) -> str:
    """Return a human-readable NPK impact string for a crop."""
    impact = NPK_IMPACT.get(crop)
    if not impact:
        return "Moderate nutrient use"
    n, p, k = impact
    parts = []
    for nutrient, val in [("N", n), ("P", p), ("K", k)]:
        if val > 0:
            parts.append(f"{nutrient} ↑ (+{val})")
        elif val < 0:
            parts.append(f"{nutrient} ↓ ({val})")
        else:
            parts.append(f"{nutrient} –")
    return ", ".join(parts)


def get_rotation_plan(
    current_crop: str,
    n_value: Optional[float] = None,
    p_value: Optional[float] = None,
    k_value: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Generate a 3-season crop rotation plan starting from the current crop.

    Args:
        current_crop: The crop currently recommended or planted.
        n_value:      Current soil Nitrogen (mg/kg) — used for advisory notes.
        p_value:      Current soil Phosphorus (mg/kg).
        k_value:      Current soil Potassium (mg/kg).

    Returns:
        Dict with 'seasons' list (3 entries) for the mobile rotation cards.
    """
    seasons = []
    season_labels = ["Current Season", "Next Season", "Season After"]

    # Season 1 — the current crop
    seasons.append({
        "season":         season_labels[0],
        "crop":           current_crop,
        "why":            "Current recommendation based on soil & climate conditions",
        "npk_impact":     _format_npk_impact(current_crop),
        "market_value_inr": MARKET_VALUE_INR.get(current_crop, 2500),
    })

    # Season 2 — first successor
    if current_crop in ROTATION_RULES:
        crop_2, reason_2 = ROTATION_RULES[current_crop]
    else:
        crop_2, reason_2 = _FALLBACK_SEQUENCE[0]

    seasons.append({
        "season":         season_labels[1],
        "crop":           crop_2,
        "why":            reason_2,
        "npk_impact":     _format_npk_impact(crop_2),
        "market_value_inr": MARKET_VALUE_INR.get(crop_2, 2500),
    })

    # Season 3 — second successor (successor of successor)
    if crop_2 in ROTATION_RULES:
        crop_3, reason_3 = ROTATION_RULES[crop_2]
        # Avoid returning the same crop as Season 1 for season 3
        if crop_3 == current_crop and len(ROTATION_RULES) > 1:
            # Pick the next rule that doesn't cycle back immediately
            crop_3, reason_3 = _FALLBACK_SEQUENCE[1]
    else:
        crop_3, reason_3 = _FALLBACK_SEQUENCE[1]

    seasons.append({
        "season":         season_labels[2],
        "crop":           crop_3,
        "why":            reason_3,
        "npk_impact":     _format_npk_impact(crop_3),
        "market_value_inr": MARKET_VALUE_INR.get(crop_3, 2500),
    })

    # ── Optional soil advisory based on current NPK ────────────────────────────
    advisory: List[str] = []
    if n_value is not None and n_value < 50:
        advisory.append("⚠️ Low soil Nitrogen — prioritise legume in next season")
    if p_value is not None and p_value < 20:
        advisory.append("⚠️ Low Phosphorus — apply superphosphate before planting")
    if k_value is not None and k_value < 30:
        advisory.append("⚠️ Low Potassium — consider muriate of potash application")

    return {
        "current_crop": current_crop,
        "seasons":      seasons,
        "advisory":     advisory or None,
    }
