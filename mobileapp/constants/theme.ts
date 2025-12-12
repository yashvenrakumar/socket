/**
 * Complete theme system for Mobile App
 * Re-exports comprehensive theme from @/theme with backward compatibility
 */

import { Platform } from 'react-native';

// Re-export everything from individual theme files using @ alias
// Metro bundler resolves alias paths configured in babel.config.js
export * from '@/theme/colors';
export * from '@/theme/spacing';
export * from '@/theme/typography';
export * from '@/theme/dimensions';
export * from '@/theme/shadows';
export * from '@/theme/animations';
export {
  baseTheme,
  lightTheme,
  darkTheme,
  themeConfig,
  getTheme,
  getColorValue,
  getSpacingValue,
  getTypographyStyle,
  type Theme,
  type ColorMode,
  type ThemeColors,
} from '@/theme/theme';

// Import specific values needed for backward compatibility
// Using namespace import with @ alias
import * as colorsModule from '@/theme/colors';
const lightColors = colorsModule.lightColors;
const darkColors = colorsModule.darkColors;
const colors = colorsModule.colors;

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

/**
 * Legacy Colors export for backward compatibility
 * Maps to the old constants/theme.ts format
 */
export const Colors = {
  light: {
    text: lightColors.text,
    background: lightColors.background,
    tint: tintColorLight,
    icon: lightColors.neutral[600],
    tabIconDefault: lightColors.neutral[600],
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: darkColors.text,
    background: darkColors.background,
    tint: tintColorDark,
    icon: darkColors.neutral[400],
    tabIconDefault: darkColors.neutral[400],
    tabIconSelected: tintColorDark,
  },
};

/**
 * Legacy Fonts export for backward compatibility
 * Maps to the old constants/theme.ts format
 */
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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
