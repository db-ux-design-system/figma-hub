import { OutputNode } from "../../data";
import {
  FrameworkTarget,
  getClassName,
  getId,
  HtmlNode,
  ResolvedIcons,
} from "../index";
import slugify from "@sindresorhus/slugify";
import { toCamelCase, toPascalCase } from "../../utils";
import {
  getCleanedVariantProperties,
  resolvePropsChildren,
} from "./properties";

export const getComponent = (
  node: OutputNode,
  target: FrameworkTarget,
  parent?: OutputNode,
): HtmlNode => {
  let tag = "div";
  let props: { [k: string]: string } = {};
  let children: ((text: string) => string) | undefined;
  if (node.variantProperties) {
    props = getCleanedVariantProperties(node, target);

    const component = props["component"];
    if (component) {
      if (component === "card" && parent && isComponent(parent)) {
        // We don't need to use a card inside another component
        return {
          tag: "",
        };
      }

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

const isComponent = (node: OutputNode): boolean => node.type === "INSTANCE";

export const getTag = (
  node: OutputNode,
  target: FrameworkTarget,
  parent?: OutputNode,
): HtmlNode => {
  const { type } = node;

  if (type === "FRAME" || type === "GROUP") {
    return { tag: "div" };
  } else if (type === "TEXT") {
    if (parent && isComponent(parent)) {
      const cleanProps: any = getCleanedVariantProperties(parent, target);
      if (cleanProps["component"]) {
        return {};
      }
    }
    return { tag: "p" };
  } else if (isComponent(node)) {
    return getComponent(node, target, parent);
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
  if (isComponent(node)) {
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

const resolveNodesRecursive = <T>({
  node,
  resolveFunc,
  isFunc,
  filterFunc,
}: {
  node: OutputNode;
  isFunc: (child: OutputNode) => boolean;
  resolveFunc?: (foundChildren: OutputNode[]) => T;
  filterFunc?: (child: OutputNode) => boolean;
}): T | undefined => {
  if (node.children) {
    const foundChildren = node.children.filter((subChild) => isFunc(subChild));
    if (foundChildren.length > 0) {
      const resolved = resolveFunc ? resolveFunc(foundChildren) : undefined;
      node.children = node.children.filter((subChild) =>
        filterFunc ? filterFunc(subChild) : !isFunc(subChild),
      );
      return resolved;
    } else {
      for (const childNode of node.children) {
        if (childNode.children) {
          const resolved = resolveNodesRecursive({
            node: childNode,
            isFunc,
            resolveFunc,
            filterFunc,
          });
          if (resolved) {
            return resolved;
          }
        }
      }
    }
  }

  return undefined;
};

const resolveInputNodes = (node: OutputNode) => {
  const resolvedRequired: boolean | undefined = resolveNodesRecursive<boolean>({
    node,
    isFunc: (child) => child.text === "*",
    resolveFunc: (foundChildren) => foundChildren.length > 0,
  });
  if (resolvedRequired) {
    node.variantProperties = {
      ...node.variantProperties,
      required: "true",
    };
  }

  const resolvedPlaceholder: string | undefined = resolveNodesRecursive<string>(
    {
      node,
      isFunc: (child) => slugify(child.name).includes("placeholder"),
      resolveFunc: (foundChildren) =>
        foundChildren.map((child) => child.text).join("\n"),
    },
  );
  if (resolvedPlaceholder) {
    node.variantProperties = {
      ...node.variantProperties,
      placeholder: resolvedPlaceholder,
    };
  }

  const resolvedValue: string | undefined = resolveNodesRecursive<string>({
    node,
    isFunc: (child) => slugify(child.name) === "input-text",
    resolveFunc: (foundChildren) =>
      foundChildren.map((child) => child.text).join("\n"),
  });
  if (resolvedValue) {
    node.variantProperties = {
      ...node.variantProperties,
      value: resolvedValue,
    };
  }

  const resolvedLabel: string | undefined = resolveNodesRecursive<string>({
    node,
    isFunc: (child) => slugify(child.name) === "label",
    resolveFunc: (foundChildren) =>
      foundChildren.map((child) => child.text).join("\n"),
  });
  if (resolvedLabel) {
    node.variantProperties = {
      ...node.variantProperties,
      label: resolvedLabel,
    };
  }

  const resolvedLabelScreenReader: string | undefined =
    resolveNodesRecursive<string>({
      node,
      isFunc: (child) => slugify(child.name) === "label-screenreader",
      resolveFunc: (foundChildren) =>
        foundChildren.map((child) => child.text).join("\n"),
    });
  // Only add screen reader label if normal label not set
  if (!resolvedLabel && resolvedLabelScreenReader) {
    node.variantProperties = {
      ...node.variantProperties,
      label: resolvedLabelScreenReader,
    };
  }

  const cleanedProperties = getCleanedVariantProperties(node);
  // Resolve DBInfotext
  const validation = cleanedProperties["validation"];
  const hasShowMessage = cleanedProperties["showMessage"];
  if (validation || hasShowMessage) {
    const resolvedInfoText: string | undefined = resolveNodesRecursive<string>({
      node,
      isFunc: (child) => {
        const cleanedChildProperties = getCleanedVariantProperties(child);
        return cleanedChildProperties["component"] === "infotext";
      },
      resolveFunc: (foundChildren) => {
        return foundChildren
          .map((child) =>
            child.children && child.children.length > 0
              ? child.children[0].text
              : "",
          )
          .join("\n");
      },
    });
    if (resolvedInfoText) {
      let key = "message";
      if (validation === "valid") {
        key = "validMessage";
      } else if (validation === "invalid") {
        key = "invalidMessage";
      }
      node.variantProperties = {
        ...node.variantProperties,
        [key]: resolvedInfoText,
      };
    }
  }
};

const resolveNotificationNodes = (node: OutputNode) => {
  const resolvedHeadline: string | undefined = resolveNodesRecursive<string>({
    node,
    isFunc: (child) => slugify(child.name) === "headline",
    resolveFunc: (foundChildren) =>
      foundChildren.map((child) => child.text).join("\n"),
  });
  if (resolvedHeadline) {
    node.variantProperties = {
      ...node.variantProperties,
      headlinePlain: resolvedHeadline,
    };
  }
};

const resolveNodes = (node: OutputNode) => {
  if (isComponent(node) && node.children) {
    const resolvedIcons: ResolvedIcons | undefined = resolveNodesRecursive<
      ResolvedIcons | undefined
    >({ node, isFunc: isIconChild, resolveFunc: getIcons });

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

    resolveInputNodes(node);
    resolveNotificationNodes(node);
  }
};

export const generateCode = (
  node: OutputNode,
  target: FrameworkTarget,
  parent?: OutputNode,
): string => {
  resolveNodes(node);
  const fragment = isFragment(node);
  let inner = `${
    node.children
      ?.map((childNode: OutputNode) => {
        return generateCode(childNode, target, fragment ? parent : node);
      })
      .join("\n") ?? ""
  }${node.text ?? ""}`.trim();

  const { tag, props, children } = getTag(node, target, parent);

  if (children) {
    inner = children(inner).trim();
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
    if (inner.length === 0) {
      if (isComponent(node)) {
        // Self-closing for react
        if (target === "react") {
          return `<${tag} id="${getId(node)}" ${className} ${getHtmlProps(props).join(" ")}/>`;
        }
      }

      return "";
    }

    return `<${tag} id="${getId(node)}" ${className} ${getHtmlProps(props).join(" ")}>
${inner}
</${tag}>
`;
  }

  return inner;
};
