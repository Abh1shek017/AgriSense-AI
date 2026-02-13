import 'dart:convert';
import 'package:http/http.dart' as http;

class WeatherService {
  static const String _archiveUrl = 'https://archive-api.open-meteo.com/v1/archive';

  /// Fetches the current rainfall (precipitation) for the given location.
  /// Returns the rainfall in mm.
  /// Fetches the TOTAL seasonal rainfall for the current agricultural season.
  /// Uses historical data from the previous year as a proxy for the expected rainfall.
  static Future<double> getSeasonalRainfall(double latitude, double longitude) async {
    final now = DateTime.now();
    final seasonDates = _getSeasonDates(now);
    
    // Use last year's data for the full season to get a complete picture
    // If we are in 2024, we fetch data for the same period in 2023.
    final startYear = now.year - 1;
    final start = DateTime(startYear, seasonDates['startMonth']!, 1);
    
    // Handle season spanning across year end (Rabi)
    final endYear = seasonDates['crossYear']! ? startYear + 1 : startYear;
    // End date is approx end of the endMonth
    final end = DateTime(endYear, seasonDates['endMonth']! + 1, 0);

    final startStr = "${start.year}-${start.month.toString().padLeft(2, '0')}-${start.day.toString().padLeft(2, '0')}";
    final endStr = "${end.year}-${end.month.toString().padLeft(2, '0')}-${end.day.toString().padLeft(2, '0')}";

    print('[WeatherService] Fetching seasonal rainfall (${seasonDates['name']}) for $startStr to $endStr');

    final url = Uri.parse(
        '$_archiveUrl?latitude=$latitude&longitude=$longitude&start_date=$startStr&end_date=$endStr&daily=precipitation_sum&timezone=auto');

    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['daily'] != null && data['daily']['precipitation_sum'] != null) {
          final List dailySums = data['daily']['precipitation_sum'];
          
          // Sum up all daily rainfall values (handling nulls as 0.0)
          double totalRainfall = 0.0;
          for (var item in dailySums) {
            if (item != null) {
              totalRainfall += (item as num).toDouble();
            }
          }
          print('[WeatherService] Total seasonal rainfall: $totalRainfall mm');
          return totalRainfall;
        } else {
           throw Exception('Weather data format error: Missing daily precipitation data');
        }
      } else {
        throw Exception('Failed to load weather data: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Weather Service Error: $e');
    }
  }

  /// Determines the current agricultural season and its month range.
  /// Returns a map with 'name', 'startMonth', 'endMonth', 'crossYear'.
  static Map<String, dynamic> _getSeasonDates(DateTime date) {
    final month = date.month;

    // Zaid: Feb, Mar, Apr, May (Sowing Feb-Mar, Harvest May-June)
    // Kharif: June, July, Aug, Sept (Sowing June-July, Harvest Sept-Oct)
    // Rabi: Oct, Nov, Dec, Jan (Sowing Oct-Nov, Harvest Feb-Mar)

    if (month >= 2 && month <= 5) {
      return {
        'name': 'Zaid',
        'startMonth': 2, // Feb
        'endMonth': 6,   // June
        'crossYear': false,
      };
    } else if (month >= 6 && month <= 9) {
      return {
        'name': 'Kharif',
        'startMonth': 6, // June
        'endMonth': 11,  // Nov
        'crossYear': false,
      };
    } else {
      // Rabi (Oct to Jan/Feb)
      return {
        'name': 'Rabi',
        'startMonth': 10, // Oct
        'endMonth': 3,    // March (next year)
        'crossYear': true,
      };
    }
  }
}
