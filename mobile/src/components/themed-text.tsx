import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Fonts, ThemeColor, Typography, type TypographyRole } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Legacy Expo types map to Typography roles at runtime. */
type LegacyTextType = 'default' | 'small' | 'smallBold' | 'subtitle' | 'title';

export type ThemedTextProps = TextProps & {
  type?: TypographyRole | LegacyTextType | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

const legacyTypeMap: Partial<Record<string, TypographyRole>> = {
  default: 'body',
  small: 'caption',
  smallBold: 'caption',
  subtitle: 'headline',
  title: 'display',
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const resolvedType = legacyTypeMap[type] ?? type;

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        isTypographyRole(resolvedType) ? Typography[resolvedType] : undefined,
        resolvedType === 'link' && styles.link,
        resolvedType === 'linkPrimary' && [styles.linkPrimary, { color: theme.accent }],
        resolvedType === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

function isTypographyRole(type: string): type is TypographyRole {
  return type in Typography;
}

const styles = StyleSheet.create({
  link: {
    ...Typography.body,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    ...Typography.body,
    lineHeight: 30,
    fontSize: 14,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 16,
    ...(Platform.OS === 'android' ? { fontFamily: FontFamily.medium } : {}),
  },
});
