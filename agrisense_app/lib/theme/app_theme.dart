import 'package:flutter/material.dart';
import 'dart:ui';

/// Centralized design system for the AgriSense AI app.
/// Tuned for Flutter's rendering engine to visually match the web frontend.
/// Note: Flutter handles alpha blending and backdrop blur differently than
/// CSS, so some values are intentionally adjusted from the CSS equivalents
/// to achieve the same visual output.
class AppTheme {
  AppTheme._();

  // ── Core palette ─────────────────────────────────────────────────────
  static const Color greenPrimary = Color(0xFF2ECC71);
  static const Color greenDark = Color(0xFF27AE60);
  static const Color greenLight = Color(0xFFA8F0C6);
  // Flutter's glow needs higher opacity than CSS to look equivalent
  static const Color greenGlow = Color(0x662ECC71);

  static const Color redDanger = Color(0xFFE74C3C);
  static const Color redLight = Color(0xFFFDE8E6);

  // ── Neutrals ─────────────────────────────────────────────────────────
  // Slightly adjusted for Flutter's gamma-correct blending
  static const Color bgDeep = Color(0xFF081208);
  static const Color bgSurface = Color(0xFF0D1F13);
  static const Color textPrimary = Color(0xFFF0F7F2);
  static const Color textSecondary = Color(0xFF94B8A0);
  static const Color textMuted = Color(0xFF4E7A5E);

  // ── Glass ────────────────────────────────────────────────────────────
  // Flutter's BackdropFilter composites differently — needs higher opacity
  static const Color glassBg = Color(0x14FFFFFF);       // ~8% white
  static const Color glassBorder = Color(0x20FFFFFF);    // ~12% white
  static const Color glassInputBg = Color(0x0DFFFFFF);   // ~5% white
  static const Color glassInputBorder = Color(0x18FFFFFF); // ~9% white

  // ── Gradient ─────────────────────────────────────────────────────────
  static const LinearGradient greenGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [greenPrimary, greenDark],
  );

  static const LinearGradient greenTextGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [greenPrimary, Color(0xFF6EDC9F)],
  );

  // ── Glassmorphism Card Decoration ────────────────────────────────────
  static BoxDecoration glassCard({
    Color? borderColor,
    double borderWidth = 1.0,
  }) {
    return BoxDecoration(
      color: glassBg,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(
        color: borderColor ?? glassBorder,
        width: borderWidth,
      ),
      boxShadow: const [
        BoxShadow(
          color: Color(0x55000000),
          blurRadius: 40,
          offset: Offset(0, 10),
        ),
      ],
    );
  }

  /// A blurred glass container widget.
  static Widget glassContainer({
    required Widget child,
    EdgeInsetsGeometry padding = const EdgeInsets.all(28),
    Color? borderColor,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          padding: padding,
          decoration: glassCard(borderColor: borderColor),
          child: child,
        ),
      ),
    );
  }
}
