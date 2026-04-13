import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ForecastScreen extends StatelessWidget {
  const ForecastScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background
          _buildBackground(),
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildHeader(),
                const SizedBox(height: 32),
                _buildCurrentWeather(),
                const SizedBox(height: 32),
                const Text(
                  '14-Day Forecast',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildForecastStrip(),
                const SizedBox(height: 32),
                _buildCropInsights(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackground() {
    return Container(
      decoration: const BoxDecoration(color: AppTheme.bgDeep),
      child: Stack(
        children: [
          Positioned(
            top: -100, right: -50,
            child: Container(
              width: 300, height: 300,
              decoration: BoxDecoration(
                color: AppTheme.greenPrimary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Weather Forecast',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            Text(
              'Location: Central Field Zone A',
              style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
            ),
          ],
        ),
        const Spacer(),
        AppTheme.glassContainer(
          padding: const EdgeInsets.all(10),
          child: const Icon(Icons.refresh, size: 20, color: AppTheme.greenPrimary),
        ),
      ],
    );
  }

  Widget _buildCurrentWeather() {
    return AppTheme.glassContainer(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('28°C', style: TextStyle(fontSize: 48, fontWeight: FontWeight.w800)),
                  Text('Partly Cloudy', style: TextStyle(fontSize: 16, color: AppTheme.textSecondary)),
                ],
              ),
              Icon(Icons.wb_cloudy, size: 64, color: Colors.blueAccent),
            ],
          ),
          const SizedBox(height: 24),
          const Divider(color: Color(0x14FFFFFF)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _weatherMeta(Icons.water_drop, '82%', 'Humidity'),
              _weatherMeta(Icons.air, '12 km/h', 'Wind'),
              _weatherMeta(Icons.visibility, '10 km', 'Visibility'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _weatherMeta(IconData icon, String val, String label) {
    return Column(
      children: [
        Icon(icon, size: 18, color: AppTheme.greenPrimary),
        const SizedBox(height: 8),
        Text(val, style: const TextStyle(fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
      ],
    );
  }

  Widget _buildForecastStrip() {
    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 14,
        itemBuilder: (context, index) {
          final isToday = index == 0;
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: AppTheme.glassContainer(
              borderColor: isToday ? AppTheme.greenPrimary : null,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    isToday ? 'Today' : 'Apr ${14 + index}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                      color: isToday ? AppTheme.greenPrimary : AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Icon(Icons.wb_sunny_outlined, size: 24, color: Colors.orangeAccent),
                  const SizedBox(height: 8),
                  Text('${26 + (index % 3)}°', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCropInsights() {
    return AppTheme.glassContainer(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lightbulb_outline, size: 18, color: AppTheme.greenPrimary),
              SizedBox(width: 8),
              Text('Smart Insights', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          _insightItem('Optimal sowing conditions predicted for next 3 days.'),
          _insightItem('High evaporation rate expected on April 18. Increase irrigation.'),
          _insightItem('Low night temperature on April 20 might affect seedling growth.'),
        ],
      ),
    );
  }

  Widget _insightItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(color: AppTheme.greenPrimary, fontWeight: FontWeight.bold)),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary))),
        ],
      ),
    );
  }
}
