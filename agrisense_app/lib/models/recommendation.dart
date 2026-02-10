/// Data models for the Flask API response.

class CropRecommendation {
  final String crop;
  final String confidence;

  /// Parsed numeric confidence (e.g., "95%" → 95.0).
  double get confidenceValue =>
      double.tryParse(confidence.replaceAll('%', '')) ?? 0.0;

  CropRecommendation({
    required this.crop,
    required this.confidence,
  });

  factory CropRecommendation.fromJson(Map<String, dynamic> json) {
    return CropRecommendation(
      crop: json['crop'] as String? ?? 'Unknown',
      confidence: json['confidence'] as String? ?? '0%',
    );
  }
}

class RecommendationResponse {
  final String status;
  final List<CropRecommendation> recommendations;
  final List<String>? warnings;
  final String? rainfallSource;
  final double? rainfallValueUsed;
  final String? errorMessage;
  final List<String>? errors;

  bool get isSuccess => status == 'success';
  bool get hasWarnings => warnings != null && warnings!.isNotEmpty;

  RecommendationResponse({
    required this.status,
    required this.recommendations,
    this.warnings,
    this.rainfallSource,
    this.rainfallValueUsed,
    this.errorMessage,
    this.errors,
  });

  factory RecommendationResponse.fromJson(Map<String, dynamic> json) {
    return RecommendationResponse(
      status: json['status'] as String? ?? 'error',
      recommendations: (json['recommendations'] as List<dynamic>?)
              ?.map((e) =>
                  CropRecommendation.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      warnings: (json['warnings'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      rainfallSource:
          (json['metadata'] as Map<String, dynamic>?)?['rainfall_source']
              as String?,
      rainfallValueUsed:
          ((json['metadata'] as Map<String, dynamic>?)?['rainfall_value_used']
                  as num?)
              ?.toDouble(),
      errorMessage: json['message'] as String?,
      errors: (json['errors'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
    );
  }
}
