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
        // Create a completely new paint object without any bindings
        newFills.push({
          type: "SOLID",
          color: { r: fill.color.r, g: fill.color.g, b: fill.color.b },
          opacity: fill.opacity !== undefined ? fill.opacity : 1,
        });
      } else {
        newFills.push(fill);
      }
    }
    // Set to empty first to break bindings, then set new fills
    node.fills = [];
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
    node.strokes = [];
    node.strokes = newStrokes;
  }

  // Recursively process all children
  if ("children" in node) {
    for (const child of node.children) {
      detachVariables(child);
    }
  }
}

// Helper function to recursively detach all variable bindings and set colors
function detachAndSetColors(
  node: SceneNode,
  colorMode:
    | "gitlab-functional"
    | "marketing-functional"
    | "gitlab-illustrative"
    | "marketing-illustrative",
) {
  // First, try to unbind variables at the node level
  if ("setBoundVariable" in node) {
    try {
      (node as any).setBoundVariable("fills", null);
    } catch (e) {
      // Ignore if not supported
    }
  }

  // Process fills recursively
  if ("fills" in node) {
    try {
      const currentFills = node.fills;
      if (
        currentFills !== figma.mixed &&
        Array.isArray(currentFills) &&
        currentFills.length > 0
      ) {
        const newFills: SolidPaint[] = [];

        for (const fill of currentFills) {
          if (fill.type === "SOLID") {
            const actualColor = fill.color;
            let targetColor = {
              r: actualColor.r,
              g: actualColor.g,
              b: actualColor.b,
            };

            // For functional icons, always use black
            if (colorMode === "gitlab-functional") {
              targetColor = { r: 0.086, g: 0.094, b: 0.106 }; // #16181B
            } else if (colorMode === "marketing-functional") {
              targetColor = { r: 0.075, g: 0.094, b: 0.129 }; // #131821
            } else {
              // For illustrative icons, map based on current color value
              if (colorMode === "gitlab-illustrative") {
                if (isColorClose(actualColor, { r: 0.925, g: 0, b: 0.086 })) {
                  targetColor = { r: 0.925, g: 0, b: 0.086 }; // #EC0016
                } else if (
                  isColorClose(actualColor, { r: 0.388, g: 0.651, b: 0.082 })
                ) {
                  targetColor = { r: 0.376, g: 0.631, b: 0.078 }; // #60A114
                } else {
                  targetColor = { r: 0.086, g: 0.094, b: 0.106 }; // #16181B
                }
              } else if (colorMode === "marketing-illustrative") {
                if (isColorClose(actualColor, { r: 0.925, g: 0, b: 0.086 })) {
                  targetColor = { r: 0.925, g: 0, b: 0.086 }; // #EC0016
                } else if (
                  isColorClose(actualColor, { r: 0.388, g: 0.651, b: 0.082 })
                ) {
                  targetColor = { r: 0.388, g: 0.651, b: 0.082 }; // #63A615
                } else {
                  targetColor = { r: 0.075, g: 0.094, b: 0.129 }; // #131821
                }
              }
            }

            newFills.push({
              type: "SOLID",
              color: targetColor,
              opacity: fill.opacity ?? 1,
              visible: fill.visible ?? true,
              blendMode: fill.blendMode ?? "NORMAL",
            });
          }
        }

        // Try to break variable bindings
        try {
          if ("boundVariables" in node && node.boundVariables) {
            try {
              // @ts-ignore
              node.boundVariables = {};
            } catch (e) {
              // Ignore
            }
          }

          node.fills = [];
          node.fills = newFills;

          if ("boundVariables" in node && node.boundVariables) {
            try {
              // @ts-ignore
              node.boundVariables = {};
            } catch (e) {
              // Ignore
            }
          }
        } catch (e) {
          // Ignore
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  // Process strokes
  if ("strokes" in node) {
    try {
      if ("setBoundVariable" in node) {
        try {
          (node as any).setBoundVariable("strokes", null);
        } catch (e) {
          // Ignore
        }
      }

      const currentStrokes = node.strokes;
      if (currentStrokes !== figma.mixed && Array.isArray(currentStrokes)) {
        const newStrokes: SolidPaint[] = [];

        for (const stroke of currentStrokes) {
          if (stroke.type === "SOLID") {
            let targetColor = { ...stroke.color };

            if (colorMode === "gitlab-functional") {
              targetColor = { r: 0.086, g: 0.094, b: 0.106 };
            } else if (colorMode === "marketing-functional") {
              targetColor = { r: 0.075, g: 0.094, b: 0.129 };
            } else {
              if (colorMode === "gitlab-illustrative") {
                if (isColorClose(stroke.color, { r: 0.925, g: 0, b: 0.086 })) {
                  targetColor = { r: 0.925, g: 0, b: 0.086 };
                } else if (
                  isColorClose(stroke.color, { r: 0.388, g: 0.651, b: 0.082 })
                ) {
                  targetColor = { r: 0.376, g: 0.631, b: 0.078 };
                } else {
                  targetColor = { r: 0.086, g: 0.094, b: 0.106 };
                }
              } else if (colorMode === "marketing-illustrative") {
                if (isColorClose(stroke.color, { r: 0.925, g: 0, b: 0.086 })) {
                  targetColor = { r: 0.925, g: 0, b: 0.086 };
                } else if (
                  isColorClose(stroke.color, { r: 0.388, g: 0.651, b: 0.082 })
                ) {
                  targetColor = { r: 0.388, g: 0.651, b: 0.082 };
                } else {
                  targetColor = { r: 0.075, g: 0.094, b: 0.129 };
                }
              }
            }

            newStrokes.push({
              type: "SOLID",
              color: targetColor,
              opacity: stroke.opacity ?? 1,
              visible: stroke.visible ?? true,
              blendMode: stroke.blendMode ?? "NORMAL",
            });
          }
        }

        node.strokes = newStrokes;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Recursively process all children
  if ("children" in node) {
    for (const child of node.children) {
      detachAndSetColors(child, colorMode);
    }
  }
}

// Helper to check if two colors are close (within tolerance)
function isColorClose(
  color1: RGB,
  color2: RGB,
  tolerance: number = 0.05,
): boolean {
  return (
    Math.abs(color1.r - color2.r) < tolerance &&
    Math.abs(color1.g - color2.g) < tolerance &&
    Math.abs(color1.b - color2.b) < tolerance
  );
}

export async function buildGitLabFrame(
  selectedIcons: IconData[],
  iconType: string,
  allIcons: IconData[],
): Promise<FrameNode[]> {
  console.log(
    `🚀 buildGitLabFrame called with ${selectedIcons.length} icons, type: ${iconType}`,
  );

  // Group icons by package
  const packageGroups = groupByPackage(selectedIcons);
  const frames: FrameNode[] = [];

  // Create a frame for each package
  for (const [packageName, packageIcons] of packageGroups) {
    console.log(`📦 Creating frame for package: ${packageName}`);
    const frame = figma.createFrame();

    // Add package name to frame title for functional icons
    if (iconType === "functional") {
      frame.name = `GitLab Export - ${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`;
    } else {
      frame.name = `GitLab Export`;
    }

    frame.layoutMode = "HORIZONTAL";
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
    frame.itemSpacing = 16;

    // Remove background
    frame.fills = [];
    frame.backgrounds = [];

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

    // Sortiere Icon-Sets alphabetisch nach Kategorie, dann nach Icon-Name
    const sortedIconSets = Array.from(iconSets.entries()).sort((a, b) => {
      const categoryA = a[1][0].category
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/&/g, "");
      const categoryB = b[1][0].category
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/&/g, "");

      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }
      return a[0].localeCompare(b[0]);
    });

    for (const [setName, variants] of sortedIconSets) {
      if (variants.length === 0) continue;

      const category = variants[0].category
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/&/g, "");
      const packageNameLower = variants[0].package.toLowerCase();
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
              instance.name = `gitlab/${packageNameLower}/${category}/${iconName}/outlined/${size}`;

              // Detach variables and set all colors to #16181B
              detachAndSetColors(instance, "gitlab-functional");

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
              instance.name = `gitlab/${packageNameLower}/${category}/${iconName}/filled/${size}`;

              // Detach variables and set all colors to #16181B
              detachAndSetColors(instance, "gitlab-functional");

              frame.appendChild(instance);
            }
          }
        } else {
          const icon = variants[0];
          const node = await figma.getNodeByIdAsync(icon.id);
          if (node && node.type === "COMPONENT") {
            const instance = node.createInstance();
            instance.name = `gitlab/${category}/${iconName}`;

            // Detach variables and map colors for illustrative icons
            detachAndSetColors(instance, "gitlab-illustrative");

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
  frame.name = "Marketingportal";
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = 16;

  // Remove background
  frame.fills = [];
  frame.backgrounds = [];

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

  // Sortiere Icon-Sets alphabetisch nach vollständigem Namen (Kategorie + Icon-Name)
  const sortedIconSets = Array.from(iconSets.entries()).sort((a, b) => {
    const categoryA =
      a[1][0]?.category.toLowerCase().replace(/\s+/g, "_").replace(/&/g, "") ||
      "";
    const categoryB =
      b[1][0]?.category.toLowerCase().replace(/\s+/g, "_").replace(/&/g, "") ||
      "";
    const fullNameA = `${categoryA}_${a[0]}`;
    const fullNameB = `${categoryB}_${b[0]}`;
    return fullNameA.localeCompare(fullNameB);
  });

  for (const [setName, variants] of sortedIconSets) {
    if (variants.length === 0) continue;

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
            let filename = `db_ic_${category}_${iconName}_${size}`;
            instance.name = `Export_Icon/${cleanFilename(filename)}`;

            // Detach variables and set all colors to #131821
            detachAndSetColors(instance, "marketing-functional");

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
            let filename = `db_ic_${category}_${iconName}_${size}_filled`;
            instance.name = `Export_Icon/${cleanFilename(filename)}`;

            // Detach variables and set all colors to #131821
            detachAndSetColors(instance, "marketing-functional");

            frame.appendChild(instance);
          }
        }
      } else {
        const icon = variants[0];
        const node = await figma.getNodeByIdAsync(icon.id);
        if (node && node.type === "COMPONENT") {
          const instance = node.createInstance();
          let filename = `db_ic_il_${category}_${iconName}`;
          const targetName = `Export_Icon/${cleanFilename(filename)}`;

          instance.name = targetName;

          // Detach variables and map colors for illustrative icons
          detachAndSetColors(instance, "marketing-illustrative");

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
        // console.log(`   ⏭️ Icon bereits vorhanden, überspringe: ${baseName}`);
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
