/**
 * Color palette for iDare Mobile App
 * Primary: #5A3A96 (Poised Purple)
 * Secondary: #E2859D (Pure Pink)
 * Background (light): #FFE9D4 (Sober Serenade)
 * Neutral/Grey: #606060 (Grounded Grey)
 */

export const colors = {
  // Primary Colors
  primary: {
    50: "#f3f1f8",
    100: "#e6e0f0",
    200: "#d1c5e3",
    300: "#b8a3d1",
    400: "#9d7bbd",
    500: "#5a3a96", // Main primary 5A3A96
    600: "#4d2f7f",
    700: "#402568",
    800: "#331b51",
    900: "#26113a",
  },

  // Secondary Colors
  secondary: {
    50: "#fceff3",
    100: "#f8dee4",
    200: "#f4cdd5",
    300: "#eeb5c3",
    400: "#e89aaf",
    500: "#e2859d", // Main secondary E2859D
    600: "#cc6f88",
    700: "#b45f77",
    800: "#9c5166",
    900: "#844256",
  },

  // Neutral Colors
  neutral: {
    0: "#ffffff",
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#9e9e9e",
    500: "#757575",
    600: "#606060", // Grounded Grey
    700: "#4b4b4b",
    800: "#2f2f2f",
    900: "#1a1a1a",
    950: "#0a0a0a",
  },

  // Semantic Colors
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },

  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  info: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
} as const;

// Light theme colors
export const lightColors = {
  ...colors,
  // Background: brand tint (#FFF6EF)
  background: "#FFF6EF",
  surface: colors.neutral[0],
  surfaceVariant: colors.neutral[100],
  // Paragraph/body default per brand: Grounded Grey #606060
  text: colors.neutral[600],
  textSecondary: colors.neutral[600],
  textTertiary: colors.neutral[400],
  border: colors.neutral[200],
  borderLight: colors.neutral[100],
  shadow: colors.neutral[900],
  // Brand accent background for selective use (e.g., highlights, banners)
  brandBackground: "#FFE9D4",
} as const;

// Dark theme colors
export const darkColors = {
  ...colors,
  background: colors.neutral[950],
  surface: colors.neutral[900],
  surfaceVariant: colors.neutral[800],
  text: colors.neutral[50],
  textSecondary: colors.neutral[300],
  textTertiary: colors.neutral[500],
  border: colors.neutral[700],
  borderLight: colors.neutral[800],
  shadow: colors.neutral[0],
  // Keep token available in dark mode for occasional accents
  brandBackground: "#FFE9D4",
} as const;

export type ColorKey = keyof typeof colors;
export type LightColorKey = keyof typeof lightColors;
export type DarkColorKey = keyof typeof darkColors;
