import 'package:flutter/material.dart';
import 'package:mappls_gl/mappls_gl.dart';
import '../theme/app_theme.dart';

class FieldMapScreen extends StatefulWidget {
  const FieldMapScreen({super.key});

  @override
  State<FieldMapScreen> createState() => _FieldMapScreenState();
}

class _FieldMapScreenState extends State<FieldMapScreen> {
  bool _showSatellite = false; // Mappls handles satellite via its styles
  MapplsMapController? _mapController;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          MapplsMap(
            initialCameraPosition: const CameraPosition(
              target: LatLng(20.5937, 78.9629), // Default to India
              zoom: 5.0,
            ),
            onMapCreated: (MapplsMapController controller) {
              _mapController = controller;
            },
            onStyleLoadedCallback: () {
              _addZones();
            },
            myLocationEnabled: true,
            myLocationTrackingMode: MyLocationTrackingMode.tracking,
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

  void _addZones() async {
    if (_mapController == null) return;

    // Add a demo zone polygon via imperative controller
    await _mapController?.addFill(
      FillOptions(
        geometry: [
          [
            const LatLng(20.6, 78.9),
            const LatLng(20.62, 78.9),
            const LatLng(20.62, 78.92),
            const LatLng(20.6, 78.92),
            const LatLng(20.6, 78.9),
          ],
        ],
        fillColor: "#22c55e",
        fillOpacity: 0.35,
        fillOutlineColor: "#22c55e",
      ),
    );
  }

  void _toggleSatellite() {
    setState(() {
      _showSatellite = !_showSatellite;
    });

    if (_showSatellite) {
      // MapmyIndia Style: Satellite Hybrid
      // Note: MapmyIndia has specific style names, commonly it's part of the init or dynamic change
      // For this implementation, we assume standard style toggling or pre-configured style strings
      // _mapController?.setStyle(MapplsStyles.SATELLITE); // If available in current version
    } else {
      // _mapController?.setStyle(MapplsStyles.VECTOR);
    }
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
                  'Mappls Field Map',
                  style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  'Powered by MapmyIndia',
                  style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ),
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
            icon: _showSatellite ? Icons.layers : Icons.layers_outlined,
            label: 'Satellite',
            active: _showSatellite,
            onPressed: _toggleSatellite,
          ),
          const SizedBox(height: 12),
          _controlButton(
            icon: Icons.my_location,
            label: 'Find Me',
            active: false,
            onPressed: () {
              // Zoom to location logic can be added here
            },
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
