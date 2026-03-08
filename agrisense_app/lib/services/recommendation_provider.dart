import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_service.dart';
import '../models/recommendation.dart';

// State classes
abstract class RecommendationState {}

class RecommendationInitial extends RecommendationState {}

class RecommendationLoading extends RecommendationState {}

class RecommendationLoaded extends RecommendationState {
  final RecommendationResponse response;
  RecommendationLoaded(this.response);
}

class RecommendationError extends RecommendationState {
  final String message;
  RecommendationError(this.message);
}

// Notifier
class RecommendationNotifier extends Notifier<RecommendationState> {
  @override
  RecommendationState build() {
    return RecommendationInitial();
  }

  Future<void> fetchRecommendation({
    required double nitrogen,
    required double phosphorus,
    required double potassium,
    required double ph,
    required double temperature,
    required double humidity,
    required double moisture,
    double? rainfall,
  }) async {
    state = RecommendationLoading();
    try {
      final response = await ApiService.getRecommendation(
        nitrogen: nitrogen,
        phosphorus: phosphorus,
        potassium: potassium,
        ph: ph,
        temperature: temperature,
        humidity: humidity,
        moisture: moisture,
        rainfall: rainfall,
      );
      state = RecommendationLoaded(response);
    } catch (e) {
      state = RecommendationError(e.toString());
    }
  }

  void reset() {
    state = RecommendationInitial();
  }
}

// Provider
final recommendationProvider = NotifierProvider<RecommendationNotifier, RecommendationState>(() {
  return RecommendationNotifier();
});
