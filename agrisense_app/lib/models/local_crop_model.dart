import 'dart:convert';
import 'dart:math';
import 'package:flutter/services.dart';

class LocalCropModel {
  static Map<String, dynamic>? _modelData;
  static bool get isLoaded => _modelData != null;

  static Future<void> loadModel() async {
    if (_modelData != null) return;
    try {
      final jsonString = await rootBundle.loadString('assets/model_data.json');
      _modelData = jsonDecode(jsonString);
      print('[LocalCropModel] Model loaded successfully.');
    } catch (e) {
      print('[LocalCropModel] Error loading model: $e');
    }
  }

  static List<Map<String, dynamic>> predict(List<double> features) {
    if (_modelData == null) {
      throw Exception('Model not loaded. Call loadModel() first.');
    }

    final scalerMean = List<double>.from(_modelData!['scaler_mean'].map((x) => (x as num).toDouble()));
    final scalerScale = List<double>.from(_modelData!['scaler_scale'].map((x) => (x as num).toDouble()));
    
    final weights = _modelData!['weights'] as List;
    final biases = _modelData!['biases'] as List;
    final classes = List<String>.from(_modelData!['classes']);

    // 1. Scale features
    List<double> x = List.generate(features.length, (i) => (features[i] - scalerMean[i]) / scalerScale[i]);

    // 2. Forward pass through hidden layers
    for (int layer = 0; layer < weights.length - 1; layer++) {
      final wLayer = weights[layer] as List; // 2D list
      final bLayer = List<double>.from(biases[layer].map((x) => (x as num).toDouble()));
      
      List<double> nextX = List.filled(bLayer.length, 0.0);
      for (int j = 0; j < bLayer.length; j++) {
        double sum = bLayer[j];
        for (int i = 0; i < x.length; i++) {
          sum += x[i] * (wLayer[i][j] as num).toDouble();
        }
        // ReLU activation
        nextX[j] = max(0.0, sum);
      }
      x = nextX;
    }

    // 3. Output layer
    final wOut = weights.last as List;
    final bOut = List<double>.from(biases.last.map((x) => (x as num).toDouble()));
    List<double> logits = List.filled(bOut.length, 0.0);
    
    for (int j = 0; j < bOut.length; j++) {
      double sum = bOut[j];
      for (int i = 0; i < x.length; i++) {
        sum += x[i] * (wOut[i][j] as num).toDouble();
      }
      logits[j] = sum;
    }

    // 4. Softmax activation (since it's classification)
    double maxLogit = logits.reduce(max);
    List<double> expScores = logits.map((l) => exp(l - maxLogit)).toList();
    double sumExp = expScores.reduce((a, b) => a + b);
    List<double> probabilities = expScores.map((e) => e / sumExp).toList();

    // 5. Format results
    List<Map<String, dynamic>> results = [];
    for (int i = 0; i < classes.length; i++) {
      results.add({
        'crop': classes[i],
        'probability': probabilities[i],
      });
    }

    // Sort by probability descending
    results.sort((a, b) => (b['probability'] as double).compareTo(a['probability'] as double));
    return results;
  }
}
