import 'package:dio/dio.dart';
import 'package:intl/intl.dart';

class NasaService {
  static final Dio _dio = Dio();
  static const String _baseUrl = 'https://power.larc.nasa.gov/api/temporal/daily/point';

  /// Fetches NASA POWER data (Solar Radiation, Humidity, Temp) for the last 30 days.
  static Future<Map<String, dynamic>> getClimateData(double lat, double lon) async {
    final now = DateTime.now();
    final thirtyDaysAgo = now.subtract(const Duration(days: 30));
    
    final dateFormat = DateFormat('yyyyMMdd');
    final start = dateFormat.format(thirtyDaysAgo);
    final end = dateFormat.format(now);

    try {
      final response = await _dio.get(
        _baseUrl,
        queryParameters: {
          'longitude': lon,
          'latitude': lat,
          'start': start,
          'end': end,
          'parameters': 'ALLSKY_SFC_SW_DWN,RH2M,T2M',
          'community': 'AG',
          'format': 'JSON',
        },
      );

      if (response.statusCode == 200) {
        final parameterData = response.data['properties']['parameter'];
        return parameterData;
      }
    } catch (e) {
      print('[NasaService] Error: $e');
    }
    return {};
  }
}
