import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { typography, fontSize, colors } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: fontSize.base,
    fontFamily: typography.body.fontFamily,
    lineHeight: fontSize.base * typography.body.lineHeight,
  },
  defaultSemiBold: {
    fontSize: fontSize.base,
    fontFamily: typography.body.fontFamily,
    lineHeight: fontSize.base * typography.body.lineHeight,
    fontWeight: '600',
  },
  title: {
    fontSize: fontSize['8xl'],
    fontFamily: typography.displayLarge.fontFamily,
    fontWeight: 'bold',
    lineHeight: fontSize['8xl'] * typography.displayLarge.lineHeight,
  },
  subtitle: {
    fontSize: fontSize['5xl'],
    fontFamily: typography.h3.fontFamily,
    fontWeight: 'bold',
    lineHeight: fontSize['5xl'] * typography.h3.lineHeight,
  },
  link: {
    lineHeight: fontSize.base * typography.body.lineHeight,
    fontSize: fontSize.base,
    fontFamily: typography.body.fontFamily,
    color: colors.info[600],
  },
});
