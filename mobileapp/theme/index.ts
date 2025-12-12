/**
 * Theme index file - Central export point for all theme tokens
 * Re-exports everything from individual theme files
 */

// Import and re-export from individual files
import * as colorsModule from './colors';
import * as spacingModule from './spacing';
import * as typographyModule from './typography';
import * as dimensionsModule from './dimensions';
import * as shadowsModule from './shadows';
import * as animationsModule from './animations';
import * as themeModule from './theme';

// Re-export everything
export * from './colors';
export * from './spacing';
export * from './typography';
export * from './dimensions';
export * from './shadows';
export * from './animations';

// Re-export theme utilities and types
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
} from './theme';
