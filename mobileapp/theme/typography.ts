/**
 * Typography system for iDare Mobile App
 * Headers: BebasNeue | Body Text: Geist
 */

import { Platform } from "react-native";

export const fontFamily = {
  // BebasNeue for headers
  bebasNeue: Platform.select({
    ios: "BebasNeue-Regular",
    android: "BebasNeue-Regular",
    default: "BebasNeue-Regular",
  }),
  // Geist for body text and other elements
  thin: Platform.select({
    ios: "Geist-Thin",
    android: "Geist-Thin",
    default: "Geist-Thin",
  }),
  extraLight: Platform.select({
    ios: "Geist-ExtraLight",
    android: "Geist-ExtraLight",
    default: "Geist-ExtraLight",
  }),
  light: Platform.select({
    ios: "Geist-Light",
    android: "Geist-Light",
    default: "Geist-Light",
  }),
  regular: Platform.select({
    ios: "Geist-Regular",
    android: "Geist-Regular",
    default: "Geist-Regular",
  }),
  medium: Platform.select({
    ios: "Geist-Medium",
    android: "Geist-Medium",
    default: "Geist-Medium",
  }),
  semiBold: Platform.select({
    ios: "Geist-SemiBold",
    android: "Geist-SemiBold",
    default: "Geist-SemiBold",
  }),
  bold: Platform.select({
    ios: "Geist-Bold",
    android: "Geist-Bold",
    default: "Geist-Bold",
  }),
  extraBold: Platform.select({
    ios: "Geist-ExtraBold",
    android: "Geist-ExtraBold",
    default: "Geist-ExtraBold",
  }),
  black: Platform.select({
    ios: "Geist-Black",
    android: "Geist-Black",
    default: "Geist-Black",
  }),
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 14,
  lg: 16,
  xl: 18,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
  "8xl": 96,
  "9xl": 128,
} as const;

export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

export const letterSpacing = {
  tighter: -0.05,
  tight: -0.025,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
} as const;

// Typography styles
export const typography = {
  // Headings - using Geist Bold/SemiBold for headers (BebasNeue used in display styles)
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["4xl"],
    lineHeight: fontSize["4xl"] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["3xl"],
    lineHeight: fontSize["3xl"] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize["2xl"],
    lineHeight: fontSize["2xl"] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  h4: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Body text
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Labels and captions
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Special text
  button: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.none,
    letterSpacing: letterSpacing.wide,
  },
  overline: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.widest,
    textTransform: "uppercase" as const,
  },

  // Display text - using BebasNeue for maximum impact
  displayLarge: {
    fontFamily: fontFamily.bebasNeue,
    fontSize: fontSize["6xl"],
    lineHeight: fontSize["6xl"] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  displayMedium: {
    fontFamily: fontFamily.bebasNeue,
    fontSize: fontSize["5xl"],
    lineHeight: fontSize["5xl"] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displaySmall: {
    fontFamily: fontFamily.bebasNeue,
    fontSize: fontSize["4xl"],
    lineHeight: fontSize["4xl"] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
} as const;

export type FontFamilyKey = keyof typeof fontFamily;
export type FontSizeKey = keyof typeof fontSize;
export type TypographyKey = keyof typeof typography;
