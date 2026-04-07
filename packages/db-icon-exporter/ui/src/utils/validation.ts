// utils/validation.ts

/**
 * Validates a semantic version string
 * Accepts formats: 1.2.3, v1.2.3, 1.2.3-beta, 1.2.3-rc.1
 */
export function validateVersion(version: string): {
  isValid: boolean;
  error?: string;
} {
  if (!version || version.trim().length === 0) {
    return { isValid: true }; // Empty is valid (optional)
  }

  const trimmed = version.trim();

  // Remove leading 'v' if present
  const versionWithoutV = trimmed.startsWith("v")
    ? trimmed.substring(1)
    : trimmed;

  // Semantic version regex: major.minor.patch with optional pre-release
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  if (!semverRegex.test(versionWithoutV)) {
    return {
      isValid: false,
      error:
        "Ungültiges Versionsformat. Erwartet: 1.2.3 oder 1.2.3-beta oder v1.2.3",
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes version string by removing leading 'v' and trimming
 */
export function sanitizeVersion(version: string): string {
  const trimmed = version.trim();
  return trimmed.startsWith("v") ? trimmed.substring(1) : trimmed;
}

/**
 * Validates search term to prevent potential issues
 */
export function validateSearchTerm(searchTerm: string): {
  isValid: boolean;
  sanitized: string;
} {
  // Remove potentially problematic characters but keep spaces, hyphens, underscores
  const sanitized = searchTerm.replace(/[<>{}[\]\\]/g, "").trim();

  return {
    isValid: sanitized.length <= 100, // Reasonable max length
    sanitized,
  };
}
