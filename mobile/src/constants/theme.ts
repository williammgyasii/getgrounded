/**
 * GetGrounded design tokens — stone floor, ink words, blue action.
 * @see docs/FEATURES.md · mobile/src/constants/plan-theme.ts
 */

import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

export const Surface = '#F3EFE8';

export const Colors = {
  light: {
    text: '#1C1915',
    background: Surface,
    backgroundElement: '#E8EEF6',
    backgroundSelected: '#D4E4F4',
    textSecondary: '#6B645C',
    primary: '#2563A8',
    primarySoft: '#D4E4F4',
    primaryOn: '#F8FBFF',
    border: '#D6DEE8',
    inputBackground: '#FAF7F1',
    card: '#FAF7F1',
    accent: '#2563A8',
  },
  dark: {
    text: '#1C1915',
    background: Surface,
    backgroundElement: '#E8EEF6',
    backgroundSelected: '#D4E4F4',
    textSecondary: '#6B645C',
    primary: '#2563A8',
    primarySoft: '#D4E4F4',
    primaryOn: '#F8FBFF',
    border: '#D6DEE8',
    inputBackground: '#FAF7F1',
    card: '#FAF7F1',
    accent: '#2563A8',
  },
} as const;

export const Radius = {
  field: 16,
  button: 16,
  card: 18,
  pill: 20,
} as const;

/** Single UI sans — body through large headlines (native app feel). */
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  /** Large type uses the same family — heavier weight, not a serif. */
  displayRegular: 'Inter_400Regular',
  displayMedium: 'Inter_500Medium',
  displaySemibold: 'Inter_600SemiBold',
  displayBold: 'Inter_700Bold',
} as const;

export type TypographyRole =
  | 'display'
  | 'displayHero'
  | 'headline'
  | 'title'
  | 'titleMedium'
  | 'body'
  | 'bodyMedium'
  | 'bodySmall'
  | 'bodyLarge'
  | 'caption'
  | 'tabLabel'
  | 'overline'
  | 'stat'
  | 'statLarge'
  | 'score'
  | 'micro';

/** Central type scale. Use fontFamily only — never mix with fontWeight on custom fonts. */
export const Typography: Record<TypographyRole, TextStyle> = {
  display: {
    fontFamily: FontFamily.displayBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  displayHero: {
    fontFamily: FontFamily.displayBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  headline: {
    fontFamily: FontFamily.displaySemibold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  titleMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: 18,
    lineHeight: 26,
  },
  caption: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  overline: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  stat: {
    fontFamily: FontFamily.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  statLarge: {
    fontFamily: FontFamily.displayBold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  score: {
    fontFamily: FontFamily.displayBold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  micro: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    lineHeight: 14,
  },
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: FontFamily.regular,
    serif: FontFamily.regular,
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: FontFamily.regular,
    serif: FontFamily.regular,
    rounded: FontFamily.regular,
    mono: 'monospace',
  },
  web: {
    sans: FontFamily.regular,
    serif: FontFamily.regular,
    rounded: FontFamily.regular,
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
