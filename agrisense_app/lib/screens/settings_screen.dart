import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/cache_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _autoSync = true;
  String? _lastSync;

  @override
  void initState() {
    super.initState();
    _lastSync = CacheService.getLastSyncTime();
  }

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
                _buildSectionHeader('Account & Security'),
                _buildSettingsItem(
                  icon: Icons.person_outline,
                  title: 'Profile Settings',
                  subtitle: 'Update your personal info',
                  onTap: () {},
                ),
                const SizedBox(height: 24),
                _buildSectionHeader('Preferences'),
                _buildToggleItem(
                  icon: Icons.notifications_none,
                  title: 'Push Notifications',
                  value: _notificationsEnabled,
                  onChanged: (val) => setState(() => _notificationsEnabled = val),
                ),
                _buildToggleItem(
                  icon: Icons.sync,
                  title: 'Auto-Sync Data',
                  value: _autoSync,
                  onChanged: (val) => setState(() => _autoSync = val),
                ),
                const SizedBox(height: 24),
                _buildSectionHeader('Sync Status'),
                _buildSyncInfo(),
                const SizedBox(height: 48),
                _buildLogoutButton(),
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
          'Settings',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        Text(
          'App Configuration & Preferences',
          style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 1),
      ),
    );
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return AppTheme.glassContainer(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Icon(icon, color: AppTheme.greenPrimary),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
        trailing: const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
        onTap: onTap,
      ),
    );
  }

  Widget _buildToggleItem({
    required IconData icon,
    required String title,
    required bool value,
    required Function(bool) onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppTheme.glassContainer(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Row(
          children: [
            const SizedBox(width: 4),
            Icon(icon, color: AppTheme.greenPrimary, size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14))),
            Switch(
              value: value,
              onChanged: onChanged,
              activeColor: AppTheme.greenPrimary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSyncInfo() {
    return AppTheme.glassContainer(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Icon(Icons.cloud_done_outlined, color: AppTheme.greenPrimary, size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Last Synced', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text(_lastSync ?? 'Never', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _lastSync = DateTime.now().toString().split('.')[0];
              });
            },
            child: const Text('Sync Now', style: TextStyle(color: AppTheme.greenPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutButton() {
    return Center(
      child: TextButton(
        onPressed: () {},
        child: const Text(
          'LOGOUT',
          style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, letterSpacing: 1),
        ),
      ),
    );
  }
}
