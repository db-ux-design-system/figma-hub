/**
 * Centralized configuration for the DB Logo Importer Plugin
 */
export const CONFIG = {
  /**
   * Published variable keys for binding design tokens.
   *
   * Documented by name and collection because a bare key cannot be traced back
   * to its variable, and it only resolves while the owning library is published
   * and enabled for the file.
   */
  keys: {
    dbLogo: "998998d67d3ebef6f2692db932bce69431b3d0cc",
    /** DB UX - Core Foundation › Mode › db-theme/logo-addition */
    logoAddition: "a0a293a7c869777cd36cbcb80e8890f9cc9c3723",
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
    height: 560,
  },
} as const;
