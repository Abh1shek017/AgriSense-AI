import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/recommendation.dart';
import '../services/api_service.dart';

/// Main dashboard screen — mirrors the web frontend layout:
/// Sensor inputs → Action button → Warnings → Crop cards → Chart
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  // ── Input Controllers (pre-filled with demo values) ────────────────
  final _nController = TextEditingController(text: '90');
  final _pController = TextEditingController(text: '42');
  final _kController = TextEditingController(text: '43');
  final _phController = TextEditingController(text: '6.5');
  final _tempController = TextEditingController(text: '25');
  final _humidityController = TextEditingController(text: '80');
  final _moistureController = TextEditingController(text: '60');
  final _rainfallController = TextEditingController(text: '200');

  // ── State ──────────────────────────────────────────────────────────
  bool _isLoading = false;
  RecommendationResponse? _result;
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
  }

  @override
  void dispose() {
    for (final c in [_nController, _pController, _kController, _phController,
        _tempController, _humidityController, _moistureController, _rainfallController]) {
      c.dispose();
    }
    _animController.dispose();
    super.dispose();
  }

  // ── API Call ────────────────────────────────────────────────────────
  Future<void> _getRecommendation() async {
    final fields = {
      'N': _nController.text, 'P': _pController.text, 'K': _kController.text,
      'pH': _phController.text, 'Temperature': _tempController.text,
      'Humidity': _humidityController.text, 'Moisture': _moistureController.text,
    };

    for (final entry in fields.entries) {
      if (entry.value.isEmpty || double.tryParse(entry.value) == null) {
        _showError('Please enter a valid number for ${entry.key}.');
        return;
      }
    }

    setState(() { _isLoading = true; _result = null; });

    try {
      final rainfallText = _rainfallController.text.trim();
      final rainfall = rainfallText.isNotEmpty ? double.tryParse(rainfallText) : null;

      final response = await ApiService.getRecommendation(
        nitrogen: double.parse(_nController.text),
        phosphorus: double.parse(_pController.text),
        potassium: double.parse(_kController.text),
        ph: double.parse(_phController.text),
        temperature: double.parse(_tempController.text),
        humidity: double.parse(_humidityController.text),
        moisture: double.parse(_moistureController.text),
        rainfall: rainfall,
      );

      setState(() => _result = response);
      _animController.forward(from: 0);

      if (!response.isSuccess) {
        _showError(response.errorMessage ?? 'Unknown error from server.');
      }
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(children: [
          const Icon(Icons.error_outline, color: Colors.white, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: const TextStyle(fontSize: 13))),
        ]),
        backgroundColor: AppTheme.redDanger,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isWide = screenWidth > 700;

    return Scaffold(
      body: Stack(
        children: [
          // Multi-layer background matching the CSS
          _buildBackground(),
          // Content
          SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 900),
                child: ListView(
                  padding: EdgeInsets.symmetric(
                    horizontal: isWide ? 24 : 16,
                    vertical: 24,
                  ),
                  children: [
                    _buildHeader(),
                    const SizedBox(height: 32),
                    _buildSensorInputs(isWide),
                    const SizedBox(height: 32),
                    _buildActionButton(),
                    const SizedBox(height: 28),
                    if (_result != null && _result!.hasWarnings)
                      _buildWarnings(),
                    if (_result != null && _result!.isSuccess) ...[
                      _buildResultsHeader(),
                      const SizedBox(height: 16),
                      _buildCropCards(isWide),
                      const SizedBox(height: 24),
                      _buildChart(),
                      const SizedBox(height: 16),
                      _buildMetadata(),
                    ],
                    const SizedBox(height: 48),
                    _buildFooter(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Background (matches CSS radial-gradient + blob layers) ─────────
  Widget _buildBackground() {
    return Container(
      decoration: const BoxDecoration(color: AppTheme.bgDeep),
      child: Stack(
        children: [
          // Radial gradient top-left (CSS: ellipse at 20% 0%)
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(-0.6, -1.0),
                  radius: 1.2,
                  colors: [
                    AppTheme.greenPrimary.withValues(alpha: 0.12),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          // Radial gradient bottom-right (CSS: ellipse at 80% 100%)
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0.7, 1.0),
                  radius: 1.0,
                  colors: [
                    AppTheme.greenDark.withValues(alpha: 0.07),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Header ─────────────────────────────────────────────────────────
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          // Icon — matches CSS .header-icon (56×56, radius 16, gradient)
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: AppTheme.greenGradient,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.greenPrimary.withValues(alpha: 0.35),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(Icons.eco, color: Colors.white, size: 26),
          ),
          const SizedBox(width: 16),
          // Text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textPrimary,
                      letterSpacing: -0.5,
                    ),
                    children: [
                      const TextSpan(text: 'AgriSense '),
                      TextSpan(
                        text: 'AI',
                        style: TextStyle(
                          foreground: Paint()
                            ..shader = AppTheme.greenTextGradient.createShader(
                              const Rect.fromLTWH(0, 0, 32, 26),
                            ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'IoT-Powered Smart Crop Recommendation',
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
          // Live badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.greenPrimary.withValues(alpha: 0.10),
              border: Border.all(color: AppTheme.greenPrimary.withValues(alpha: 0.20)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 7, height: 7,
                  decoration: const BoxDecoration(
                    color: AppTheme.greenPrimary,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                const Text(
                  'Live',
                  style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600,
                    color: AppTheme.greenPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Sensor Inputs ──────────────────────────────────────────────────
  Widget _buildSensorInputs(bool isWide) {
    final inputs = [
      _SensorField('Nitrogen (N)', 'mg/kg', Icons.science, _nController),
      _SensorField('Phosphorus (P)', 'mg/kg', Icons.science_outlined, _pController),
      _SensorField('Potassium (K)', 'mg/kg', Icons.bolt, _kController),
      _SensorField('pH Level', 'pH', Icons.water_drop, _phController),
      _SensorField('Temperature', '°C', Icons.thermostat, _tempController),
      _SensorField('Humidity', '%', Icons.cloud, _humidityController),
      _SensorField('Soil Moisture', '%', Icons.water, _moistureController),
      _SensorField('Rainfall', 'mm', Icons.grain, _rainfallController, optional: true),
    ];

    return AppTheme.glassContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section header — matches CSS .section-header
          Row(
            children: [
              const Icon(Icons.memory, size: 18, color: AppTheme.greenPrimary),
              const SizedBox(width: 10),
              const Text(
                'Sensor Readings',
                style: TextStyle(
                  fontSize: 17, fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0x0DFFFFFF),
                  border: Border.all(color: const Color(0x14FFFFFF)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'ESP32 DATA',
                  style: TextStyle(
                    fontSize: 10, fontWeight: FontWeight.w600,
                    color: AppTheme.textMuted, letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Input grid — matches CSS grid-template-columns
          LayoutBuilder(
            builder: (context, constraints) {
              final availableWidth = constraints.maxWidth;
              // Match CSS: repeat(auto-fill, minmax(200px, 1fr))
              int columns;
              if (availableWidth > 700) {
                columns = 4;
              } else if (availableWidth > 450) {
                columns = 3;
              } else {
                columns = 2;
              }
              final gap = 16.0;
              final itemWidth = (availableWidth - gap * (columns - 1)) / columns;

              return Wrap(
                spacing: gap,
                runSpacing: gap,
                children: inputs.map((field) {
                  return SizedBox(
                    width: itemWidth,
                    child: _buildInputField(field),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildInputField(_SensorField field) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label — matches CSS .input-group label
        Row(
          children: [
            Icon(field.icon, size: 12, color: AppTheme.greenPrimary),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                field.label,
                style: const TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w500,
                  color: AppTheme.textSecondary,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (field.optional) ...[
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: const Color(0x0AFFFFFF),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'OPTIONAL',
                  style: TextStyle(
                    fontSize: 8, fontWeight: FontWeight.w600,
                    color: AppTheme.textMuted, letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 6),
        // Input wrapper — matches CSS .input-wrapper
        Container(
          decoration: BoxDecoration(
            color: AppTheme.glassInputBg,
            border: Border.all(color: AppTheme.glassInputBorder),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: field.controller,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                  decoration: const InputDecoration(
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                    border: InputBorder.none,
                    isDense: true,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Text(
                  field.unit,
                  style: const TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w600,
                    color: AppTheme.textMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Action Button (pill, centered — matches CSS .btn-primary) ──────
  Widget _buildActionButton() {
    return Column(
      children: [
        Center(
          child: Container(
            decoration: BoxDecoration(
              gradient: AppTheme.greenGradient,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.greenPrimary.withValues(alpha: 0.35),
                  blurRadius: 24,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: _isLoading ? null : _getRecommendation,
                borderRadius: BorderRadius.circular(14),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                  child: _isLoading
                      ? Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const SizedBox(
                              width: 20, height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5, color: Colors.white,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text('Analyzing...',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                          ],
                        )
                      : const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.auto_awesome, size: 20, color: Colors.white),
                            SizedBox(width: 10),
                            Text('Get Recommendation',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                          ],
                        ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        const Text(
          'Analyzes soil & climate data using a RandomForest ML model',
          style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ── Warnings ───────────────────────────────────────────────────────
  Widget _buildWarnings() {
    final warnings = _result!.warnings!;
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.redDanger.withValues(alpha: 0.08),
          border: Border.all(color: AppTheme.redDanger.withValues(alpha: 0.25)),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(children: [
              Icon(Icons.warning_amber_rounded, color: AppTheme.redDanger, size: 20),
              SizedBox(width: 10),
              Text('Warnings Detected',
                style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.redDanger, fontSize: 15),
              ),
            ]),
            const SizedBox(height: 12),
            ...warnings.map((w) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('•  ', style: TextStyle(color: AppTheme.redDanger, fontWeight: FontWeight.w700)),
                  Expanded(child: Text(w, style: const TextStyle(fontSize: 13, color: Color(0xFFF5A6A0)))),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  // ── Results Header ─────────────────────────────────────────────────
  Widget _buildResultsHeader() {
    return const Row(children: [
      Icon(Icons.eco, size: 18, color: AppTheme.greenPrimary),
      SizedBox(width: 10),
      Text('Recommended Crops', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
    ]);
  }

  // ── Crop Cards ─────────────────────────────────────────────────────
  Widget _buildCropCards(bool isWide) {
    final crops = _result!.recommendations;

    if (isWide) {
      return Row(
        children: List.generate(crops.length, (i) {
          return Expanded(
            child: Padding(
              padding: EdgeInsets.only(
                left: i == 0 ? 0 : 8, right: i == crops.length - 1 ? 0 : 8,
              ),
              child: _buildSingleCard(crops[i], i),
            ),
          );
        }),
      );
    }

    return Column(
      children: List.generate(crops.length, (i) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _buildSingleCard(crops[i], i),
        );
      }),
    );
  }

  Widget _buildSingleCard(CropRecommendation crop, int index) {
    final isFirst = index == 0;
    final icons = {
      'Rice': Icons.rice_bowl, 'Wheat': Icons.grass, 'Maize': Icons.grass,
      'Cotton': Icons.cloud, 'Coffee': Icons.coffee, 'Tea': Icons.coffee,
      'Banana': Icons.spa, 'Apple': Icons.spa,
      'Tomato': Icons.spa, 'Potato': Icons.spa,
      'Sugarcane': Icons.grass, 'Coconut': Icons.park,
    };
    final iconData = icons[crop.crop] ?? Icons.eco;

    return AnimatedBuilder(
      animation: _animController,
      builder: (context, child) {
        final delay = index * 0.15;
        final progress = ((_animController.value - delay) / (1 - delay)).clamp(0.0, 1.0);
        return Opacity(
          opacity: progress,
          child: Transform.translate(offset: Offset(0, 20 * (1 - progress)), child: child),
        );
      },
      child: AppTheme.glassContainer(
        borderColor: isFirst ? AppTheme.greenPrimary.withValues(alpha: 0.40) : null,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          children: [
            // Rank badge
            Align(
              alignment: Alignment.centerRight,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isFirst ? AppTheme.greenPrimary.withValues(alpha: 0.15) : const Color(0x0FFFFFFF),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '#${index + 1} Pick',
                  style: TextStyle(
                    fontSize: 9, fontWeight: FontWeight.w700,
                    color: isFirst ? AppTheme.greenPrimary : AppTheme.textMuted,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            // Icon
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                gradient: isFirst ? AppTheme.greenGradient : null,
                color: isFirst ? null : AppTheme.greenPrimary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
                boxShadow: isFirst
                    ? [BoxShadow(color: AppTheme.greenPrimary.withValues(alpha: 0.35), blurRadius: 16)]
                    : null,
              ),
              child: Icon(iconData, color: isFirst ? Colors.white : AppTheme.greenPrimary, size: 22),
            ),
            const SizedBox(height: 14),
            // Crop name
            Text(crop.crop, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700), textAlign: TextAlign.center),
            const SizedBox(height: 6),
            // Confidence
            ShaderMask(
              shaderCallback: (bounds) => AppTheme.greenTextGradient.createShader(bounds),
              child: Text(
                crop.confidence,
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
              ),
            ),
            const SizedBox(height: 2),
            const Text('CONFIDENCE', style: TextStyle(fontSize: 10, color: AppTheme.textMuted, letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }

  // ── Chart (custom horizontal bar chart) ────────────────────────────
  Widget _buildChart() {
    final crops = _result!.recommendations;

    return AppTheme.glassContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [
            Icon(Icons.bar_chart, size: 18, color: AppTheme.greenPrimary),
            SizedBox(width: 8),
            Text('Confidence Overview', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          ]),
          const SizedBox(height: 24),
          ...List.generate(crops.length, (i) {
            final crop = crops[i];
            final barFraction = crop.confidenceValue / 100.0;
            final opacities = [0.9, 0.65, 0.4];

            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                children: [
                  SizedBox(
                    width: 72,
                    child: Text(crop.crop,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        return Stack(children: [
                          Container(
                            height: 30,
                            decoration: BoxDecoration(
                              color: const Color(0x0DFFFFFF),
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 600),
                            curve: Curves.easeOutCubic,
                            height: 30,
                            width: constraints.maxWidth * barFraction,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(colors: [
                                AppTheme.greenPrimary.withValues(alpha: opacities[i.clamp(0, 2)]),
                                AppTheme.greenDark.withValues(alpha: opacities[i.clamp(0, 2)] * 0.8),
                              ]),
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: i == 0
                                  ? [BoxShadow(color: AppTheme.greenPrimary.withValues(alpha: 0.25), blurRadius: 10)]
                                  : null,
                            ),
                          ),
                        ]);
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    width: 44,
                    child: Text(crop.confidence,
                      style: TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w700,
                        color: i == 0 ? AppTheme.greenPrimary : AppTheme.textSecondary,
                      ),
                      textAlign: TextAlign.right,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // ── Metadata ───────────────────────────────────────────────────────
  Widget _buildMetadata() {
    final meta = _result!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0x08FFFFFF),
        border: Border.all(color: const Color(0x0DFFFFFF)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Wrap(
        spacing: 20, runSpacing: 8,
        children: [
          if (meta.rainfallValueUsed != null)
            _metaItem(Icons.grain, 'Rainfall: ${meta.rainfallValueUsed!.toStringAsFixed(1)} mm (${meta.rainfallSource ?? "sensor"})'),
          _metaItem(Icons.smart_toy, 'Model: RandomForest (scikit-learn)'),
          _metaItem(Icons.access_time, TimeOfDay.now().format(context)),
        ],
      ),
    );
  }

  Widget _metaItem(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppTheme.greenPrimary),
        const SizedBox(width: 5),
        Flexible(child: Text(text, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted))),
      ],
    );
  }

  // ── Footer ─────────────────────────────────────────────────────────
  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.only(top: 24),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0x0DFFFFFF))),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.memory, size: 13, color: AppTheme.textMuted),
          SizedBox(width: 6),
          Text('AgriSense AI — IoT Crop Advisory System © 2026',
            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }
}

// ── Helper class ──────────────────────────────────────────────────────
class _SensorField {
  final String label;
  final String unit;
  final IconData icon;
  final TextEditingController controller;
  final bool optional;
  _SensorField(this.label, this.unit, this.icon, this.controller, {this.optional = false});
}
