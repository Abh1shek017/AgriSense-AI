import 'package:hive_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';

class CacheService {
  static const String recommendationBox = 'recommendations';
  static const String sensorBox = 'sensors';
  static const String weatherBox = 'weather';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(recommendationBox);
    await Hive.openBox(sensorBox);
    await Hive.openBox(weatherBox);
  }

  static Future<void> saveRecommendation(Map<String, dynamic> data) async {
    final box = Hive.box(recommendationBox);
    await box.put('last_recommendation', data);
    await box.put('last_sync', DateTime.now().toIso8601String());
  }

  static Map<String, dynamic>? getLastRecommendation() {
    final box = Hive.box(recommendationBox);
    final data = box.get('last_recommendation');
    if (data != null) {
      return Map<String, dynamic>.from(data);
    }
    return null;
  }

  static String? getLastSyncTime() {
    return Hive.box(recommendationBox).get('last_sync');
  }

  static Stream<ConnectivityResult> get onConnectivityChanged =>
      Connectivity().onConnectivityChanged.map((results) => results.first);

  static Future<bool> isConnected() async {
    final result = await Connectivity().checkConnectivity();
    return result.any((r) => r != ConnectivityResult.none);
  }
}
