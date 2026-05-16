import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Model for a single day's forecast data.
class DayForecast {
  final DateTime date;
  final double maxTemp;
  final double minTemp;
  final double precipitation;
  final double windSpeed;
  final int weatherCode; // WMO weather code
  final double uvIndex;
  final double et0; // Evapotranspiration (mm) – key for irrigation decisions

  const DayForecast({
    required this.date,
    required this.maxTemp,
    required this.minTemp,
    required this.precipitation,
    required this.windSpeed,
    required this.weatherCode,
    required this.uvIndex,
    required this.et0,
  });

  /// Average temperature for the day
  double get avgTemp => (maxTemp + minTemp) / 2;

  /// Human-readable weather description from WMO code
  String get description => _wmoDescription(weatherCode);

  /// Returns an icon-name category for the UI to pick the right icon
  String get iconCategory => _wmoIconCategory(weatherCode);
}

/// Model for current conditions (from hourly data at the current hour).
class CurrentWeather {
  final double temperature;
  final double humidity;
  final double windSpeed;
  final double visibility;
  final int weatherCode;
  final double apparentTemperature;

  const CurrentWeather({
    required this.temperature,
    required this.humidity,
    required this.windSpeed,
    required this.visibility,
    required this.weatherCode,
    required this.apparentTemperature,
  });

  String get description => _wmoDescription(weatherCode);
  String get iconCategory => _wmoIconCategory(weatherCode);
}

/// Combined result returned by [ForecastService.fetchForecast].
class ForecastResult {
  final CurrentWeather current;
  final List<DayForecast> daily;
  final List<String> cropInsights;
  final String locationLabel;

  const ForecastResult({
    required this.current,
    required this.daily,
    required this.cropInsights,
    required this.locationLabel,
  });
}

/// Service that fetches real weather + 14-day forecast from Open-Meteo.
/// No API key required. Free for non-commercial use.
/// Docs: https://open-meteo.com/en/docs
class ForecastService {
  static const String _baseUrl = 'https://api.open-meteo.com/v1/forecast';

  /// Fetches current weather and 14-day forecast for the given coordinates.
  /// Also generates smart crop insights based on the forecast data.
  static Future<ForecastResult> fetchForecast(
    double latitude,
    double longitude,
  ) async {
    final uri = Uri.parse(_baseUrl).replace(queryParameters: {
      'latitude': '$latitude',
      'longitude': '$longitude',
      'current': [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'weather_code',
        'wind_speed_10m',
        'visibility',
      ].join(','),
      'daily': [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'wind_speed_10m_max',
        'uv_index_max',
        'et0_fao_evapotranspiration', // critical for irrigation
      ].join(','),
      'timezone': 'auto',
      'forecast_days': '14',
    });

    debugPrint('[ForecastService] Fetching: $uri');

    final response = await http.get(uri).timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) {
      throw Exception('Forecast API error: ${response.statusCode}');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    // Parse current weather
    final cur = data['current'] as Map<String, dynamic>;
    final current = CurrentWeather(
      temperature: (cur['temperature_2m'] as num).toDouble(),
      humidity: (cur['relative_humidity_2m'] as num).toDouble(),
      windSpeed: (cur['wind_speed_10m'] as num).toDouble(),
      visibility: (cur['visibility'] as num?)?.toDouble() ?? 10000.0,
      weatherCode: (cur['weather_code'] as num).toInt(),
      apparentTemperature: (cur['apparent_temperature'] as num).toDouble(),
    );

    // Parse 14-day daily forecast
    final daily = data['daily'] as Map<String, dynamic>;
    final dates = (daily['time'] as List).cast<String>();
    final maxTemps = (daily['temperature_2m_max'] as List).cast<num?>();
    final minTemps = (daily['temperature_2m_min'] as List).cast<num?>();
    final precips = (daily['precipitation_sum'] as List).cast<num?>();
    final winds = (daily['wind_speed_10m_max'] as List).cast<num?>();
    final codes = (daily['weather_code'] as List).cast<num?>();
    final uvs = (daily['uv_index_max'] as List).cast<num?>();
    final et0s = (daily['et0_fao_evapotranspiration'] as List).cast<num?>();

    final days = List.generate(dates.length, (i) {
      return DayForecast(
        date: DateTime.parse(dates[i]),
        maxTemp: maxTemps[i]?.toDouble() ?? 0.0,
        minTemp: minTemps[i]?.toDouble() ?? 0.0,
        precipitation: precips[i]?.toDouble() ?? 0.0,
        windSpeed: winds[i]?.toDouble() ?? 0.0,
        weatherCode: codes[i]?.toInt() ?? 0,
        uvIndex: uvs[i]?.toDouble() ?? 0.0,
        et0: et0s[i]?.toDouble() ?? 0.0,
      );
    });

    // Build location label from timezone
    final tz = data['timezone'] as String? ?? 'Unknown';
    final locationLabel = tz.replaceAll('_', ' ').split('/').last;

    final insights = _generateCropInsights(days);

    return ForecastResult(
      current: current,
      daily: days,
      cropInsights: insights,
      locationLabel: locationLabel,
    );
  }

  /// Generates agricultural smart insights from the 14-day forecast.
  static List<String> _generateCropInsights(List<DayForecast> days) {
    final insights = <String>[];
    if (days.isEmpty) return insights;

    // 1. Sowing / clear day window
    final clearDays = days.take(5).where(
      (d) => d.precipitation < 2.0 && d.weatherCode < 50,
    ).length;
    if (clearDays >= 3) {
      insights.add(
        'Optimal sowing window: $clearDays clear days predicted in the next 5 days. '
        'Ideal conditions for field work.',
      );
    }

    // 2. High rain alert
    final heavyRainDays = days.where((d) => d.precipitation > 25.0).toList();
    if (heavyRainDays.isNotEmpty) {
      final dayStr = _shortDate(heavyRainDays.first.date);
      insights.add(
        'Heavy rainfall (>${heavyRainDays.first.precipitation.toStringAsFixed(0)} mm) '
        'expected around $dayStr. Delay field operations and check drainage.',
      );
    }

    // 3. High ET₀ irrigation alert
    final highEtDays = days.take(7).where((d) => d.et0 > 6.0).toList();
    if (highEtDays.isNotEmpty) {
      final dayStr = _shortDate(highEtDays.first.date);
      insights.add(
        'High evapotranspiration (${highEtDays.first.et0.toStringAsFixed(1)} mm/day) '
        'on $dayStr. Increase irrigation to prevent water stress.',
      );
    }

    // 4. Cold night warning (below 10°C)
    final coldNights = days.where((d) => d.minTemp < 10.0).toList();
    if (coldNights.isNotEmpty) {
      final dayStr = _shortDate(coldNights.first.date);
      insights.add(
        'Night temperature drops to ${coldNights.first.minTemp.toStringAsFixed(1)}°C '
        'around $dayStr. Protect seedlings and frost-sensitive crops.',
      );
    }

    // 5. Heat stress warning (above 38°C)
    final hotDays = days.where((d) => d.maxTemp > 38.0).toList();
    if (hotDays.isNotEmpty) {
      final dayStr = _shortDate(hotDays.first.date);
      insights.add(
        'Heat stress risk: Temperature reaching ${hotDays.first.maxTemp.toStringAsFixed(1)}°C '
        'on $dayStr. Consider mulching and early morning irrigation.',
      );
    }

    // 6. High UV alert for crop damage
    final highUvDays = days.take(7).where((d) => d.uvIndex > 8.0).toList();
    if (highUvDays.isNotEmpty) {
      insights.add(
        'UV index above ${highUvDays.first.uvIndex.toStringAsFixed(0)} expected over '
        'next ${highUvDays.length} day(s). Risk of leaf scorch on young crops.',
      );
    }

    // 7. Dry spell alert
    final dryStreak = _longestDryStreak(days);
    if (dryStreak >= 7) {
      insights.add(
        'Dry spell alert: $dryStreak consecutive days with <2 mm rainfall expected. '
        'Ensure adequate soil moisture monitoring.',
      );
    }

    if (insights.isEmpty) {
      insights.add('Conditions look stable for the next 14 days. Regular monitoring recommended.');
    }

    return insights;
  }

  static int _longestDryStreak(List<DayForecast> days) {
    int max = 0, cur = 0;
    for (final d in days) {
      if (d.precipitation < 2.0) {
        cur++;
        if (cur > max) max = cur;
      } else {
        cur = 0;
      }
    }
    return max;
  }

  static String _shortDate(DateTime dt) {
    const months = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[dt.month]} ${dt.day}';
  }
}

// ─── WMO Code Helpers ────────────────────────────────────────────────────────

String _wmoDescription(int code) {
  if (code == 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 9) return 'Overcast';
  if (code <= 19) return 'Fog';
  if (code <= 29) return 'Drizzle';
  if (code <= 39) return 'Dust/Sand';
  if (code <= 49) return 'Fog';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 84) return 'Rain Showers';
  if (code <= 94) return 'Thunderstorm';
  return 'Heavy Thunderstorm';
}

String _wmoIconCategory(int code) {
  if (code == 0) return 'sunny';
  if (code <= 3) return 'partly_cloudy';
  if (code <= 49) return 'cloudy';
  if (code <= 69) return 'rainy';
  if (code <= 79) return 'snowy';
  if (code <= 84) return 'rainy';
  return 'stormy';
}
