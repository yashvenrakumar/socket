/**
 * Shadow and elevation system for iDare Mobile App
 */

import { Platform } from "react-native";

// iOS shadow styles
const iosShadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  "2xl": {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  "3xl": {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
  },
  // Ant Design style card elevation - more prominent and visible
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
} as const;

// Android elevation styles
const androidElevations = {
  none: { elevation: 0 },
  xs: { elevation: 1 },
  sm: { elevation: 2 },
  md: { elevation: 4 },
  lg: { elevation: 8 },
  xl: { elevation: 12 },
  "2xl": { elevation: 16 },
  "3xl": { elevation: 24 },
  // Ant Design style card elevation
  card: { elevation: 8 },
} as const;

// Cross-platform shadow system
export const shadows = Platform.OS === "ios" ? iosShadows : androidElevations;

// Semantic shadow names for common use cases
export const shadowSemantic = {
  // Cards and surfaces
  card: shadows.card,
  cardHover: shadows.lg,
  cardActive: shadows.xl,

  // Buttons
  button: shadows.xs,
  buttonPressed: shadows.none,
  buttonFloating: shadows.lg,

  // Modals and overlays
  modal: shadows["2xl"],
  overlay: shadows.lg,
  dropdown: shadows.md,

  // Navigation
  header: shadows.sm,
  tabBar: shadows.md,
  drawer: shadows.xl,

  // Inputs
  input: shadows.xs,
  inputFocused: shadows.sm,

  // Special effects
  glow: {
    ...shadows.lg,
    shadowColor: "#5a3a96", // Primary color for glow effect
    shadowOpacity: 0.3,
  },
  glowSecondary: {
    ...shadows.lg,
    shadowColor: "#c8779b", // Secondary color for glow effect
    shadowOpacity: 0.3,
  },
} as const;

// Dark mode shadow adjustments
export const darkModeShadows = {
  ...shadows,
  // Darker shadows for dark mode
  sm: {
    ...shadows.sm,
    shadowOpacity: 0.2,
  },
  md: {
    ...shadows.md,
    shadowOpacity: 0.2,
  },
  lg: {
    ...shadows.lg,
    shadowOpacity: 0.2,
  },
  xl: {
    ...shadows.xl,
    shadowOpacity: 0.25,
  },
  "2xl": {
    ...shadows["2xl"],
    shadowOpacity: 0.3,
  },
  "3xl": {
    ...shadows["3xl"],
    shadowOpacity: 0.35,
  },
  card: {
    ...shadows.card,
    shadowOpacity: 0.3,
  },
} as const;

export type ShadowKey = keyof typeof shadows;
export type ShadowSemanticKey = keyof typeof shadowSemantic;
