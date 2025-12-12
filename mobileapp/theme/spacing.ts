/**
 * Spacing system for iDare Mobile App
 * Base unit: 4px (following 4px grid system)
 */

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
} as const;

// Semantic spacing names
export const spacingSemantic = {
  none: spacing[0],
  xs: spacing[1], // 4px
  sm: spacing[2], // 8px
  md: spacing[4], // 16px
  lg: spacing[6], // 24px
  xl: spacing[8], // 32px
  "2xl": spacing[12], // 48px
  "3xl": spacing[16], // 64px
  "4xl": spacing[20], // 80px
  "5xl": spacing[24], // 96px
  "6xl": spacing[32], // 128px
} as const;

// Component-specific spacing
export const componentSpacing = {
  // Button padding
  buttonPadding: {
    sm: { paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
    md: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
    lg: { paddingHorizontal: spacing[6], paddingVertical: spacing[4] },
  },

  // Card padding
  cardPadding: {
    sm: spacing[3],
    md: spacing[4],
    lg: spacing[6],
  },

  // Input padding
  inputPadding: {
    sm: { paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
    md: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
    lg: { paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  },

  // Screen padding
  screenPadding: {
    horizontal: spacing[4],
    vertical: spacing[6],
  },

  // Section spacing
  sectionSpacing: {
    sm: spacing[4],
    md: spacing[6],
    lg: spacing[8],
    xl: spacing[12],
  },

  // List item spacing
  listItemSpacing: {
    sm: spacing[2],
    md: spacing[3],
    lg: spacing[4],
  },
} as const;

export type SpacingKey = keyof typeof spacing;
export type SpacingSemanticKey = keyof typeof spacingSemantic;
