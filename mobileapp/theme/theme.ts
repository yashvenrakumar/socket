/**
 * Complete theme system for iDare Mobile App
 * Combines all design tokens into a cohesive theme
 */

import { colors, darkColors, lightColors } from "./colors";
import { dimensions } from "./dimensions";
import { darkModeShadows, shadows, shadowSemantic } from "./shadows";
import { componentSpacing, spacing, spacingSemantic } from "./spacing";
import {
  fontFamily,
  fontSize,
  letterSpacing,
  lineHeight,
  typography,
} from "./typography";

// Base theme structure
export const baseTheme = {
  colors,
  typography,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  spacing,
  spacingSemantic,
  componentSpacing,
  dimensions,
  shadows,
  shadowSemantic,
} as const;

// Light theme
export const lightTheme = {
  ...baseTheme,
  colors: lightColors,
  isDark: false,
} as const;

// Dark theme
export const darkTheme = {
  ...baseTheme,
  colors: darkColors,
  shadows: darkModeShadows,
  isDark: true,
} as const;

// Theme type definitions
export type Theme = typeof lightTheme | typeof darkTheme;
export type ColorMode = "light" | "dark" | "system";
export type ThemeColors = typeof lightColors | typeof darkColors;

// Theme configuration
export const themeConfig = {
  // Default color mode
  defaultColorMode: "system" as ColorMode,

  // Color mode storage key (for persistence)
  colorModeStorageKey: "idare-color-mode",

  // System color mode detection
  useSystemColorMode: true,

  // Theme transition duration (in milliseconds)
  transitionDuration: 200,

  // Breakpoint configuration
  breakpoints: dimensions.breakpoints,

  // Component variants
  componentVariants: {
    button: ["primary", "secondary", "outline", "ghost", "link"],
    input: ["default", "filled", "outlined"],
    card: ["default", "elevated", "outlined"],
    typography: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "body",
      "caption",
      "label",
    ],
  },
} as const;

// Theme utilities
export const getTheme = (colorMode: ColorMode): Theme => {
  return colorMode === "dark" ? darkTheme : lightTheme;
};

export const getColorValue = (theme: Theme, colorPath: string): string => {
  const keys = colorPath.split(".");
  let value: any = theme.colors;

  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) break;
  }

  return value || theme.colors.neutral[500];
};

export const getSpacingValue = (
  theme: Theme,
  spacingKey: keyof typeof spacing
): number => {
  return theme.spacing[spacingKey];
};

export const getTypographyStyle = (
  theme: Theme,
  typographyKey: keyof typeof typography
) => {
  return theme.typography[typographyKey];
};

// Export all design tokens
export * from "./colors";
export * from "./dimensions";
export * from "./shadows";
export * from "./spacing";
export * from "./typography";
