import 'dart:convert';
import 'dart:async';
import 'dart:io';
import '../models/recommendation.dart';

/// Service for communicating with the Flask crop recommendation API.
class ApiService {
  /// Base URL for the crop recommendation API (Railway deployment).
  static const String _baseUrl =
      'https://agrisense-ai-production.up.railway.app';

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

    final url = '$_baseUrl/api/recommend';
    print('[ApiService] POST $url');

    try {
      // Check internet connection first
      try {
        final result = await InternetAddress.lookup('google.com');
        if (result.isNotEmpty && result[0].rawAddress.isNotEmpty) {
          print('[ApiService] Internet connected');
        }
      } on SocketException catch (_) {
        throw ApiException('No internet connection. Please check your data/WiFi.');
      }

      final client = HttpClient()
        ..connectionTimeout = const Duration(seconds: 30)
        ..badCertificateCallback = (cert, host, port) => true;

      final request = await client.postUrl(Uri.parse(url));
      request.headers.set('Content-Type', 'application/json');
      request.write(jsonEncode(body));

      final response = await request.close().timeout(
            const Duration(seconds: 30),
          );

      final responseBody = await response.transform(utf8.decoder).join();
      print('[ApiService] Status: ${response.statusCode}');
      print('[ApiService] Response: $responseBody');

      client.close();

      final data = jsonDecode(responseBody) as Map<String, dynamic>;
      return RecommendationResponse.fromJson(data);
    } on SocketException catch (e) {
      print('[ApiService] SocketException: $e');
      throw ApiException(
          'Connection Error — No internet or server unreachable. ($e)');
    } on TimeoutException {
      print('[ApiService] TimeoutException');
      throw ApiException('Connection Error — Request timed out. Try again.');
    } on HandshakeException catch (e) {
      print('[ApiService] HandshakeException (SSL): $e');
      throw ApiException('Connection Error — SSL handshake failed. ($e)');
    } catch (e) {
      print('[ApiService] Unknown error: ${e.runtimeType}: $e');
      if (e is ApiException) rethrow;
      throw ApiException('Connection Error — $e');
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
