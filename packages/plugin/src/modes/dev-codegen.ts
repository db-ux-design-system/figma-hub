// TODO: Add to settings
import { generateData } from "../utils/generate.js";
import {
  formatCss,
  formatHtml,
  FrameworkTarget,
  generateCode,
  generateStyles,
} from "shared/code-generation.js";

const maxDepth = 3;

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

const getFormat = (language: string): "html" | "babel" => {
  if (language === "react") {
    return "babel";
  }
  return "html";
};

export const handleDevCodegen = () => {
  figma.codegen.on("generate", async (event: CodegenEvent) => {
    const { node, language } = event;

    const outputNode = await generateData(true, maxDepth, node);

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
    const css = formatCss(generateStyles(outputNode));

    return [
      {
        title: `${language}`,
        code,
        language: getDisplayLanguage(language),
      },
      {
        title: "CSS",
        code: css,
        language: "CSS",
      },
    ];
  });
};
