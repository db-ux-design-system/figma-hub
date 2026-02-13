// utils/parser.ts

import {
  ParsedDescription,
  ParsedDescriptionFunctional,
  ParsedDescriptionIllustrative,
} from "../types";

export function parseDescription(
  description: string,
  iconType: string
): ParsedDescription {
  if (!description || !description.trim()) {
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

  const lines = description.split("\n").map((line) => line.trim());

  if (iconType === "functional") {
    const parsed: ParsedDescriptionFunctional = {
      enDefault: "",
      enContextual: "",
      deDefault: "",
      deContextual: "",
      keywords: "",
    };

    let currentLanguage = "";

    for (const line of lines) {
      if (line.startsWith("#")) continue;

      const lowerLine = line.toLowerCase();

      if (lowerLine === "en:" || lowerLine === "en") {
        currentLanguage = "EN";
        continue;
      }
      if (lowerLine === "de:" || lowerLine === "de") {
        currentLanguage = "DE";
        continue;
      }

      if (currentLanguage === "EN") {
        if (lowerLine.startsWith("default:") || lowerLine.startsWith("default")) {
          const content = line.includes(":") ? line.split(":").slice(1).join(":").trim() : "";
          parsed.enDefault = content;
        } else if (lowerLine.startsWith("contextual:") || lowerLine.startsWith("contextual")) {
          const content = line.includes(":") ? line.split(":").slice(1).join(":").trim() : "";
          parsed.enContextual = content;
        }
      } else if (currentLanguage === "DE") {
        if (lowerLine.startsWith("default:") || lowerLine.startsWith("default")) {
          const content = line.includes(":") ? line.split(":").slice(1).join(":").trim() : "";
          parsed.deDefault = content;
        } else if (lowerLine.startsWith("contextual:") || lowerLine.startsWith("contextual")) {
          const content = line.includes(":") ? line.split(":").slice(1).join(":").trim() : "";
          parsed.deContextual = content;
        }
      }

      if (lowerLine.startsWith("keywords:") || line.startsWith("#")) {
        const content = line.startsWith("#") ? line.substring(1).trim() : line.split(":").slice(1).join(":").trim();
        parsed.keywords = content;
      }
    }

    return parsed;
  } else {
    const parsed: ParsedDescriptionIllustrative = {
      en: "",
      de: "",
      keywords: "",
    };

    for (const line of lines) {
      if (line.startsWith("#")) continue;

      if (line.toLowerCase().startsWith("en:")) {
        const content = line.split(":").slice(1).join(":").trim();
        parsed.en = content;
        continue;
      }

      if (line.toLowerCase().startsWith("de:")) {
        const content = line.split(":").slice(1).join(":").trim();
        parsed.de = content;
        continue;
      }

      if (line.toLowerCase().startsWith("keywords:")) {
        const content = line.split(":").slice(1).join(":").trim();
        parsed.keywords = content;
        continue;
      }
    }

    return parsed;
  }
}
