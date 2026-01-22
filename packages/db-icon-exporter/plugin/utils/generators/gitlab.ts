// utils/generators/gitlab.ts

import { IconData } from "../../types";
import { extractIconBaseName, toHyphenatedKey } from "../helpers";

export function generateGitLabDescriptions(
  icons: IconData[],
  iconType: string,
): string {
  const descriptionsMap: Record<string, any> = {};

  icons.forEach((iconData) => {
    const baseName = extractIconBaseName(iconData.name);
    const key = toHyphenatedKey(baseName, iconType);

    if (descriptionsMap[key]) {
      return;
    }

    const parsed = iconData.parsedDescription;

    if (iconType === "functional") {
      descriptionsMap[key] = {
        en: {
          default: parsed.enDefault ? [parsed.enDefault] : [],
          contextual: parsed.enContextual
            ? parsed.enContextual.split(",").map((s: string) => s.trim())
            : [],
        },
        de: {
          default: parsed.deDefault ? [parsed.deDefault] : [],
          contextual: parsed.deContextual
            ? parsed.deContextual.split(",").map((s: string) => s.trim())
            : [],
        },
      };
    } else {
      descriptionsMap[key] = {
        en: parsed.en ? [parsed.en] : [],
        de: parsed.de ? [parsed.de] : [],
      };
    }
  });

  const sortedKeys = Object.keys(descriptionsMap).sort();
  const sortedDescriptions: Record<string, any> = {};
  sortedKeys.forEach((key) => {
    sortedDescriptions[key] = descriptionsMap[key];
  });

  return JSON.stringify(sortedDescriptions, null, "\t");
}
