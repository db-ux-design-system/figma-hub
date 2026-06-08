// utils/pageBuilder.ts

import { IconData, ChangelogStatus } from "../types";
import { STATUS_CONFIG, TAG_COMPONENT_KEY } from "../config";
import {
  extractIconBaseName,
  extractIconSize,
  isFilledVariant,
  cleanFilename,
} from "./helpers";
import {
  bindChangelogFrameVariables,
  bindChangelogStatusFrameVariables,
  bindChangelogHeadlineVariables,
  bindChangelogIconsContainerVariables,
} from "./variablesBinder";
import { groupByPackage } from "./generators/gitlab";

// Helper function to recursively detach all variable bindings
function detachVariables(node: SceneNode) {
  // For nodes with fills, create new fills without variable bindings
  if (
    "fills" in node &&
    node.fills !== figma.mixed &&
    Array.isArray(node.fills)
  ) {
    const newFills: Paint[] = [];
    for (const fill of node.fills) {
      if (fill.type === "SOLID") {
        newFills.push({
          type: "SOLID",
          color: { r: fill.color.r, g: fill.color.g, b: fill.color.b },
          opacity: fill.opacity !== undefined ? fill.opacity : 1,
        });
      } else {
        newFills.push(fill);
      }
    }
    node.fills = newFills;
  }

  // For nodes with strokes
  if (
    "strokes" in node &&
    node.strokes !== figma.mixed &&
    Array.isArray(node.strokes)
  ) {
    const newStrokes: Paint[] = [];
    for (const stroke of node.strokes) {
      if (stroke.type === "SOLID") {
        newStrokes.push({
          type: "SOLID",
          color: { r: stroke.color.r, g: stroke.color.g, b: stroke.color.b },
          opacity: stroke.opacity !== undefined ? stroke.opacity : 1,
        });
      } else {
        newStrokes.push(stroke);
      }
    }
    node.strokes = newStrokes;
  }

  // Recursively process all children
  if ("children" in node) {
    for (const child of node.children) {
      detachVariables(child);
    }
  }
}

export async function buildGitLabFrame(
  selectedIcons: IconData[],
  iconType: string,
  allIcons: IconData[],
): Promise<FrameNode[]> {
  // Group icons by package
  const packageGroups = groupByPackage(selectedIcons);
  const frames: FrameNode[] = [];

  // Create a frame for each package
  for (const [packageName, packageIcons] of packageGroups) {
    const frame = figma.createFrame();
    frame.name = `GitLab Export - ${packageName}`;
    frame.layoutMode = "HORIZONTAL";
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
    frame.itemSpacing = 16;

    const selectedBaseNames = new Set(
      packageIcons.map((icon) => extractIconBaseName(icon.name)),
    );

    const iconSets = new Map<string, IconData[]>();
    allIcons.forEach((icon) => {
      const baseName = extractIconBaseName(icon.name);
      if (selectedBaseNames.has(baseName)) {
        if (!iconSets.has(baseName)) {
          iconSets.set(baseName, []);
        }
        iconSets.get(baseName)!.push(icon);
      }
    });

    const sizes = iconType === "functional" ? [32, 24, 20] : [64];

    // Sortiere Icon-Sets alphabetisch
    const sortedIconSets = Array.from(iconSets.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    for (const [setName, variants] of sortedIconSets) {
      const category = variants[0].category
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/&/g, "");
      const packageName = variants[0].package.toLowerCase();
      // Icon-Namen in Figma sind bereits identisch zu GitLab-Namen
      const iconName = setName;

      for (const size of sizes) {
        if (iconType === "functional") {
          const outlined = variants.find(
            (v) => extractIconSize(v.name) === size && !isFilledVariant(v.name),
          );
          if (outlined) {
            const node = await figma.getNodeByIdAsync(outlined.id);
            if (node && node.type === "COMPONENT") {
              const instance = node.createInstance();
              instance.name = `gitlab/${packageName}/${category}/${iconName}/outlined/${size}`;

              // Detach all variable bindings recursively
              detachVariables(instance);

              frame.appendChild(instance);
            }
          }

          const filled = variants.find(
            (v) => extractIconSize(v.name) === size && isFilledVariant(v.name),
          );
          if (filled) {
            const node = await figma.getNodeByIdAsync(filled.id);
            if (node && node.type === "COMPONENT") {
              const instance = node.createInstance();
              instance.name = `gitlab/${packageName}/${category}/${iconName}/filled/${size}`;

              // Detach all variable bindings recursively
              detachVariables(instance);

              frame.appendChild(instance);
            }
          }
        } else {
          const icon = variants[0];
          const node = await figma.getNodeByIdAsync(icon.id);
          if (node && node.type === "COMPONENT") {
            const instance = node.createInstance();
            instance.name = `gitlab/${packageName}/${category}/${iconName}`;

            // Detach all variable bindings recursively
            detachVariables(instance);

            frame.appendChild(instance);
          }
        }
      }
    }

    frames.push(frame);
  }

  return frames;
}

export async function buildMarketingFrame(
  selectedIcons: IconData[],
  iconType: string,
  allIcons: IconData[],
): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = "Export_Icon_UPDATE";
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = 16;

  const selectedBaseNames = new Set(
    selectedIcons.map((icon) => extractIconBaseName(icon.name)),
  );

  const iconSets = new Map<string, IconData[]>();
  allIcons.forEach((icon) => {
    const baseName = extractIconBaseName(icon.name);
    if (selectedBaseNames.has(baseName)) {
      if (!iconSets.has(baseName)) {
        iconSets.set(baseName, []);
      }
      iconSets.get(baseName)!.push(icon);
    }
  });

  const sizes = iconType === "functional" ? [64, 48, 32, 24, 20] : [64];

  // Sortiere Icon-Sets alphabetisch
  const sortedIconSets = Array.from(iconSets.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  for (const [setName, variants] of sortedIconSets) {
    const category = variants[0].category
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/&/g, "");
    // Marketing: Funktionale Icons von kebab-case zu snake_case, illustrative bleiben snake_case
    const iconName =
      iconType === "functional" ? setName.replace(/-/g, "_") : setName;

    for (const size of sizes) {
      if (iconType === "functional") {
        const outlined = variants.find(
          (v) => extractIconSize(v.name) === size && !isFilledVariant(v.name),
        );
        if (outlined) {
          const node = await figma.getNodeByIdAsync(outlined.id);
          if (node && node.type === "COMPONENT") {
            const instance = node.createInstance();
            let filename = `db_ic_${category}_${iconName}_${size}.svg`;
            instance.name = `marketingportal/${cleanFilename(filename)}`;

            // First detach all variable bindings
            detachVariables(instance);

            // Then set color to #131821 on all vector nodes
            const setColor = (node: SceneNode) => {
              if (
                "fills" in node &&
                node.fills !== figma.mixed &&
                Array.isArray(node.fills)
              ) {
                const fills = node.fills.map((fill) => {
                  if (fill.type === "SOLID") {
                    return {
                      type: "SOLID" as const,
                      color: { r: 0.075, g: 0.094, b: 0.129 }, // #131821
                      opacity: fill.opacity !== undefined ? fill.opacity : 1,
                    };
                  }
                  return fill;
                });
                node.fills = fills;
              }
              if ("children" in node) {
                for (const child of node.children) {
                  setColor(child);
                }
              }
            };
            setColor(instance);

            frame.appendChild(instance);
          }
        }

        const filled = variants.find(
          (v) => extractIconSize(v.name) === size && isFilledVariant(v.name),
        );
        if (filled) {
          const node = await figma.getNodeByIdAsync(filled.id);
          if (node && node.type === "COMPONENT") {
            const instance = node.createInstance();
            let filename = `db_ic_${category}_${iconName}_${size}_filled.svg`;
            instance.name = `marketingportal/${cleanFilename(filename)}`;

            // First detach all variable bindings
            detachVariables(instance);

            // Then set color to #131821 on all vector nodes
            const setColor = (node: SceneNode) => {
              if (
                "fills" in node &&
                node.fills !== figma.mixed &&
                Array.isArray(node.fills)
              ) {
                const fills = node.fills.map((fill) => {
                  if (fill.type === "SOLID") {
                    return {
                      type: "SOLID" as const,
                      color: { r: 0.075, g: 0.094, b: 0.129 }, // #131821
                      opacity: fill.opacity !== undefined ? fill.opacity : 1,
                    };
                  }
                  return fill;
                });
                node.fills = fills;
              }
              if ("children" in node) {
                for (const child of node.children) {
                  setColor(child);
                }
              }
            };
            setColor(instance);

            frame.appendChild(instance);
          }
        }
      } else {
        const icon = variants[0];
        const node = await figma.getNodeByIdAsync(icon.id);
        if (node && node.type === "COMPONENT") {
          const instance = node.createInstance();
          let filename = `db_ic_il_${category}_${iconName}.svg`;
          instance.name = `marketingportal/${cleanFilename(filename)}`;

          // Detach all variable bindings
          detachVariables(instance);

          // Set colors for Base (#131821) and Pulse (#ec0016) layers
          const baseLayer = instance.findOne((n) => n.name === "Base");
          if (baseLayer && "fills" in baseLayer) {
            if (
              baseLayer.fills !== figma.mixed &&
              Array.isArray(baseLayer.fills)
            ) {
              const fills = baseLayer.fills.map((fill) => {
                if (fill.type === "SOLID") {
                  return {
                    type: "SOLID" as const,
                    color: { r: 0.075, g: 0.094, b: 0.129 }, // #131821
                    opacity: fill.opacity !== undefined ? fill.opacity : 1,
                  };
                }
                return fill;
              });
              baseLayer.fills = fills;
            }
          }

          const pulseLayer = instance.findOne((n) => n.name === "Pulse");
          if (pulseLayer && "fills" in pulseLayer) {
            if (
              pulseLayer.fills !== figma.mixed &&
              Array.isArray(pulseLayer.fills)
            ) {
              const fills = pulseLayer.fills.map((fill) => {
                if (fill.type === "SOLID") {
                  return {
                    type: "SOLID" as const,
                    color: { r: 0.925, g: 0, b: 0.086 }, // #ec0016
                    opacity: fill.opacity !== undefined ? fill.opacity : 1,
                  };
                }
                return fill;
              });
              pulseLayer.fills = fills;
            }
          }

          frame.appendChild(instance);
        }
      }
    }
  }

  return frame;
}

export async function updateOverviewPage(
  addedIcons: IconData[],
  allIcons: IconData[],
  iconType: string,
) {
  const overviewPage = figma.root.children.find((page) =>
    page.name.includes("Overview"),
  );

  if (!overviewPage) {
    console.warn("⚠️ Overview-Seite nicht gefunden");
    return;
  }

  await overviewPage.loadAsync();

  // Gruppiere nach Icon-Set (nicht nach einzelnen Varianten)
  const uniqueIconSets = new Map<string, IconData>();
  addedIcons.forEach((icon) => {
    const baseName = extractIconBaseName(icon.name);
    if (!uniqueIconSets.has(baseName)) {
      uniqueIconSets.set(baseName, icon);
    }
  });

  const iconsByCategory = new Map<string, IconData[]>();
  uniqueIconSets.forEach((icon) => {
    if (!iconsByCategory.has(icon.category)) {
      iconsByCategory.set(icon.category, []);
    }
    iconsByCategory.get(icon.category)!.push(icon);
  });

  for (const [category, icons] of iconsByCategory) {
    const categoryFrame = overviewPage.findOne(
      (node) =>
        node.type === "FRAME" && node.name.includes(`${category} Icons`),
    ) as FrameNode | null;

    if (!categoryFrame) {
      console.warn(`⚠️ Frame "${category} Icons" nicht gefunden`);
      continue;
    }

    const sortedIcons = icons.sort((a, b) =>
      extractIconBaseName(a.name).localeCompare(extractIconBaseName(b.name)),
    );

    for (const icon of sortedIcons) {
      const baseName = extractIconBaseName(icon.name);

      // Für funktionale Icons: Finde 24px outlined Variante
      // Für illustrative Icons: Nimm das Icon direkt (keine Varianten)
      let iconToAdd: IconData | null = null;

      if (iconType === "functional") {
        iconToAdd =
          allIcons.find(
            (i) =>
              extractIconBaseName(i.name) === baseName &&
              extractIconSize(i.name) === 24 &&
              !isFilledVariant(i.name),
          ) || null;

        if (!iconToAdd) {
          console.warn(`   ⚠️ Keine 24px Variante gefunden für: ${baseName}`);
          continue;
        }
      } else {
        // Illustrative: Nimm das Icon direkt
        iconToAdd = icon;
      }

      // Prüfe ob Icon bereits vorhanden ist
      const existingInstances = categoryFrame.findAll(
        (node) => node.type === "INSTANCE",
      ) as InstanceNode[];

      let alreadyExists = false;
      for (const inst of existingInstances) {
        const mainComp = await inst.getMainComponentAsync();
        if (mainComp?.id === iconToAdd.id) {
          alreadyExists = true;
          break;
        }
      }

      if (alreadyExists) {
        console.log(`   ⏭️ Icon bereits vorhanden, überspringe: ${baseName}`);
        continue;
      }

      const node = await figma.getNodeByIdAsync(iconToAdd.id);
      if (node && node.type === "COMPONENT") {
        const instance = node.createInstance();
        categoryFrame.appendChild(instance);
        console.log(`   ✅ Icon hinzugefügt: ${baseName}`);
      }
    }
  }
}

async function findVariantBySize(
  icon: IconData,
  size: number,
  page: PageNode,
): Promise<IconData | null> {
  const baseName = extractIconBaseName(icon.name);
  const allComponents = page.findAll(
    (node) => node.type === "COMPONENT",
  ) as ComponentNode[];

  for (const comp of allComponents) {
    if (
      extractIconBaseName(comp.name) === baseName &&
      extractIconSize(comp.name) === size &&
      !isFilledVariant(comp.name)
    ) {
      return {
        name: comp.name,
        id: comp.id,
        category: icon.category,
        description: icon.description,
        parsedDescription: icon.parsedDescription,
      };
    }
  }
  return null;
}

export async function createChangelogFrame(
  version: string,
  iconsByStatus: Map<ChangelogStatus, IconData[]>,
  allIcons: IconData[],
) {
  const changelogPage = figma.root.children.find((page) =>
    page.name.includes("Changelog"),
  );

  if (!changelogPage) {
    console.warn("⚠️ Changelog-Seite nicht gefunden");
    return;
  }

  await changelogPage.loadAsync();

  const tagComponent = await figma.importComponentByKeyAsync(TAG_COMPONENT_KEY);

  const existingFrames = changelogPage.findAll(
    (node) => node.type === "FRAME" && node.parent === changelogPage,
  ) as FrameNode[];

  let yPosition = 0;
  if (existingFrames.length > 0) {
    const lastFrame = existingFrames.reduce((prev, curr) =>
      curr.y + curr.height > prev.y + prev.height ? curr : prev,
    );
    yPosition = lastFrame.y + lastFrame.height + 48;
  }

  const versionFrame = figma.createFrame();
  versionFrame.name = `v${version}`;
  versionFrame.x = 0;
  versionFrame.y = yPosition;
  versionFrame.layoutMode = "VERTICAL";
  versionFrame.primaryAxisSizingMode = "AUTO";
  versionFrame.counterAxisSizingMode = "FIXED";
  versionFrame.cornerRadius = 8;
  versionFrame.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  versionFrame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  versionFrame.clipsContent = false;

  await bindChangelogFrameVariables(versionFrame);

  const headline = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  headline.name = "Changelog Version";
  headline.characters = `v${version}`;
  await bindChangelogHeadlineVariables(headline);
  versionFrame.appendChild(headline);

  for (const [status, icons] of iconsByStatus) {
    if (icons.length === 0) continue;

    const statusFrame = figma.createFrame();
    statusFrame.name = `Changelog - ${STATUS_CONFIG[status].label}`;
    statusFrame.layoutMode = "VERTICAL";
    statusFrame.primaryAxisSizingMode = "AUTO";
    statusFrame.counterAxisSizingMode = "AUTO";
    statusFrame.counterAxisAlignItems = "MIN";
    statusFrame.paddingTop = 0;
    statusFrame.paddingBottom = 0;
    statusFrame.paddingLeft = 0;
    statusFrame.paddingRight = 0;
    statusFrame.fills = [];
    statusFrame.layoutAlign = "STRETCH";
    statusFrame.clipsContent = false;

    await bindChangelogStatusFrameVariables(statusFrame);

    if (tagComponent) {
      const tagInstance = tagComponent.createInstance();

      // Set properties based on status
      const statusProps = {
        feat: { text: "⭐️ feat", semantic: "Successful" },
        fix: { text: "🪲 fix", semantic: "Warning" },
        refactor: { text: "🔁 refactor", semantic: "Informational" },
        docs: { text: "📝 docs", semantic: "Informational" },
        chore: { text: "🔧 chore", semantic: "Informational" },
        deprecated: { text: "⚠️ deprecated", semantic: "Critical" },
      };

      const props = statusProps[status];
      if (props) {
        tagInstance.setProperties({
          Semantic: props.semantic,
          "✏️ Text#498:799": props.text,
        });
      }

      statusFrame.appendChild(tagInstance);
    }

    // Create Icons Container Frame
    const iconsContainer = figma.createFrame();
    iconsContainer.name = `Icons - ${STATUS_CONFIG[status].label}`;
    iconsContainer.layoutMode = "HORIZONTAL";
    iconsContainer.primaryAxisSizingMode = "FIXED";
    iconsContainer.counterAxisSizingMode = "AUTO";
    iconsContainer.primaryAxisAlignItems = "MIN";
    iconsContainer.counterAxisAlignItems = "MIN";
    iconsContainer.layoutWrap = "WRAP";
    iconsContainer.paddingTop = 0;
    iconsContainer.paddingBottom = 0;
    iconsContainer.paddingLeft = 0;
    iconsContainer.paddingRight = 0;
    iconsContainer.fills = [];
    iconsContainer.layoutAlign = "STRETCH";
    iconsContainer.layoutGrow = 0;
    iconsContainer.clipsContent = false;

    await bindChangelogIconsContainerVariables(iconsContainer);

    const sortedIcons = icons.sort((a, b) =>
      extractIconBaseName(a.name).localeCompare(extractIconBaseName(b.name)),
    );

    for (const icon of sortedIcons) {
      // Finde die 32px outlined Variante in allen Icons
      const baseName = extractIconBaseName(icon.name);
      const size32Icon = allIcons.find(
        (i) =>
          extractIconBaseName(i.name) === baseName &&
          extractIconSize(i.name) === 32 &&
          !isFilledVariant(i.name),
      );

      const iconToAdd = size32Icon || icon;
      const node = await figma.getNodeByIdAsync(iconToAdd.id);
      if (node && node.type === "COMPONENT") {
        const instance = node.createInstance();
        iconsContainer.appendChild(instance);
      }
    }

    statusFrame.appendChild(iconsContainer);
    versionFrame.appendChild(statusFrame);
  }

  changelogPage.appendChild(versionFrame);
}
