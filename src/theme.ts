// Wind & Co. — Clean, Warm Light Design System
export const Colors = {
  // Primary
  primary: '#1A1A2E',
  primarySoft: '#2D2D44',

  // Background — warm whites and creams
  background: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceWarm: '#F5F3EF',
  surfaceBlue: '#EBF3FA',
  surfaceMint: '#E8F5F0',

  // Accent
  accent: '#3B82F6',
  accentSoft: '#DBEAFE',
  coral: '#FF6B6B',
  coralSoft: '#FFE8E8',
  mint: '#10B981',
  mintSoft: '#D1FAE5',
  purple: '#8B5CF6',
  purpleSoft: '#EDE9FE',
  amber: '#F59E0B',
  amberSoft: '#FEF3C7',

  // Status
  clean: '#10B981',
  dirty: '#F59E0B',
  laundry: '#EF4444',

  // Text
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textLight: '#D1D5DB',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Shadows
  shadowColor: 'rgba(0,0,0,0.06)',

  // Weather card
  weatherBg: '#E8EFF7',
  weatherText: '#374151',
};

export const Typography = {
  largeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1A1A2E',
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#374151',
    lineHeight: 22,
  },
  subhead: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#9CA3AF',
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
};
