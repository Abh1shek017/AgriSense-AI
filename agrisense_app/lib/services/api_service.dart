import 'package:flutter/foundation.dart';
import 'dart:async';
import '../models/recommendation.dart';
import '../models/local_crop_model.dart';
import 'location_service.dart';
import 'weather_service.dart';

/// Service for crop recommendation (now fully offline).
class ApiService {
  static Future<RecommendationResponse> getRecommendation({
    required double nitrogen,
    required double phosphorus,
    required double potassium,
    required double ph,
    required double temperature,
    required double humidity,
    required double moisture,
    double? rainfall,
  }) async {
    // Ensure the offline model is loaded
    await LocalCropModel.loadModel();

    // Auto-fetch rainfall if missing
    double? finalRainfall = rainfall;
    String rainfallSource = 'sensor';
    if (finalRainfall == null) {
      try {
        debugPrint('[ApiService] Rainfall not provided. Fetching from location...');
        final position = await LocationService.determinePosition();
        final fetchedVal = await WeatherService.getSeasonalRainfall(
          position.latitude,
          position.longitude,
        );
        debugPrint('[ApiService] Auto-fetched rainfall: $fetchedVal mm');
        finalRainfall = fetchedVal;
        rainfallSource = 'estimated (API)';
      } catch (e) {
        debugPrint('[ApiService] Failed to fetch rainfall: $e');
        // Fallback to average generic rainfall if internet fails
        finalRainfall = 100.0;
        rainfallSource = 'estimated (offline fallback)';
      }
    }

    debugPrint('[ApiService] Running ML inference offline...');
    
    // Feature order MUST match the python training script:
    // "N", "P", "K", "temperature", "humidity", "ph", "rainfall"
    List<double> features = [
      nitrogen,
      phosphorus,
      potassium,
      temperature,
      humidity,
      ph,
      finalRainfall,
    ];

    try {
      final predictions = LocalCropModel.predict(features);
      
      // Take top 3 predictions
      final top3 = predictions.take(3).map((p) {
        final conf = p['probability'] as double;
        return {
          'crop': p['crop'],
          'confidence': '${(conf * 100).toStringAsFixed(0)}%'
        };
      }).toList();
      
      // Simple safety checks
      List<String> warnings = [];
      if (ph < 5.0) warnings.add("Soil is highly acidic.");
      if (ph > 8.0) warnings.add("Soil is highly alkaline.");
      if (temperature > 40.0) warnings.add("Extreme heat detected.");
      
      final responseBody = {
        "status": "success",
        "recommendations": top3,
        "warnings": warnings.isEmpty ? null : warnings,
        "metadata": {
          "inference": "offline_mlp",
          "rainfall_source": rainfallSource,
          "rainfall_value_used": finalRainfall,
        }
      };
      
      return RecommendationResponse.fromJson(responseBody);
    } catch (e) {
      throw ApiException('Inference Error: $e');
    }
  }
}
/// Custom exception for API errors.
class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}
