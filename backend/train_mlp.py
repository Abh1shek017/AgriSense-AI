import os
import json
import numpy as np
import pandas as pd
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Copying CROP_PROFILES from train_model.py
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
SAMPLES_PER_CROP = 120  # Same as original script

def get_data() -> pd.DataFrame:
    df = pd.read_csv("Crop_recom.csv")
    return df

def train_and_export():
    print("Loading data from CSV...")
    df = get_data()
    X = df[FEATURE_COLUMNS].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Scaling...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("Training MLP (Neural Network)...")
    # A simple neural network that fits well for this kind of tabular data
    model = MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=2000, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    acc = model.score(X_test_scaled, y_test)
    print(f"Test accuracy: {acc:.2%}")
    
    print("Exporting to JSON...")
    data = {
        "classes": list(model.classes_),
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "weights": [w.tolist() for w in model.coefs_],
        "biases": [b.tolist() for b in model.intercepts_],
    }
    
    out_path = "../agrisense_app/assets/model_data.json"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(data, f)
    
    print(f"Exported successfully to {out_path} (Size: {os.path.getsize(out_path)/1024:.1f} KB)")

if __name__ == "__main__":
    train_and_export()
