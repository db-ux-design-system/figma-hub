import { OutputNode } from "../../data";
import { FrameworkTarget } from "../index";
import slugify from "@sindresorhus/slugify";

/**
 * Some properties shouldn't be slugified
 */
const variantCleanValueExceptions: string[] = [
  "placeholder",
  "label",
  "value",
  "message",
  "valid-message",
  "invalid-message",
  "placement",
  "headline-plain",
];

const componentPropertyKeyExceptions: string[] = ["show-icon", "closeable"];

/**
 * We resolve some boolean properties to html attributes
 * @param componentProperties Some properties in Figma aren't variantProperties like booleans, we need a workaround to resolve those
 */
const getComponentProperties = (
  componentProperties?: Record<string, string | boolean>,
) => {
  const properties: Record<string, string> = {};
  if (componentProperties) {
    for (const [key, value] of Object.entries(componentProperties)) {


      let cleanKey = slugify(key);
      let cleanValue = slugify(String(value)).trim();

      if (componentPropertyKeyExceptions.includes(cleanKey)) {
        properties[cleanKey] = cleanValue;
      } else if (key.startsWith("↳ OR")) {
          // We have some "OR" boolean for designers in figma, we need to map the correct value here
          const realProp = key.replace("↳ OR ","")
      }
    }
  }
  return properties;
};

/**
 * This functions tries to clean and merge the properties to get valid html attributes.
 * @param variantProperties All variant properties which reflects code props in 80% of the time
 * @param componentProperties Some properties in Figma aren't variantProperties like booleans, we need a workaround to resolve those
 * @param target the framework like react,angular, ...
 */
export const getCleanedVariantProperties = (
  { variantProperties, componentProperties }: OutputNode,
  target?: FrameworkTarget,
): Record<string, any> => {
  if (variantProperties) {
    const properties: Record<string, any> = Object.entries(
      variantProperties,
    ).reduce((previousValue, [key, value]) => {
      // Don't use design variables
      if (key.startsWith("🎨")) {
        return previousValue;
      }

      let cleanKey = slugify(key);
      // Don't clean value for exceptions
      let cleanValue = variantCleanValueExceptions.includes(cleanKey)
        ? value
        : slugify(value).replace("def-", "").trim();

      if (target === "react") {
        if (cleanKey === "value") {
          cleanKey = "defaultValue";
        }
        if (cleanKey === "checked") {
          cleanKey = "defaultChecked";
        }
      }

      // This is for the Notification
      if (cleanKey === "visual") {
        if (cleanValue === "icon") {
          cleanKey = "icon";
          cleanValue = "information_circle";
        } else if (cleanValue === "image") {
          cleanKey = "image";
          cleanValue =
            "https://raw.githubusercontent.com/db-ui/mono/refs/heads/main/packages/foundations/assets/images/db_logo.svg";
        }
      }

      return { ...previousValue, [cleanKey]: cleanValue };
    }, {});

    return { ...properties, ...getComponentProperties(componentProperties) };
  }

  return {};
};

/**
 * Some props are written like "children=button|checkbox|radio".
 * We want to provide the correct children instead of the property.
 * Currently, this is the case for:
 *  - Tag
 */
export const resolvePropsChildren =
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
