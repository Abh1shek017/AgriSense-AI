import 'dart:convert';
import 'dart:async';
import 'dart:io';
import '../models/recommendation.dart';
import 'location_service.dart';
import 'weather_service.dart';

/// Service for communicating with the Flask crop recommendation API.
class ApiService {
  /// Base domain and URL for the crop recommendation API.
  static const String _domain = 'agrisense-ai-production.up.railway.app';
  static const String _baseUrl = 'https://$_domain';

  /// POST sensor data to /api/recommend and return parsed response.
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
    // Auto-fetch rainfall if missing
    double? finalRainfall = rainfall;
    if (finalRainfall == null) {
      try {
        print('[ApiService] Rainfall not provided. Fetching from location...');
        final position = await LocationService.determinePosition();
        final fetchedVal = await WeatherService.getSeasonalRainfall(
          position.latitude,
          position.longitude,
        );
        print('[ApiService] Auto-fetched rainfall: $fetchedVal mm');
        finalRainfall = fetchedVal;
      } catch (e) {
        print('[ApiService] Failed to fetch rainfall: $e');
        // Continue without rainfall (backend handles it)
      }
    }

    final body = <String, dynamic>{
      'N': nitrogen,
      'P': phosphorus,
      'K': potassium,
      'ph': ph,
      'temperature': temperature,
      'humidity': humidity,
      'moisture': moisture,
    };

    if (finalRainfall != null) {
      body['rainfall'] = finalRainfall;
    }

    print('[ApiService] Initiating request to $_baseUrl');

    try {
      // 1. Try standard request first
      return await _performRequest(_baseUrl, body);
    } catch (e) {
      print('[ApiService] Standard request failed: $e');
      print('[ApiService] Attempting DNS-over-HTTPS check...');

      // 2. Fallback: Resolve IP manually via Google DNS
      try {
        final ip = await _resolveIpOverHttps(_domain);
        if (ip != null) {
          print('[ApiService] Resolved IP via DoH: $ip');
          // Retry with direct IP but Host header set to original domain
          return await _performRequest('https://$ip', body, hostHeader: _domain);
        } else {
           print('[ApiService] DoH returned no IP.');
        }
      } catch (dohError) {
        print('[ApiService] DoH fallback failed: $dohError');
      }
      // If fallback fails, rethrow the original error
      if (e is ApiException) rethrow;
      throw ApiException('Connection Error: $e');
    }
  }

  /// Helper to perform the actual HTTP request
  static Future<RecommendationResponse> _performRequest(
    String baseUrl,
    Map<String, dynamic> body, {
    String? hostHeader,
  }) async {
    final client = HttpClient()
      ..connectionTimeout = const Duration(seconds: 30)
      ..badCertificateCallback = (cert, host, port) => true;

    try {
      final request = await client.postUrl(Uri.parse('$baseUrl/api/recommend'));

      // Critical logic: If connecting by IP, we MUST set the Host header
      // so the server knows which site we are requesting.
      if (hostHeader != null) {
        request.headers.set('Host', hostHeader);
      }

      request.headers.set('Content-Type', 'application/json');
      request.write(jsonEncode(body));

      final response = await request.close().timeout(
            const Duration(seconds: 30),
          );

      final responseBody = await response.transform(utf8.decoder).join();
      print('[ApiService] Status: ${response.statusCode}');
      print('[ApiService] Response: $responseBody');

      if (response.statusCode != 200) {
        throw ApiException('Server error: ${response.statusCode}');
      }

      final data = jsonDecode(responseBody) as Map<String, dynamic>;
      return RecommendationResponse.fromJson(data);
    } on SocketException catch (e) {
       // Catch connection errors specifically to allow fallback
       print('[SocketException] $e');
       throw e; 
    } catch (e) {
       // Catch other errors
       print('[Error] $e');
       throw e;
    } finally {
      client.close();
    }
  }

  /// Resolves domain IPv4 using Google's DNS-over-HTTPS API.
  /// Bypasses local system DNS.
  static Future<String?> _resolveIpOverHttps(String domain) async {
    final client = HttpClient();
    try {
      // Use Google Public DNS API
      final uri = Uri.parse('https://dns.google/resolve?name=$domain&type=A');
      print('[ApiService] Querying DoH: $uri');
      
      final request = await client.getUrl(uri);
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      final json = jsonDecode(body);

      if (json['Status'] == 0 && json['Answer'] != null) {
        for (var answer in json['Answer']) {
          if (answer['type'] == 1) { // Type 1 is A record (IPv4)
            return answer['data'];
          }
        }
      }
      return null;
    } finally {
      client.close();
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
