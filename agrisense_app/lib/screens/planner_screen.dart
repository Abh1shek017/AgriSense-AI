import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class PlannerScreen extends StatelessWidget {
  const PlannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          _buildBackground(),
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildHeader(),
                const SizedBox(height: 32),
                const Text(
                  'Crop Rotation Planner',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildRotationCards(),
                const SizedBox(height: 32),
                const Text(
                  'Today\'s Irrigation Budget',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildIrrigationSummary(),
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
    );
  }

  Widget _buildHeader() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Agri Planner',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        Text(
          'Seasonal Crop & Water Management',
          style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
        ),
      ],
    );
  }

  Widget _buildRotationCards() {
    final rotations = [
      {'current': 'Rice', 'next': 'Wheat', 'season': 'Winter 2024', 'icon': Icons.rice_bowl},
      {'current': 'Wheat', 'next': 'Moong', 'season': 'Summer 2025', 'icon': Icons.grass},
      {'current': 'Moong', 'next': 'Rice', 'season': 'Monsoon 2025', 'icon': Icons.spa},
    ];

    return SizedBox(
      height: 180,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: rotations.length,
        itemBuilder: (context, index) {
          final r = rotations[index];
          return Padding(
            padding: const EdgeInsets.only(right: 16),
            child: SizedBox(
              width: 160,
              child: AppTheme.glassContainer(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.greenPrimary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(r['icon'] as IconData, color: AppTheme.greenPrimary, size: 20),
                    ),
                    const Spacer(),
                    Text(r['season'] as String, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                    const SizedBox(height: 4),
                    Text('${r['current']} → ${r['next']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 8),
                    const Text('View Analysis', style: TextStyle(fontSize: 10, color: AppTheme.greenPrimary, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildIrrigationSummary() {
    final zones = [
      {'zone': 'Zone A (North)', 'budget': '4.5 mm', 'status': 'Optimal'},
      {'zone': 'Zone B (South)', 'budget': '6.2 mm', 'status': 'Requires Water'},
      {'zone': 'Zone C (Edge)', 'budget': '2.0 mm', 'status': 'Optimal'},
    ];

    return Column(
      children: zones.map((z) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: AppTheme.glassContainer(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: Colors.blueAccent.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.water_drop, color: Colors.blueAccent, size: 18),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(z['zone']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text('Budget: ${z['budget']}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: z['status'] == 'Optimal' 
                    ? AppTheme.greenPrimary.withValues(alpha: 0.1) 
                    : Colors.orange.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  z['status']!,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: z['status'] == 'Optimal' ? AppTheme.greenPrimary : Colors.orange,
                  ),
                ),
              ),
            ],
          ),
        ),
      )).toList(),
    );
  }
}
