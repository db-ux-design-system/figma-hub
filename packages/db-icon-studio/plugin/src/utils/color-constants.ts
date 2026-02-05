/**
 * Color Detection Constants
 *
 * Shared color detection thresholds used across validators and processors
 * for consistent color identification in illustrative icons.
 */

/**
 * Color detection thresholds for illustrative icons
 */
export const COLOR_THRESHOLDS = {
  /**
   * Black/Dark Gray Detection
   * Used to identify black fills in illustrative icons
   */
  BLACK: {
    /** Maximum RGB value for strict black detection (0.1 = ~26/255) */
    STRICT_MAX: 0.1,
    /** Maximum RGB value for dark gray detection (0.2 = ~51/255) */
    DARK_GRAY_MAX: 0.2,
  },

  /**
   * Red Detection
   * Used to identify red (pulse) fills in illustrative icons
   */
  RED: {
    /** Minimum red channel value (0.5 = ~128/255) */
    MIN_RED: 0.5,
    /** Maximum green channel value (0.3 = ~77/255) */
    MAX_GREEN: 0.3,
    /** Maximum blue channel value (0.3 = ~77/255) */
    MAX_BLUE: 0.3,
    /** Alternative minimum red for strict detection (0.7 = ~179/255) */
    STRICT_MIN_RED: 0.7,
  },
} as const;

/**
 * Color variable keys for DB Design System
 */
export const COLOR_VARIABLE_KEYS = {
  /** Base color (black) variable key */
  BASE: "497497bca9694f6004d1667de59f1a903b3cd3ef",
  /** Pulse color (red) variable key */
  PULSE: "998998d67d3ebef6f2692db932bce69431b3d0cc",
} as const;

/**
 * Helper functions for color detection
 */

/**
 * Check if a color is black using strict threshold (r, g, b < 0.1)
 * Used in IllustrativeProcessor for color variable binding
 */
export function isBlack(color: RGB): boolean {
  return (
    color.r < COLOR_THRESHOLDS.BLACK.STRICT_MAX &&
    color.g < COLOR_THRESHOLDS.BLACK.STRICT_MAX &&
    color.b < COLOR_THRESHOLDS.BLACK.STRICT_MAX
  );
}

/**
 * Check if a color is black or dark gray (r, g, b < 0.2)
 * Used in validators for more lenient black detection
 */
export function isBlackOrDarkGray(color: RGB): boolean {
  return (
    color.r < COLOR_THRESHOLDS.BLACK.DARK_GRAY_MAX &&
    color.g < COLOR_THRESHOLDS.BLACK.DARK_GRAY_MAX &&
    color.b < COLOR_THRESHOLDS.BLACK.DARK_GRAY_MAX
  );
}

/**
 * Check if a color is red (r > 0.5, g < 0.3, b < 0.3)
 * Used in IllustrativeProcessor for color variable binding
 */
export function isRed(color: RGB): boolean {
  return (
    color.r > COLOR_THRESHOLDS.RED.MIN_RED &&
    color.g < COLOR_THRESHOLDS.RED.MAX_GREEN &&
    color.b < COLOR_THRESHOLDS.RED.MAX_BLUE
  );
}

/**
 * Check if a color is red using strict threshold (r > 0.7, g < 0.3, b < 0.3)
 * Used in validators for more strict red detection
 */
export function isRedStrict(color: RGB): boolean {
  return (
    color.r > COLOR_THRESHOLDS.RED.STRICT_MIN_RED &&
    color.g < COLOR_THRESHOLDS.RED.MAX_GREEN &&
    color.b < COLOR_THRESHOLDS.RED.MAX_BLUE
  );
}
