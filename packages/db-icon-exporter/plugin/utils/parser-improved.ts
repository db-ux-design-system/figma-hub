// utils/parser-improved.ts

import {
  ParsedDescription,
  ParsedDescriptionFunctional,
  ParsedDescriptionIllustrative,
} from "../types";

/**
 * Improved description parser with better error handling and flexibility
 * Supports case-insensitive parsing and various formatting styles
 */
export function parseDescription(
  description: string,
  iconType: string,
): ParsedDescription {
  if (!description || !description.trim()) {
    return createEmptyParsedDescription(iconType);
  }

  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (iconType === "functional") {
    return parseFunctionalDescription(lines);
  } else {
    return parseIllustrativeDescription(lines);
  }
}

/**
 * Creates an empty parsed description based on icon type
 */
function createEmptyParsedDescription(iconType: string): ParsedDescription {
  if (iconType === "functional") {
    return {
      enDefault: "",
      enContextual: "",
      deDefault: "",
      deContextual: "",
      keywords: "",
    };
  } else {
    return {
      en: "",
      de: "",
      keywords: "",
    };
  }
}

/**
 * Parses functional icon descriptions with EN/DE and default/contextual fields
 */
function parseFunctionalDescription(
  lines: string[],
): ParsedDescriptionFunctional {
  const parsed: ParsedDescriptionFunctional = {
    enDefault: "",
    enContextual: "",
    deDefault: "",
    deContextual: "",
    keywords: "",
  };

  let currentLanguage: "EN" | "DE" | null = null;

  for (const line of lines) {
    // Skip comment lines
    if (line.startsWith("#") && !line.toLowerCase().startsWith("#keywords")) {
      continue;
    }

    const lowerLine = line.toLowerCase();

    // Detect language section headers (flexible matching)
    if (/^en:?\s*$/i.test(line)) {
      currentLanguage = "EN";
      continue;
    }
    if (/^de:?\s*$/i.test(line)) {
      currentLanguage = "DE";
      continue;
    }

    // Parse keywords (supports both "keywords:" and "#keywords" formats)
    if (
      lowerLine.startsWith("keywords:") ||
      lowerLine.startsWith("#keywords")
    ) {
      const content = extractContent(line, ["keywords:", "#keywords", "#"]);
      parsed.keywords = content;
      continue;
    }

    // Parse language-specific fields
    if (currentLanguage === "EN") {
      if (lowerLine.startsWith("default:") || lowerLine.startsWith("default")) {
        parsed.enDefault = extractContent(line, ["default:"]);
      } else if (
        lowerLine.startsWith("contextual:") ||
        lowerLine.startsWith("contextual")
      ) {
        parsed.enContextual = extractContent(line, ["contextual:"]);
      }
    } else if (currentLanguage === "DE") {
      if (lowerLine.startsWith("default:") || lowerLine.startsWith("default")) {
        parsed.deDefault = extractContent(line, ["default:"]);
      } else if (
        lowerLine.startsWith("contextual:") ||
        lowerLine.startsWith("contextual")
      ) {
        parsed.deContextual = extractContent(line, ["contextual:"]);
      }
    }
  }

  return parsed;
}

/**
 * Parses illustrative icon descriptions with simple EN/DE fields
 */
function parseIllustrativeDescription(
  lines: string[],
): ParsedDescriptionIllustrative {
  const parsed: ParsedDescriptionIllustrative = {
    en: "",
    de: "",
    keywords: "",
  };

  for (const line of lines) {
    // Skip comment lines
    if (line.startsWith("#") && !line.toLowerCase().startsWith("#keywords")) {
      continue;
    }

    const lowerLine = line.toLowerCase();

    // Parse EN field (flexible matching)
    if (lowerLine.startsWith("en:")) {
      parsed.en = extractContent(line, ["en:"]);
      continue;
    }

    // Parse DE field (flexible matching)
    if (lowerLine.startsWith("de:")) {
      parsed.de = extractContent(line, ["de:"]);
      continue;
    }

    // Parse keywords
    if (
      lowerLine.startsWith("keywords:") ||
      lowerLine.startsWith("#keywords")
    ) {
      parsed.keywords = extractContent(line, ["keywords:", "#keywords", "#"]);
      continue;
    }
  }

  return parsed;
}

/**
 * Extracts content after a prefix, trying multiple prefixes in order
 * Returns trimmed content or empty string if no match
 */
function extractContent(line: string, prefixes: string[]): string {
  for (const prefix of prefixes) {
    const lowerLine = line.toLowerCase();
    const lowerPrefix = prefix.toLowerCase();

    if (lowerLine.startsWith(lowerPrefix)) {
      // Find the actual prefix in the original line (preserving case)
      const prefixIndex = lowerLine.indexOf(lowerPrefix);
      if (prefixIndex !== -1) {
        const content = line.substring(prefixIndex + prefix.length).trim();
        return content;
      }
    }
  }

  return "";
}

/**
 * Validates a parsed description and returns warnings
 */
export function validateParsedDescription(
  parsed: ParsedDescription,
  iconType: string,
  iconName: string,
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (iconType === "functional") {
    const functional = parsed as ParsedDescriptionFunctional;

    if (!functional.enDefault) {
      warnings.push(`${iconName}: Missing EN default description`);
    }
    if (!functional.deDefault) {
      warnings.push(`${iconName}: Missing DE default description`);
    }
    if (!functional.enContextual) {
      warnings.push(`${iconName}: Missing EN contextual description`);
    }
    if (!functional.deContextual) {
      warnings.push(`${iconName}: Missing DE contextual description`);
    }
  } else {
    const illustrative = parsed as ParsedDescriptionIllustrative;

    if (!illustrative.en) {
      warnings.push(`${iconName}: Missing EN description`);
    }
    if (!illustrative.de) {
      warnings.push(`${iconName}: Missing DE description`);
    }
  }

  if (!parsed.keywords) {
    warnings.push(`${iconName}: Missing keywords`);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
