/**
 * Animation Configuration
 * Centralized animation settings and presets for the iDare Mobile App
 */

import { Easing } from "react-native";

export const AnimationPresets = {
  // Screen Transitions
  screenSlideFromRight: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
    type: "slideFromRight" as const,
  },
  screenSlideFromLeft: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
    type: "slideFromLeft" as const,
  },
  screenSlideFromBottom: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
    type: "slideFromBottom" as const,
  },
  screenSlideFromTop: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
    type: "slideFromTop" as const,
  },
  screenFade: {
    duration: 250,
    easing: Easing.out(Easing.cubic),
    type: "fade" as const,
  },
  screenScale: {
    duration: 300,
    easing: Easing.out(Easing.back(1.2)),
    type: "scale" as const,
  },
  screenFlip: {
    duration: 400,
    easing: Easing.out(Easing.cubic),
    type: "flip" as const,
  },

  // Modal Animations
  modalFadeIn: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  modalScaleIn: {
    duration: 300,
    easing: Easing.out(Easing.back(1.1)),
  },
  modalSlideUp: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  modalSlideDown: {
    duration: 250,
    easing: Easing.in(Easing.cubic),
  },

  // Button Animations
  buttonPress: {
    duration: 150,
    easing: Easing.out(Easing.cubic),
  },
  buttonScale: {
    duration: 200,
    easing: Easing.out(Easing.back(1.2)),
  },

  // Tab Animations
  tabIconScale: {
    duration: 250,
    easing: Easing.out(Easing.back(1.1)),
  },
  tabIconFade: {
    duration: 200,
    easing: Easing.out(Easing.cubic),
  },

  // List Item Animations
  listItemSlide: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  listItemFade: {
    duration: 250,
    easing: Easing.out(Easing.cubic),
  },

  // Loading Animations
  spinnerRotate: {
    duration: 1000,
    easing: Easing.linear,
    iterations: -1, // Infinite
  },
  pulse: {
    duration: 1000,
    easing: Easing.inOut(Easing.cubic),
    iterations: -1, // Infinite
  },

  // Success/Error Animations
  successBounce: {
    duration: 400,
    easing: Easing.out(Easing.back(1.5)),
  },
  errorShake: {
    duration: 500,
    easing: Easing.out(Easing.cubic),
  },
} as const;

export const AnimationTimings = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

export const AnimationEasings = {
  linear: Easing.linear,
  easeIn: Easing.in(Easing.cubic),
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  bounce: Easing.out(Easing.back(1.2)),
  elastic: Easing.out(Easing.elastic(1)),
  spring: Easing.out(Easing.cubic),
} as const;

/**
 * Get animation configuration for specific screen types
 */
export function getScreenAnimationConfig(screenType: string) {
  switch (screenType) {
    case "auth":
      return AnimationPresets.screenSlideFromRight;
    case "main":
      return AnimationPresets.screenSlideFromRight;
    case "modal":
      return AnimationPresets.screenScale;
    case "bottomSheet":
      return AnimationPresets.screenSlideFromBottom;
    case "splash":
      return AnimationPresets.screenFade;
    default:
      return AnimationPresets.screenSlideFromRight;
  }
}

/**
 * Get modal animation configuration based on variant
 */
export function getModalAnimationConfig(
  variant: "default" | "centered" | "bottomSheet"
) {
  switch (variant) {
    case "bottomSheet":
      return {
        entrance: AnimationPresets.modalSlideUp,
        exit: AnimationPresets.modalSlideDown,
      };
    case "centered":
      return {
        entrance: AnimationPresets.modalScaleIn,
        exit: AnimationPresets.modalFadeIn,
      };
    default:
      return {
        entrance: AnimationPresets.modalFadeIn,
        exit: AnimationPresets.modalFadeIn,
      };
  }
}
