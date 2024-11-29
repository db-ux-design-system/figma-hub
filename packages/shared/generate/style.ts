import { CssNode, getClassName, getId } from "./index";
import { Node } from "../data";

export const resolveCssNodeRecursive = (
  node: Node,
  cssNodes: CssNode[],
) => {
  cssNodes.push({
    id: getId(node),
    className: getClassName(node),
    css: node.css ?? {},
  });
  if (node.children) {
    node.children.forEach((child) => {
      resolveCssNodeRecursive(child, cssNodes);
    });
  }
};

const cssSetToString = (
  set: Record<string, { [k: string]: string }>,
  prefix: string,
): string => {
  let result = "";

  for (const [key, css] of Object.entries(set)) {
    result += `
    ${prefix}${key}{
    ${Object.entries(css)
      .map(([cssKey, value]) => `${cssKey}: ${value};`)
      .join("\n")}
    }
    `;
  }
  return result;
};

export const generateStyles = (node: Node): string => {
  const cssNodes: CssNode[] = [];
  // TODO: Don't generate css for sub nodes in components
  resolveCssNodeRecursive(node, cssNodes);
  const classes: Record<string, { [k: string]: string }> = {};
  const ids: Record<string, { [k: string]: string }> = {};

  for (const { className, css } of cssNodes) {
    if (!classes[className]) {
      // If class doesn't exist, we creat it
      const remainingProps: { [k: string]: string } = {};
      const foundCssNodes = cssNodes.filter(
        (fNode) => fNode.className === className,
      );

      Object.entries(css).forEach(([key, value]) => {
        const allHaveProp =
          foundCssNodes.filter((fNode) => Object.keys(fNode.css).includes(key))
            .length === foundCssNodes.length;
        if (allHaveProp) {
          remainingProps[key] = value;
        }
      });

      if (Object.keys(remainingProps).length > 0) {
        classes[className] = remainingProps;
      }
    }
  }

  for (const { id, className, css } of cssNodes) {
    const remainingProps: { [k: string]: string } = {};
    const classProps = classes[className]
      ? Object.keys(classes[className])
      : [];
    for (const [key, value] of Object.entries(css)) {
      if (!classProps.includes(key)) {
        remainingProps[key] = value;
      }
    }
    if (Object.keys(remainingProps).length > 0) {
      ids[id] = remainingProps;
    }
  }

  return `${cssSetToString(ids, "#")}
  ${cssSetToString(classes, ".")}
  `;
};
