import 'dart:convert';
import 'dart:math' as math;

/// Represents a single GPS coordinate point (corner of a field).
class GpsPoint {
  final double latitude;
  final double longitude;
  final double? altitude;
  final double? accuracy;

  const GpsPoint({
    required this.latitude,
    required this.longitude,
    this.altitude,
    this.accuracy,
  });

  Map<String, dynamic> toJson() => {
        'latitude': latitude,
        'longitude': longitude,
        'altitude': altitude,
        'accuracy': accuracy,
      };

  factory GpsPoint.fromJson(Map<String, dynamic> json) => GpsPoint(
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        altitude: json['altitude'] != null ? (json['altitude'] as num).toDouble() : null,
        accuracy: json['accuracy'] != null ? (json['accuracy'] as num).toDouble() : null,
      );

  @override
  String toString() =>
      '${latitude.toStringAsFixed(6)}, ${longitude.toStringAsFixed(6)}';
}

/// Represents a GPS-mapped agricultural field.
class GpsField {
  final String id;
  final String name;
  final List<GpsPoint> corners;
  final DateTime createdAt;
  final String? cropType;
  final String? notes;

  const GpsField({
    required this.id,
    required this.name,
    required this.corners,
    required this.createdAt,
    this.cropType,
    this.notes,
  });

  // ── Area Calculation (Shoelace formula on WGS-84) ─────────────────────

  /// Returns area in square metres using the Haversine-corrected shoelace method.
  double get areaSqMeters {
    if (corners.length < 3) return 0.0;
    // Convert lat/lon to approximate metres using equirectangular projection
    // centred at the field's centroid for accuracy.
    final centLat = corners.map((c) => c.latitude).reduce((a, b) => a + b) / corners.length;
    const metersPerDegLat = 111320.0;
    final metersPerDegLon = 111320.0 * math.cos(centLat * math.pi / 180.0);

    final xs = corners.map((c) => c.longitude * metersPerDegLon).toList();
    final ys = corners.map((c) => c.latitude * metersPerDegLat).toList();

    double area = 0.0;
    final n = xs.length;
    for (int i = 0; i < n; i++) {
      final j = (i + 1) % n;
      area += xs[i] * ys[j];
      area -= xs[j] * ys[i];
    }
    return area.abs() / 2.0;
  }

  double get areaHectares => areaSqMeters / 10000.0;
  double get areaAcres => areaSqMeters / 4046.86;

  /// Perimeter in metres.
  double get perimeterMeters {
    if (corners.length < 2) return 0.0;
    double total = 0.0;
    for (int i = 0; i < corners.length; i++) {
      final a = corners[i];
      final b = corners[(i + 1) % corners.length];
      total += _haversine(a.latitude, a.longitude, b.latitude, b.longitude);
    }
    return total;
  }

  double _haversine(double lat1, double lon1, double lat2, double lon2) {
    const r = 6371000.0; // Earth radius in metres
    final dLat = (lat2 - lat1) * math.pi / 180.0;
    final dLon = (lon2 - lon1) * math.pi / 180.0;
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * math.pi / 180.0) *
            math.cos(lat2 * math.pi / 180.0) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  }

  /// Centroid of the field.
  GpsPoint get centroid {
    final lat = corners.map((c) => c.latitude).reduce((a, b) => a + b) / corners.length;
    final lon = corners.map((c) => c.longitude).reduce((a, b) => a + b) / corners.length;
    return GpsPoint(latitude: lat, longitude: lon);
  }

  // ── Serialization ─────────────────────────────────────────────────────

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'corners': corners.map((c) => c.toJson()).toList(),
        'createdAt': createdAt.toIso8601String(),
        'cropType': cropType,
        'notes': notes,
      };

  factory GpsField.fromJson(Map<String, dynamic> json) => GpsField(
        id: json['id'] as String,
        name: json['name'] as String,
        corners: (json['corners'] as List)
            .map((c) => GpsPoint.fromJson(c as Map<String, dynamic>))
            .toList(),
        createdAt: DateTime.parse(json['createdAt'] as String),
        cropType: json['cropType'] as String?,
        notes: json['notes'] as String?,
      );

  static String encodeList(List<GpsField> fields) =>
      jsonEncode(fields.map((f) => f.toJson()).toList());

  static List<GpsField> decodeList(String raw) {
    final list = jsonDecode(raw) as List;
    return list.map((e) => GpsField.fromJson(e as Map<String, dynamic>)).toList();
  }
}
