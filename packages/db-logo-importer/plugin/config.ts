/**
 * Centralized configuration for the DB Logo Importer Plugin
 */
export const CONFIG = {
  /**
   * Variable keys for binding design tokens
   */
  keys: {
    dbLogo: "998998d67d3ebef6f2692db932bce69431b3d0cc",
    logoAddition: "497497bca9694f6004d1667de59f1a903b3cd3ef",
    componentHeight: "a86f4bd0e008abb3435ff1dcbe25042ae9fef2d6",
  },

  /**
   * Target height for logo components in pixels
   */
  targetHeight: 24,

  /**
   * UI dimensions
   */
  ui: {
    width: 500,
    height: 380,
  },
} as const;
