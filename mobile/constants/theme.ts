// ============================================================================
// SmartStudy AI Mobile — Design System & Theme
// Shared color palette, spacing, typography, and component styles
// ============================================================================

import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const COLORS = {
  // Primary palette
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#4834D4',
  primaryGlow: 'rgba(108, 92, 231, 0.25)',

  // Accent palette
  secondary: '#00CEC9',
  secondaryLight: '#55EFC4',
  accent: '#FD79A8',
  accentLight: '#FAB1D0',

  // Semantic
  success: '#00B894',
  successLight: '#55EFC4',
  warning: '#FDCB6E',
  warningLight: '#FFEAA7',
  danger: '#E17055',
  dangerLight: '#FAB1A0',

  // Dark theme surfaces
  background: '#0A0A1A',
  card: '#1A1A2E',
  cardElevated: '#1E1E38',
  surface: '#16213E',
  surfaceLight: '#1F2F50',
  border: '#2A2A4A',
  borderLight: '#3A3A5A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0D0',
  textMuted: '#6B6B8D',
  textInverse: '#0A0A1A',

  // Gradients (used as array pairs)
  gradientPrimary: ['#6C5CE7', '#A29BFE'] as [string, string],
  gradientAccent: ['#FD79A8', '#A29BFE'] as [string, string],
  gradientSuccess: ['#00B894', '#00CEC9'] as [string, string],
  gradientDark: ['#0A0A1A', '#16213E'] as [string, string],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  hero: 36,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
};

// Shared component styles
export const sharedStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },

  // Cards
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardElevated: {
    backgroundColor: COLORS.cardElevated,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.glow,
  },

  // Typography
  heroTitle: {
    fontSize: FONT_SIZE.hero,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  caption: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600' as const,
    color: COLORS.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...SHADOWS.glow,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },

  // Inputs
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },

  // Rows / flex helpers
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  rowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Badges / chips
  badge: {
    backgroundColor: COLORS.primaryGlow,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
});

export { SCREEN_WIDTH };
