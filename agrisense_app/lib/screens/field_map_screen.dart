import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../theme/app_theme.dart';

class FieldMapScreen extends StatefulWidget {
  const FieldMapScreen({super.key});

  @override
  State<FieldMapScreen> createState() => _FieldMapScreenState();
}

class _FieldMapScreenState extends State<FieldMapScreen> {
  bool _showNDVI = false;
  final MapController _mapController = MapController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: const MapOptions(
              initialCenter: LatLng(20.5937, 78.9629), // Default to India
              initialZoom: 5.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.agrisense.app',
              ),
              if (_showNDVI)
                TileLayer(
                  urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                  // backgroundColor and opacity are handled differently in 8.x
                ),
              PolygonLayer(
                polygons: [
                  Polygon<Object>(
                    points: [
                      const LatLng(20.6, 78.9),
                      const LatLng(20.62, 78.9),
                      const LatLng(20.62, 78.92),
                      const LatLng(20.6, 78.92),
                    ],
                    color: AppTheme.greenPrimary.withValues(alpha: 0.3),
                    // isFilled is removed in 8.x (filled if color is present)
                    borderColor: AppTheme.greenPrimary,
                    borderStrokeWidth: 2,
                  ),
                ],
              ),
            ],
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(),
                  const Spacer(),
                  _buildMapControls(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return AppTheme.glassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          const Icon(Icons.map, color: AppTheme.greenPrimary),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Field Map',
                  style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  'Zone Visualization & NDVI',
                  style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.my_location, color: AppTheme.textPrimary),
            onPressed: () {
              // TODO: Implement current location zoom
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMapControls() {
    return Align(
      alignment: Alignment.bottomRight,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _controlButton(
            icon: _showNDVI ? Icons.layers : Icons.layers_outlined,
            label: 'NDVI',
            active: _showNDVI,
            onPressed: () => setState(() => _showNDVI = !_showNDVI),
          ),
          const SizedBox(height: 12),
          _controlButton(
            icon: Icons.add_location_alt,
            label: 'Add Zone',
            active: false,
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _controlButton({
    required IconData icon,
    required String label,
    required bool active,
    required VoidCallback onPressed,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: AppTheme.glassContainer(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        borderColor: active ? AppTheme.greenPrimary : null,
        child: Column(
          children: [
            Icon(icon, color: active ? AppTheme.greenPrimary : AppTheme.textPrimary),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: active ? AppTheme.greenPrimary : AppTheme.textPrimary,
                fontWeight: active ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
