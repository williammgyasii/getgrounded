/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Cool paper, navy ink, orange action, blue highlight. */
export const Surface = '#EEF2F8';

export const Colors = {
  light: {
    text: '#243056',
    background: Surface,
    backgroundElement: '#DCE4F5',
    backgroundSelected: '#C9D4F0',
    textSecondary: '#6B7394',
    primary: '#FDA758',
    primarySoft: '#E4EBFA',
    primaryOn: '#FFFFFF',
    border: '#C9D3E8',
    inputBackground: '#FFFFFF',
    card: '#FFFFFF',
    accent: '#4C6FFF',
  },
  dark: {
    text: '#243056',
    background: Surface,
    backgroundElement: '#DCE4F5',
    backgroundSelected: '#C9D4F0',
    textSecondary: '#6B7394',
    primary: '#FDA758',
    primarySoft: '#E4EBFA',
    primaryOn: '#FFFFFF',
    border: '#C9D3E8',
    inputBackground: '#FFFFFF',
    card: '#FFFFFF',
    accent: '#4C6FFF',
  },
} as const;

export const Radius = {
  field: 16,
  button: 16,
  card: 18,
  pill: 20,
} as const;

export const FontFamily = {
  regular: 'Poppins_400Regular',
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
