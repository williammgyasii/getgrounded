/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Stone floor — not kit peach, not blank white. */
export const Surface = '#F3EFE8';

export const Colors = {
  light: {
    text: '#1C1915',
    background: Surface,
    backgroundElement: '#E8E2D6',
    backgroundSelected: '#DDD6C8',
    textSecondary: '#6B6458',
    primary: '#1C1915',
    primarySoft: '#DCE6DF',
    primaryOn: '#F7F3EC',
    border: '#D6CFC3',
    inputBackground: '#FAF7F1',
    accent: '#2F4A3C',
  },
  dark: {
    text: '#1C1915',
    background: Surface,
    backgroundElement: '#E8E2D6',
    backgroundSelected: '#DDD6C8',
    textSecondary: '#6B6458',
    primary: '#1C1915',
    primarySoft: '#DCE6DF',
    primaryOn: '#F7F3EC',
    border: '#D6CFC3',
    inputBackground: '#FAF7F1',
    accent: '#2F4A3C',
  },
} as const;

export const Radius = {
  field: 12,
  button: 12,
  card: 12,
  pill: 12,
} as const;

export const FontFamily = {
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
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
