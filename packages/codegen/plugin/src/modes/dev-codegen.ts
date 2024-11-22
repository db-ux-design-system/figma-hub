// TODO: Add to settings

import { generateData } from "shared/figma/generate";
import { formatCss, formatHtml, FrameworkTarget } from "shared/generate";
import { generateCode } from "shared/generate/code";
import { generateStyles } from "shared/generate/style";

const getDisplayLanguage = (
  language: string,
): "JSON" | "CSS" | "TYPESCRIPT" | "HTML" => {
  if (language === "json") {
    return "JSON";
  } else if (language === "react") {
    return "TYPESCRIPT";
  } else if (language === "css") {
    return "CSS";
  }
  return "HTML";
};

export const handleDevCodegen = () => {
  // @ts-ignore
  figma.codegen.on("generate", async (event: CodegenEvent) => {
    const { node, language } = event;
    const withCss = figma.codegen.preferences.customSettings["css"] === "yes";
    const withModes =
      figma.codegen.preferences.customSettings["modes"] === "yes";
    const maxDepth = Number(
      figma.codegen.preferences.customSettings["maxDepth"] ?? 5,
    );

    const outputNode = await generateData(withCss, withModes, maxDepth, node);

    if (!outputNode) {
      return [
        {
          title: "Error",
          code: "Failed to load node",
        },
      ];
    }

    if (language === "json") {
      return [
        {
          title: "JSON data",
          code: JSON.stringify(outputNode, undefined, 2),
          language: getDisplayLanguage(language),
        },
      ];
    }

    const target = language as FrameworkTarget;
    const code = formatHtml(generateCode(outputNode, target));

    const result = [
      {
        title: `${language}`,
        code,
        language: getDisplayLanguage(language),
      },
    ];

    if (withCss) {
      const css = formatCss(generateStyles(outputNode));
      result.push({
        title: "CSS",
        code: css,
        language: "CSS",
      });
    }

    return result;
  });
};
