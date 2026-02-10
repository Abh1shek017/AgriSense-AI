import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import '../models/recommendation.dart';

/// Service for communicating with the Flask crop recommendation API.
class ApiService {
  /// Base URL — Android emulator uses 10.0.2.2 to reach host localhost.
  /// Web and iOS simulator use localhost directly.
  /// Physical devices use the PC's WiFi IP.
  static String get _baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000';
    }
    // PC's WiFi IP — phone must be on the same network
    return 'http://10.151.168.98:5000';
  }

  /// POST sensor data to /api/recommend and return parsed response.
  ///
  /// Throws [ApiException] on network errors or non-2xx responses that
  /// cannot be parsed as a valid recommendation response.
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
    final body = <String, dynamic>{
      'N': nitrogen,
      'P': phosphorus,
      'K': potassium,
      'ph': ph,
      'temperature': temperature,
      'humidity': humidity,
      'moisture': moisture,
    };

    // Rainfall is optional — only include if provided
    if (rainfall != null) {
      body['rainfall'] = rainfall;
    }

    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/api/recommend'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return RecommendationResponse.fromJson(data);
    } on http.ClientException {
      throw ApiException('Connection Error — Backend server is unreachable.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Connection Error — Backend server is offline or unreachable.');
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
