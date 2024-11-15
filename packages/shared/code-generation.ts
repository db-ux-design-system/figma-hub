import slugify from "@sindresorhus/slugify";
import { toCamelCase, toPascalCase } from "./utils";
import { OutputNode } from "./data";
import { html_beautify, css_beautify } from "js-beautify";

// TODO: Make this configurable
const prefix: string = "db";

export type HtmlNode = {
  tag?: string;
  props?: { [k: string]: string };
};

export type ResolvedIcons = {
  leadingIcon?: string;
  trailingIcon?: string;
};

export type CssNode = {
  id: string;
  className: string;
  css: { [k: string]: string };
};

export type FrameworkTarget = "react" | "html";

const getCleanedVariantProperties = (
  variantProperties?: { [p: string]: string } | null,
) => {
  if (variantProperties) {
    return Object.entries(variantProperties).reduce(
      (previousValue, [key, value]) => {
        // Don't use design variables
        if (key.startsWith("🎨")) {
          return previousValue;
        }

        const cleanKey = slugify(key);
        const cleanValue = slugify(value)
          .replace("def-", "")
          .replace(`${cleanKey}-`, "")
          .replace(`-${cleanKey}`, "")
          .trim();

        return { ...previousValue, [cleanKey]: cleanValue };
      },
      {},
    );
  }

  return {};
};

const getComponent = (
  { variantProperties }: OutputNode,
  target: FrameworkTarget,
): HtmlNode => {
  let tag = "div";
  let props: { [k: string]: string } = {};
  if (variantProperties) {
    props = getCleanedVariantProperties(variantProperties);

    const component = props["component"];
    if (component) {
      delete props["component"];

      if (target === "react") {
        tag = `${prefix.toUpperCase()}${toPascalCase(component)}`;
        props = Object.entries(props).reduce((previousValue, [key, value]) => {
          return { ...previousValue, [toCamelCase(key)]: value };
        }, {});
      } else {
        tag = `${prefix}-${component}`;
      }
    } else {
      // TODO: make new custom component
    }
  }

  return { tag, props };
};

const getTag = (
  node: OutputNode,
  target: FrameworkTarget,
  parent?: OutputNode,
): HtmlNode => {
  const { type } = node;

  if (type === "FRAME" || type === "GROUP") {
    return { tag: "div" };
  } else if (type === "TEXT") {
    if (parent && parent.type === "INSTANCE") {
      const cleanProps: any = getCleanedVariantProperties(
        parent.variantProperties,
      );
      if (cleanProps["component"]) {
        return {};
      }
    }
    return { tag: "p" };
  } else if (type === "INSTANCE") {
    return getComponent(node, target);
  }

  return {
    tag: "div",
    props: { "data-component": "custom" },
  };
};

const isFragment = ({ type, children }: OutputNode): boolean =>
  (type === "FRAME" || type === "GROUP") && children?.length === 1;

const getHtmlProps = (props?: { [k: string]: string }) => {
  const flatProps: string[] = [];
  if (props) {
    Object.entries(props).map(([key, value]) => {
      switch (value) {
        case "false":
          break;
        case "true":
          flatProps.push(`${key}`);
          break;
        default:
          flatProps.push(`${key}="${value}"`);
          break;
      }
    });
  }
  return flatProps;
};

const getNextInstance = (node: OutputNode): OutputNode | undefined => {
  if (node.type === "INSTANCE") {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const childInstance = getNextInstance(child);
      if (childInstance) {
        return childInstance;
      }
    }
  }

  return undefined;
};

const getIcons = (iconChildren?: OutputNode[]): ResolvedIcons | undefined => {
  if (!iconChildren) {
    return undefined;
  }

  let trailingIcon: string | undefined = undefined;
  let leadingIcon: string | undefined = undefined;

  iconChildren.forEach((iconChild) => {
    const instanceNode = getNextInstance(iconChild);
    if (instanceNode) {
      const iconVariant = slugify(instanceNode.name);
      const iconName = slugify(instanceNode.componentName || "unkown").replace(
        "icon-",
        "",
      );
      if (iconVariant.includes("leading")) {
        leadingIcon = iconName;
      }
      if (iconVariant.includes("trailing")) {
        trailingIcon = iconName;
      }
    }
  });

  if (trailingIcon || leadingIcon) {
    return { trailingIcon, leadingIcon };
  }

  return undefined;
};

const isIconChild = (node: OutputNode): boolean =>
  node.name.toLowerCase().includes("icon");

const getId = (node: OutputNode): string => slugify(`${node.type}-${node.id}`);

const getClassName = (node: OutputNode): string => slugify(node.name);

const resolveIcons = (node: OutputNode) => {
  if (node.type === "INSTANCE" && node.children) {
    let resolvedIcons: ResolvedIcons | undefined;
    for (const childNode of node.children) {
      if (childNode.children) {
        const foundSubIcons = childNode.children.filter((subChild) =>
          isIconChild(subChild),
        );
        if (foundSubIcons) {
          resolvedIcons = getIcons(foundSubIcons);
          childNode.children = childNode.children.filter(
            (subChild) => !isIconChild(subChild),
          );
        }
      }
    }

    if (!resolvedIcons) {
      const foundDirectIcons = node.children.filter((subChild) =>
        isIconChild(subChild),
      );
      if (foundDirectIcons) {
        resolvedIcons = getIcons(foundDirectIcons);
        node.children = node.children.filter(
          (subChild) => !isIconChild(subChild),
        );
      }
    }

    if (resolvedIcons) {
      if (!node.variantProperties) {
        node.variantProperties = {};
      }

      if (resolvedIcons.trailingIcon) {
        node.variantProperties = {
          ...node.variantProperties,
          iconAfter: resolvedIcons.trailingIcon,
        };
      }
      if (resolvedIcons.leadingIcon) {
        node.variantProperties = {
          ...node.variantProperties,
          icon: resolvedIcons.leadingIcon,
        };
      }
    }
  }
};

export const generateCode = (
  node: OutputNode,
  target: FrameworkTarget,
  parent?: OutputNode,
): string => {
  resolveIcons(node);
  const { tag, props } = getTag(node, target, parent);
  const fragment = isFragment(node);

  // Filter icons we use them as properties
  const inner = `${
    node.children
      ?.map((childNode: OutputNode) => {
        return generateCode(childNode, target, fragment ? parent : node);
      })
      .join("\n") ?? ""
  }${node.text ?? ""}`;

  if (fragment) {
    return inner;
  }

  let className = "";
  if (target === "html") {
    className = `class="${getClassName(node)}"`;
  } else if (target === "react") {
    className = `className="${getClassName(node)}"`;
  }

  if (tag) {
    return `<${tag} id="${getId(node)}" ${className} ${getHtmlProps(props).join(" ")}>
${inner}
</${tag}>
`;
  }

  return inner;
};

const resolveCssNodeRecursive = (node: OutputNode, cssNodes: CssNode[]) => {
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

export const generateStyles = (node: OutputNode): string => {
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

export const formatHtml = (code: string): string => {
  return html_beautify(code, {
    indent_size: 4,
    max_preserve_newlines: 1,
    preserve_newlines: true,
    indent_scripts: "normal",
    wrap_line_length: 40,
  });
};

export const formatCss = (code: string): string => {
  return css_beautify(code, {
    indent_size: 4,
    max_preserve_newlines: 1,
    preserve_newlines: true,
    wrap_line_length: 40,
  });
};
