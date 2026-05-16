import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../theme/app_theme.dart';
import '../services/location_service.dart';
import 'dart:math' as math;

class FieldMapScreen extends StatefulWidget {
  const FieldMapScreen({super.key});

  @override
  State<FieldMapScreen> createState() => _FieldMapScreenState();
}

class _FieldMapScreenState extends State<FieldMapScreen> {
  Position? _currentPosition;
  bool _loading = true;
  String? _error;
  final List<Position> _waypoints = [];

  @override
  void initState() {
    super.initState();
    _fetchLocation();
  }

  Future<void> _fetchLocation() async {
    setState(() { _loading = true; _error = null; });
    try {
      final pos = await LocationService.determinePosition();
      if (mounted) setState(() { _currentPosition = pos; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  void _addWaypoint() {
    if (_currentPosition == null) return;
    setState(() => _waypoints.add(_currentPosition!));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Waypoint ${_waypoints.length} added'),
        backgroundColor: AppTheme.greenPrimary,
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _clearWaypoints() => setState(() => _waypoints.clear());

  /// Shoelace formula on a flat-earth approximation (accurate for small fields)
  double _calculateAreaHectares() {
    if (_waypoints.length < 3) return 0;
    double area = 0;
    final n = _waypoints.length;
    for (int i = 0; i < n; i++) {
      final j = (i + 1) % n;
      final xi = _waypoints[i].longitude * (math.pi / 180) *
          math.cos(_waypoints[i].latitude * math.pi / 180) * 6371000;
      final yi = _waypoints[i].latitude * (math.pi / 180) * 6371000;
      final xj = _waypoints[j].longitude * (math.pi / 180) *
          math.cos(_waypoints[j].latitude * math.pi / 180) * 6371000;
      final yj = _waypoints[j].latitude * (math.pi / 180) * 6371000;
      area += xi * yj - xj * yi;
    }
    return (area.abs() / 2) / 10000; // m² → hectares
  }

  String _accuracyLabel(double? acc) {
    if (acc == null) return 'Unknown';
    if (acc <= 5) return 'Excellent';
    if (acc <= 15) return 'Good';
    if (acc <= 30) return 'Fair';
    return 'Poor';
  }

  Color _accuracyColor(double? acc) {
    if (acc == null) return AppTheme.textMuted;
    if (acc <= 5) return AppTheme.greenPrimary;
    if (acc <= 15) return Colors.lightGreenAccent;
    if (acc <= 30) return Colors.amber;
    return AppTheme.redDanger;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background
          Container(
            decoration: const BoxDecoration(color: AppTheme.bgDeep),
            child: Stack(children: [
              Positioned(
                top: -80, right: -60,
                child: Container(
                  width: 280, height: 280,
                  decoration: BoxDecoration(
                    color: AppTheme.greenPrimary.withValues(alpha: 0.07),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Positioned(
                bottom: -60, left: -40,
                child: Container(
                  width: 220, height: 220,
                  decoration: BoxDecoration(
                    color: Colors.blueAccent.withValues(alpha: 0.05),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ]),
          ),
          SafeArea(
            child: _loading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: AppTheme.greenPrimary),
                        SizedBox(height: 16),
                        Text('Acquiring GPS signal…',
                            style: TextStyle(color: AppTheme.textSecondary)),
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

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.gps_off, size: 56, color: AppTheme.textMuted),
            const SizedBox(height: 16),
            const Text('GPS Unavailable',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(_error ?? 'Unknown error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 13)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchLocation,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.greenPrimary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    final pos = _currentPosition!;
    final areaHa = _calculateAreaHectares();
    final accColor = _accuracyColor(pos.accuracy);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // ── Header ──────────────────────────────────────────────────────────
        Row(
          children: [
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('GPS Field Manager',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                Text('Mark boundaries · Calculate area',
                    style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
              ],
            ),
            const Spacer(),
            GestureDetector(
              onTap: _fetchLocation,
              child: AppTheme.glassContainer(
                padding: const EdgeInsets.all(10),
                child: const Icon(Icons.my_location, size: 20, color: AppTheme.greenPrimary),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // ── Live GPS Card ────────────────────────────────────────────────────
        AppTheme.glassContainer(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 10, height: 10,
                    decoration: BoxDecoration(color: accColor, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  Text('Live Location',
                      style: TextStyle(
                        fontSize: 12,
                        color: accColor,
                        fontWeight: FontWeight.w600,
                      )),
                  const Spacer(),
                  Text(
                    '±${pos.accuracy.toStringAsFixed(1)} m · ${_accuracyLabel(pos.accuracy)}',
                    style: TextStyle(fontSize: 11, color: accColor),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _coordCard('Latitude', '${pos.latitude.toStringAsFixed(6)}°')),
                  const SizedBox(width: 12),
                  Expanded(child: _coordCard('Longitude', '${pos.longitude.toStringAsFixed(6)}°')),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _coordCard('Altitude',
                      pos.altitude > 0 ? '${pos.altitude.toStringAsFixed(1)} m' : 'N/A')),
                  const SizedBox(width: 12),
                  Expanded(child: _coordCard('Speed',
                      pos.speed > 0 ? '${(pos.speed * 3.6).toStringAsFixed(1)} km/h' : '0 km/h')),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // ── Field Capture ────────────────────────────────────────────────────
        AppTheme.glassContainer(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.crop_free, size: 18, color: AppTheme.greenPrimary),
                  SizedBox(width: 8),
                  Text('Field Boundary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Walk the perimeter of your field and add GPS waypoints to calculate area.',
                style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 16),

              // Waypoint count + area
              Row(
                children: [
                  Expanded(child: _statTile('Waypoints', '${_waypoints.length}', Icons.location_on)),
                  const SizedBox(width: 12),
                  Expanded(child: _statTile(
                    'Area',
                    _waypoints.length >= 3 ? '${areaHa.toStringAsFixed(3)} ha' : '—',
                    Icons.straighten,
                  )),
                  const SizedBox(width: 12),
                  Expanded(child: _statTile(
                    'Acres',
                    _waypoints.length >= 3 ? (areaHa * 2.471).toStringAsFixed(2) : '—',
                    Icons.grass,
                  )),
                ],
              ),
              const SizedBox(height: 16),

              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _addWaypoint,
                      icon: const Icon(Icons.add_location, size: 18),
                      label: const Text('Add Waypoint'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.greenPrimary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton(
                    onPressed: _waypoints.isEmpty ? null : _clearWaypoints,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.redDanger.withValues(alpha: 0.15),
                      foregroundColor: AppTheme.redDanger,
                      disabledBackgroundColor: Colors.transparent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
                    ),
                    child: const Icon(Icons.delete_outline, size: 18),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // ── Waypoint List ─────────────────────────────────────────────────────
        if (_waypoints.isNotEmpty) ...[
          AppTheme.glassContainer(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.pin_drop, size: 18, color: AppTheme.greenPrimary),
                    SizedBox(width: 8),
                    Text('Recorded Waypoints',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 12),
                ...List.generate(_waypoints.length, (i) {
                  final wp = _waypoints[i];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 26, height: 26,
                          decoration: BoxDecoration(
                            color: AppTheme.greenPrimary.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.greenPrimary.withValues(alpha: 0.4)),
                          ),
                          alignment: Alignment.center,
                          child: Text('${i + 1}',
                              style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.greenPrimary)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '${wp.latitude.toStringAsFixed(6)}°, ${wp.longitude.toStringAsFixed(6)}°',
                            style: const TextStyle(
                                fontSize: 12,
                                fontFamily: 'monospace',
                                color: AppTheme.textSecondary),
                          ),
                        ),
                        Text('±${wp.accuracy.toStringAsFixed(0)}m',
                            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                      ],
                    ),
                  );
                }),
                if (_waypoints.length >= 3) ...[
                  const Divider(color: Color(0x14FFFFFF)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.check_circle_outline,
                          size: 16, color: AppTheme.greenPrimary),
                      const SizedBox(width: 8),
                      Text(
                        'Field area: ${areaHa.toStringAsFixed(4)} ha '
                        '(${(areaHa * 2.471).toStringAsFixed(3)} acres)',
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.greenPrimary),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],

        // ── Tips ──────────────────────────────────────────────────────────────
        AppTheme.glassContainer(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.info_outline, size: 16, color: AppTheme.greenPrimary),
                  SizedBox(width: 8),
                  Text('How to map your field',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                ],
              ),
              const SizedBox(height: 10),
              ...[
                '1. Stand at a corner of your field and tap Add Waypoint.',
                '2. Walk to each corner and tap Add Waypoint at each one.',
                '3. After 3+ waypoints, area is calculated automatically.',
                '4. For best accuracy, wait for GPS accuracy ≤ 10 m.',
              ].map((t) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(t,
                        style: const TextStyle(
                            fontSize: 12, color: AppTheme.textMuted, height: 1.4)),
                  )),
            ],
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _coordCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace')),
        ],
      ),
    );
  }

  Widget _statTile(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.greenPrimary.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.greenPrimary.withValues(alpha: 0.15)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 18, color: AppTheme.greenPrimary),
          const SizedBox(height: 6),
          Text(value,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          Text(label,
              style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}
