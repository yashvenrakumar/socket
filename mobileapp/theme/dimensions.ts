/**
 * Dimensions and breakpoints for iDare Mobile App
 */

import { Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const dimensions = {
  screen: {
    width: screenWidth,
    height: screenHeight,
  },

  // Breakpoints (based on common device sizes)
  breakpoints: {
    xs: 0, // Extra small devices (phones in portrait)
    sm: 576, // Small devices (phones in landscape)
    md: 768, // Medium devices (tablets in portrait)
    lg: 992, // Large devices (tablets in landscape)
    xl: 1200, // Extra large devices (desktop)
  },

  // Common component dimensions
  component: {
    // Button heights
    buttonHeight: {
      sm: 32,
      md: 40,
      lg: 48,
      xl: 56,
    },

    // Input heights
    inputHeight: {
      sm: 32,
      md: 40,
      lg: 48,
      xl: 56,
    },

    // Card dimensions
    cardMinHeight: 80,
    cardMaxWidth: screenWidth - 32, // Screen width minus padding

    // Avatar sizes
    avatar: {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
      "2xl": 80,
      "3xl": 96,
    },

    // Icon sizes
    icon: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
      "2xl": 40,
      "3xl": 48,
    },

    // Border radius
    borderRadius: {
      none: 0,
      xs: 2,
      sm: 4,
      md: 6,
      lg: 8,
      xl: 12,
      "2xl": 16,
      "3xl": 24,
      full: 9999,
    },
  },

  // Layout dimensions
  layout: {
    headerHeight: 56,
    tabBarHeight: 60,
    bottomSheetHeight: screenHeight * 0.5,
    modalMaxHeight: screenHeight * 0.9,
    drawerWidth: screenWidth * 0.8,
  },

  // Safe area insets (will be updated by react-native-safe-area-context)
  safeArea: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
} as const;

// Helper functions
export const isSmallScreen = () => screenWidth < dimensions.breakpoints.sm;
export const isMediumScreen = () =>
  screenWidth >= dimensions.breakpoints.sm &&
  screenWidth < dimensions.breakpoints.lg;
export const isLargeScreen = () => screenWidth >= dimensions.breakpoints.lg;

export const getResponsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}): T | undefined => {
  if (screenWidth >= dimensions.breakpoints.xl && values.xl) return values.xl;
  if (screenWidth >= dimensions.breakpoints.lg && values.lg) return values.lg;
  if (screenWidth >= dimensions.breakpoints.md && values.md) return values.md;
  if (screenWidth >= dimensions.breakpoints.sm && values.sm) return values.sm;
  return values.xs;
};

export type BreakpointKey = keyof typeof dimensions.breakpoints;
export type ComponentDimensionKey = keyof typeof dimensions.component;
