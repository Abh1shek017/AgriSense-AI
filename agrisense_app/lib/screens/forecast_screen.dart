import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../services/forecast_service.dart';
import '../services/location_service.dart';

class ForecastScreen extends StatefulWidget {
  const ForecastScreen({super.key});

  @override
  State<ForecastScreen> createState() => _ForecastScreenState();
}

class _ForecastScreenState extends State<ForecastScreen> {
  ForecastResult? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadForecast();
  }

  Future<void> _loadForecast() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final position = await LocationService.determinePosition();
      final result = await ForecastService.fetchForecast(
        position.latitude,
        position.longitude,
      );
      if (mounted) {
        setState(() {
          _data = result;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          _buildBackground(),
          SafeArea(
            child: _loading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: AppTheme.greenPrimary),
                        SizedBox(height: 16),
                        Text(
                          'Fetching live weather...',
                          style: TextStyle(color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  )
                : _error != null
                    ? _buildError()
                    : _buildContent(),
          ),
        ],
      ),
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────────

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 56, color: AppTheme.textMuted),
            const SizedBox(height: 16),
            const Text(
              'Could not load forecast',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadForecast,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.greenPrimary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Main Content ───────────────────────────────────────────────────────────

  Widget _buildContent() {
    final d = _data!;
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildHeader(d.locationLabel),
        const SizedBox(height: 24),
        _buildCurrentWeather(d.current),
        const SizedBox(height: 28),
        const Text(
          '14-Day Forecast',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        _buildForecastStrip(d.daily),
        const SizedBox(height: 28),
        _buildDailyDetail(d.daily),
        const SizedBox(height: 28),
        _buildCropInsights(d.cropInsights),
        const SizedBox(height: 20),
      ],
    );
  }

  // ─── Header ─────────────────────────────────────────────────────────────────

  Widget _buildHeader(String location) {
    return Row(
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Weather Forecast',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                const Icon(Icons.location_on, size: 13, color: AppTheme.greenPrimary),
                const SizedBox(width: 4),
                Text(
                  location,
                  style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                ),
              ],
            ),
          ],
        ),
        const Spacer(),
        GestureDetector(
          onTap: _loadForecast,
          child: AppTheme.glassContainer(
            padding: const EdgeInsets.all(10),
            child: const Icon(Icons.refresh, size: 20, color: AppTheme.greenPrimary),
          ),
        ),
      ],
    );
  }

  // ─── Current Weather Card ───────────────────────────────────────────────────

  Widget _buildCurrentWeather(CurrentWeather cur) {
    return AppTheme.glassContainer(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${cur.temperature.toStringAsFixed(1)}°C',
                    style: const TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    cur.description,
                    style: const TextStyle(
                      fontSize: 16,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Feels like ${cur.apparentTemperature.toStringAsFixed(1)}°C',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              _weatherIcon(cur.iconCategory, size: 72),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Color(0x14FFFFFF)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _weatherMeta(
                Icons.water_drop,
                '${cur.humidity.toStringAsFixed(0)}%',
                'Humidity',
              ),
              _weatherMeta(
                Icons.air,
                '${cur.windSpeed.toStringAsFixed(1)} km/h',
                'Wind',
              ),
              _weatherMeta(
                Icons.visibility,
                '${(cur.visibility / 1000).toStringAsFixed(1)} km',
                'Visibility',
              ),
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
        Text(val, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
      ],
    );
  }

  // ─── 14-Day Horizontal Strip ─────────────────────────────────────────────────

  Widget _buildForecastStrip(List<DayForecast> days) {
    return SizedBox(
      height: 130,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: days.length,
        itemBuilder: (context, i) {
          final day = days[i];
          final isToday = i == 0;
          final label = isToday
              ? 'Today'
              : DateFormat('E d').format(day.date); // e.g. "Mon 16"
          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: AppTheme.glassContainer(
              borderColor: isToday ? AppTheme.greenPrimary : null,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                      color: isToday ? AppTheme.greenPrimary : AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _weatherIcon(day.iconCategory, size: 26),
                  const SizedBox(height: 6),
                  Text(
                    '${day.maxTemp.toStringAsFixed(0)}°',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  Text(
                    '${day.minTemp.toStringAsFixed(0)}°',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ─── Detailed Daily List ────────────────────────────────────────────────────

  Widget _buildDailyDetail(List<DayForecast> days) {
    return AppTheme.glassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: Text(
              'Daily Details',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
          ),
          ...days.map((day) => _dailyRow(day)),
        ],
      ),
    );
  }

  Widget _dailyRow(DayForecast day) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 60,
            child: Text(
              day.date.day == DateTime.now().day
                  ? 'Today'
                  : DateFormat('E d').format(day.date),
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
          ),
          _weatherIcon(day.iconCategory, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              day.description,
              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          // Precipitation badge
          if (day.precipitation > 0.5)
            Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.water_drop, size: 10, color: Colors.blueAccent),
                  const SizedBox(width: 2),
                  Text(
                    '${day.precipitation.toStringAsFixed(1)}mm',
                    style: const TextStyle(fontSize: 10, color: Colors.blueAccent),
                  ),
                ],
              ),
            ),
          // Temp range
          Text(
            '${day.maxTemp.toStringAsFixed(0)}° / ${day.minTemp.toStringAsFixed(0)}°',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  // ─── Crop Insights ──────────────────────────────────────────────────────────

  Widget _buildCropInsights(List<String> insights) {
    return AppTheme.glassContainer(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lightbulb_outline, size: 18, color: AppTheme.greenPrimary),
              SizedBox(width: 8),
              Text(
                'Smart Insights',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Generated from 14-day forecast data',
            style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 16),
          ...insights.map(
            (text) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '• ',
                    style: TextStyle(
                      color: AppTheme.greenPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      text,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Background ─────────────────────────────────────────────────────────────

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
                color: AppTheme.greenPrimary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -80, left: -60,
            child: Container(
              width: 250, height: 250,
              decoration: BoxDecoration(
                color: Colors.blueAccent.withValues(alpha: 0.06),
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Weather Icon Helper ────────────────────────────────────────────────────

  Widget _weatherIcon(String category, {double size = 24}) {
    final (icon, color) = switch (category) {
      'sunny' => (Icons.wb_sunny, Colors.orangeAccent),
      'partly_cloudy' => (Icons.wb_cloudy, Colors.lightBlueAccent),
      'cloudy' => (Icons.cloud, Colors.grey),
      'rainy' => (Icons.grain, Colors.blueAccent),
      'snowy' => (Icons.ac_unit, Colors.cyan),
      'stormy' => (Icons.thunderstorm, Colors.purpleAccent),
      _ => (Icons.wb_sunny_outlined, Colors.orangeAccent),
    };
    return Icon(icon, size: size, color: color);
  }
}
