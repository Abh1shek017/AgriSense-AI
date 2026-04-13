"""
train_model.py — ML Model Training Script for AgriSense AI (v2 — Ensemble)

Trains THREE models from the same synthetic agricultural dataset:
  1. RandomForestClassifier  → rf_model.pkl   (primary — high accuracy)
  2. SVC (RBF, probability)  → svm_model.pkl  (high precision on boundary cases)
  3. MLPClassifier           → mlp_model.pkl  (neural network — pattern recognition)

All three models + the shared StandardScaler are saved side-by-side in model/.
The legacy crop_model.pkl (RandomForest) is also re-saved so the original
/api/recommend endpoint continues to work without any changes.

Features used for prediction:
    N, P, K, temperature, humidity, ph, rainfall

Usage:
    python model/train_model.py
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib


# ──────────────────────────────────────────────────────────────────────────────
# Realistic feature ranges for each crop (N, P, K, Temp, Humidity, pH, Rainfall)
# Source: Approximations based on Indian agricultural datasets
# ──────────────────────────────────────────────────────────────────────────────
CROP_PROFILES = {
    "Rice":        {"N": (60, 100), "P": (35, 60),  "K": (35, 55),  "temp": (20, 28), "humidity": (78, 92), "ph": (5.0, 7.0),  "rainfall": (180, 260)},
    "Wheat":       {"N": (70, 120), "P": (50, 75),  "K": (45, 65),  "temp": (12, 25), "humidity": (50, 70), "ph": (5.5, 7.5),  "rainfall": (50, 120)},
    "Maize":       {"N": (60, 100), "P": (35, 60),  "K": (30, 50),  "temp": (18, 30), "humidity": (55, 75), "ph": (5.5, 7.5),  "rainfall": (60, 110)},
    "Jute":        {"N": (60, 100), "P": (35, 55),  "K": (35, 55),  "temp": (24, 37), "humidity": (70, 90), "ph": (6.0, 7.5),  "rainfall": (150, 250)},
    "Cotton":      {"N": (100, 140),"P": (40, 65),  "K": (18, 30),  "temp": (22, 32), "humidity": (60, 80), "ph": (6.0, 8.0),  "rainfall": (60, 110)},
    "Coconut":     {"N": (15, 30),  "P": (8, 18),   "K": (28, 40),  "temp": (25, 32), "humidity": (80, 95), "ph": (5.0, 7.0),  "rainfall": (130, 220)},
    "Coffee":      {"N": (90, 130), "P": (15, 30),  "K": (25, 40),  "temp": (22, 30), "humidity": (50, 70), "ph": (6.0, 7.0),  "rainfall": (120, 200)},
    "Sugarcane":   {"N": (70, 120), "P": (30, 55),  "K": (30, 50),  "temp": (25, 35), "humidity": (65, 85), "ph": (5.0, 8.0),  "rainfall": (80, 150)},
    "Tea":         {"N": (15, 30),  "P": (5, 10),   "K": (20, 35),  "temp": (18, 28), "humidity": (70, 90), "ph": (4.5, 6.0),  "rainfall": (150, 300)},
    "Banana":      {"N": (80, 120), "P": (70, 100), "K": (45, 60),  "temp": (25, 35), "humidity": (75, 90), "ph": (5.5, 7.0),  "rainfall": (90, 180)},
    "Mango":       {"N": (15, 30),  "P": (15, 30),  "K": (25, 45),  "temp": (27, 35), "humidity": (45, 65), "ph": (5.5, 7.5),  "rainfall": (40, 100)},
    "Grapes":      {"N": (15, 30),  "P": (120, 150),"K": (190, 210),"temp": (10, 20), "humidity": (78, 88), "ph": (5.5, 7.0),  "rainfall": (60, 80)},
    "Apple":       {"N": (15, 30),  "P": (120, 145),"K": (195, 210),"temp": (20, 25), "humidity": (88, 94), "ph": (5.5, 6.5),  "rainfall": (100, 130)},
    "Orange":      {"N": (15, 25),  "P": (8, 15),   "K": (8, 15),   "temp": (22, 32), "humidity": (88, 95), "ph": (6.5, 7.5),  "rainfall": (90, 120)},
    "Papaya":      {"N": (40, 65),  "P": (55, 75),  "K": (48, 60),  "temp": (28, 38), "humidity": (88, 95), "ph": (6.0, 7.0),  "rainfall": (40, 70)},
    "Lentil":      {"N": (15, 25),  "P": (55, 80),  "K": (15, 25),  "temp": (20, 28), "humidity": (30, 50), "ph": (6.0, 8.0),  "rainfall": (35, 55)},
    "Chickpea":    {"N": (30, 50),  "P": (60, 80),  "K": (75, 85),  "temp": (15, 25), "humidity": (14, 20), "ph": (6.5, 8.0),  "rainfall": (60, 90)},
    "Muskmelon":   {"N": (90, 110), "P": (15, 25),  "K": (45, 60),  "temp": (28, 35), "humidity": (88, 95), "ph": (6.0, 7.0),  "rainfall": (20, 40)},
    "Watermelon":  {"N": (80, 110), "P": (15, 25),  "K": (48, 55),  "temp": (25, 32), "humidity": (82, 90), "ph": (6.0, 7.0),  "rainfall": (40, 60)},
    "Potato":      {"N": (55, 75),  "P": (55, 70),  "K": (75, 85),  "temp": (15, 22), "humidity": (70, 85), "ph": (4.5, 6.5),  "rainfall": (35, 55)},
    "Tomato":      {"N": (70, 95),  "P": (55, 70),  "K": (58, 68),  "temp": (22, 30), "humidity": (78, 88), "ph": (6.0, 7.5),  "rainfall": (40, 60)},
    "Soybean":     {"N": (15, 30),  "P": (55, 75),  "K": (18, 28),  "temp": (20, 30), "humidity": (60, 80), "ph": (5.5, 7.0),  "rainfall": (55, 85)},
}

FEATURE_COLUMNS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
SAMPLES_PER_CROP = 120  # Synthetic samples per crop class


def generate_synthetic_data() -> pd.DataFrame:
    """
    Generate a synthetic agricultural dataset from per-crop feature distributions.

    Each crop gets SAMPLES_PER_CROP rows sampled uniformly within its defined
    feature ranges, with small Gaussian noise added for a more realistic spread.
    """
    records = []
    for crop_name, ranges in CROP_PROFILES.items():
        for _ in range(SAMPLES_PER_CROP):
            row = {
                "N":           np.random.uniform(*ranges["N"]),
                "P":           np.random.uniform(*ranges["P"]),
                "K":           np.random.uniform(*ranges["K"]),
                "temperature": np.random.uniform(*ranges["temp"]),
                "humidity":    np.random.uniform(*ranges["humidity"]),
                "ph":          np.random.uniform(*ranges["ph"]),
                "rainfall":    np.random.uniform(*ranges["rainfall"]),
                "label":       crop_name,
            }
            records.append(row)

    df = pd.DataFrame(records)

    # Add small Gaussian noise to numeric columns for natural variance
    for col in FEATURE_COLUMNS:
        noise = np.random.normal(0, 0.5, size=len(df))
        df[col] = df[col] + noise

    # Clamp pH and humidity to physically valid ranges after noise
    df["ph"]       = df["ph"].clip(0, 14)
    df["humidity"] = df["humidity"].clip(0, 100)

    return df


def _print_accuracy(name: str, model, X_test_scaled, y_test) -> None:
    """Print a concise accuracy line and abbreviated classification report."""
    preds = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, preds)
    print(f"\n  [{name}] Test accuracy: {acc:.2%}")


def train_and_save_models() -> None:
    """
    Full ensemble training pipeline:
      1. Generate synthetic dataset
      2. Train/test split
      3. Fit StandardScaler on training data
      4. Train RF, SVM, MLP models
      5. Evaluate all three
      6. Save all artifacts to model/
    """
    print("=" * 60)
    print("  AgriSense AI — Ensemble Model Trainer (v2)")
    print("=" * 60)

    # --------------------------------------------------------------------------
    # Step 1: Generate dataset
    # --------------------------------------------------------------------------
    print("\n[1/5] Generating synthetic agricultural dataset...")
    df = generate_synthetic_data()
    print(f"      -> Shape: {df.shape} | Classes: {df['label'].nunique()}")

    X = df[FEATURE_COLUMNS].values
    y = df["label"].values

    # --------------------------------------------------------------------------
    # Step 2: Train / test split
    # --------------------------------------------------------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y,
    )
    print(f"\n[2/5] Split -> {len(X_train)} train  |  {len(X_test)} test")

    # --------------------------------------------------------------------------
    # Step 3: Fit scaler
    # --------------------------------------------------------------------------
    print("\n[3/5] Fitting StandardScaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # --------------------------------------------------------------------------
    # Step 4: Train all three models
    # --------------------------------------------------------------------------
    print("\n[4/5] Training ensemble models...")

    print("      -> RandomForestClassifier (n_estimators=100)...")
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=15,
                                      random_state=42, n_jobs=-1)
    rf_model.fit(X_train_scaled, y_train)
    _print_accuracy("Random Forest", rf_model, X_test_scaled, y_test)

    print("\n      -> SVC (kernel=rbf, probability=True)...")
    svm_model = SVC(kernel="rbf", probability=True, C=10.0, gamma="scale",
                    random_state=42)
    svm_model.fit(X_train_scaled, y_train)
    _print_accuracy("SVM (RBF)", svm_model, X_test_scaled, y_test)

    print("\n      -> MLPClassifier (2 hidden layers: 128-64)...")
    mlp_model = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        activation="relu",
        solver="adam",
        max_iter=500,
        early_stopping=False,   # Disabled: bug with string labels in sklearn 1.6
        n_iter_no_change=20,    # Converge if loss delta < tol for 20 iters
        tol=1e-4,
        random_state=42,
        verbose=False,
    )
    mlp_model.fit(X_train_scaled, y_train)
    _print_accuracy("MLP Neural Net", mlp_model, X_test_scaled, y_test)

    # --------------------------------------------------------------------------
    # Step 5: Save all artifacts
    # --------------------------------------------------------------------------
    print("\n[5/5] Saving model artifacts to model/...")
    model_dir = os.path.dirname(os.path.abspath(__file__))

    artifact_map = {
        "rf_model.pkl":   rf_model,
        "svm_model.pkl":  svm_model,
        "mlp_model.pkl":  mlp_model,
        "scaler.pkl":     scaler,
        # Keep legacy filename so original /api/recommend endpoint still works
        "crop_model.pkl": rf_model,
    }

    for filename, obj in artifact_map.items():
        path = os.path.join(model_dir, filename)
        joblib.dump(obj, path)
        print(f"      [OK] {filename}")

    print("\n" + "=" * 60)
    print("  Training complete. Start the API with: python app.py")
    print("=" * 60)


if __name__ == "__main__":
    train_and_save_models()
