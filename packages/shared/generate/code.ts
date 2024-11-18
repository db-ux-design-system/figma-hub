import { OutputNode } from "../data";
import {
  FrameworkTarget,
  getClassName,
  getId,
  HtmlNode,
  ResolvedIcons,
} from "./index";
import slugify from "@sindresorhus/slugify";
import { toCamelCase, toPascalCase } from "../utils";

export const getCleanedVariantProperties = (
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

const resolvePropsChildren =
  (children: string, target: FrameworkTarget): ((text: string) => string) =>
  (text: string) => {
    const childrenAsString: string[] = [];
    const splitChildren = children.split("-");

    for (const child of splitChildren) {
      const isCheckbox = child.includes("checkbox");
      const isRadio = child.includes("radio");
      const isButton = child.includes("button");
      if (isCheckbox || isRadio) {
        const type = isCheckbox ? "checkbox" : "radio";
        childrenAsString.push(`<label>${text}<input type="${type}"/></label>`);
      } else if (isButton) {
        childrenAsString.push(`<button>${text}</button>`);
      }
    }

    if (childrenAsString.length > 0) {
      const firstChild = childrenAsString.shift();

      return `${firstChild}
      ${target === "html" ? "<!--" : "{/*"}
      You could use those elements as well
      ${childrenAsString.join("\n")}
      ${target === "html" ? "-->" : "*/}"}
      `;
    }

    return text;
  };

export const getComponent = (
  { variantProperties }: OutputNode,
  target: FrameworkTarget,
): HtmlNode => {
  let tag = "div";
  let props: { [k: string]: string } = {};
  let children: ((text: string) => string) | undefined;
  if (variantProperties) {
    props = getCleanedVariantProperties(variantProperties);

    const component = props["component"];
    if (component) {
      delete props["component"];

      const prefix = props["prefix"];
      if (prefix) {
        delete props["prefix"];
      }

      if (target === "react") {
        tag = `${prefix ? prefix.toUpperCase() : ""}${toPascalCase(component)}`;
        props = Object.entries(props).reduce((previousValue, [key, value]) => {
          return { ...previousValue, [toCamelCase(key)]: value };
        }, {});
      } else {
        tag = `${prefix ? `${prefix}-` : ""}${component}`;
      }

      const propsChildren = props["children"];
      if (propsChildren) {
        delete props["children"];
        children = resolvePropsChildren(propsChildren, target);
      }
    } else {
      // TODO: make new custom component
    }
  }

  return { tag, props, children };
};

export const getTag = (
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

export const isFragment = ({ type, children }: OutputNode): boolean =>
  (type === "FRAME" || type === "GROUP") && children?.length === 1;

export const getHtmlProps = (props?: { [k: string]: string }) => {
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

export const getNextInstance = (node: OutputNode): OutputNode | undefined => {
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

export const getIcons = (
  iconChildren?: OutputNode[],
): ResolvedIcons | undefined => {
  if (!iconChildren) {
    return undefined;
  }

  let trailingIcon: string | undefined = undefined;
  let leadingIcon: string | undefined = undefined;

  for (const iconChild of iconChildren) {
    const instanceNode = getNextInstance(iconChild);
    if (instanceNode) {
      const iconVariant = slugify(instanceNode.name);
      const iconName = slugify(instanceNode.componentName || "unknown").replace(
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
  }

  if (trailingIcon || leadingIcon) {
    return { trailingIcon, leadingIcon };
  }

  return undefined;
};

export const isIconChild = (node: OutputNode): boolean =>
  node.name.toLowerCase().includes("icon");

const resolveIconsRecursive = (node: OutputNode): ResolvedIcons | undefined => {
  if (node.children) {
    const foundSubIcons = node.children.filter((subChild) =>
      isIconChild(subChild),
    );
    if (foundSubIcons.length > 0) {
      const resolvedIcons = getIcons(foundSubIcons);
      node.children = node.children.filter(
        (subChild) => !isIconChild(subChild),
      );
      return resolvedIcons;
    } else {
      for (const childNode of node.children) {
        if (childNode.children) {
          const resolvedIcons = resolveIconsRecursive(childNode);
          if (resolvedIcons) {
            return resolvedIcons;
          }
        }
      }
    }
  }

  return undefined;
};

export const resolveIcons = (node: OutputNode) => {
  if (node.type === "INSTANCE" && node.children) {
    const resolvedIcons: ResolvedIcons | undefined =
      resolveIconsRecursive(node);

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
  const { tag, props, children } = getTag(node, target, parent);
  const fragment = isFragment(node);

  // Filter icons we use them as properties
  let inner = `${
    node.children
      ?.map((childNode: OutputNode) => {
        return generateCode(childNode, target, fragment ? parent : node);
      })
      .join("\n") ?? ""
  }${node.text ?? ""}`;

  if (children) {
    inner = children(inner);
  }

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
