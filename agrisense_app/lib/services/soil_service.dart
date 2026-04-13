import 'package:dio/dio.dart';

class SoilService {
  static final Dio _dio = Dio();
  static const String _baseUrl = 'https://rest.isric.org/soilgrids/v2.0/properties/query';

  /// Fetches soil properties for a given location.
  /// Properties: phh2o (pH), sand, silt, clay, nitrogen, soc (carbon), cec (cation exchange capacity), ocd (density).
  static Future<Map<String, double>> getSoilProperties(double lat, double lon) async {
    try {
      final response = await _dio.get(
        _baseUrl,
        queryParameters: {
          'lon': lon,
          'lat': lat,
          'property': ['phh2o', 'nitrogen', 'soc', 'clay', 'silt', 'sand'],
          'depth': '0-5cm',
          'value': 'mean',
        },
      );

      if (response.statusCode == 200) {
        final properties = response.data['properties']['layers'] as List;
        Map<String, double> result = {};

        for (var layer in properties) {
          final name = layer['name'];
          final value = layer['depths'][0]['values']['mean'] as num;
          
          // Map to human readable names and scale if necessary
          switch (name) {
            case 'phh2o':
              result['ph'] = value / 10.0; // pH is returned in pH*10
              break;
            case 'nitrogen':
              result['nitrogen'] = value.toDouble(); // mg/kg
              break;
            case 'soc':
              result['organic_carbon'] = value / 10.0; // dg/kg -> g/kg
              break;
            case 'clay':
              result['clay'] = value / 10.0; // g/kg -> %
              break;
            default:
              result[name] = value.toDouble();
          }
        }
        return result;
      }
    } catch (e) {
      print('[SoilService] Error: $e');
    }
    return {};
  }
}
