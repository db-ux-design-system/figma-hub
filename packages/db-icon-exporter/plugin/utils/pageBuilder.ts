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
} from "./variablesBinder";

export async function buildGitLabFrame(
  selectedIcons: IconData[],
  iconType: string,
  allIcons: IconData[]
): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = "GitLab";
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = 16;

  const selectedBaseNames = new Set(
    selectedIcons.map((icon) => extractIconBaseName(icon.name))
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

  for (const [setName, variants] of iconSets) {
    const category = variants[0].category
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/&/g, "");
    const iconName = setName.toLowerCase().replace(/\s+/g, "-");

    for (const size of sizes) {
      if (iconType === "functional") {
        const outlined = variants.find(
          (v) => extractIconSize(v.name) === size && !isFilledVariant(v.name)
        );
        if (outlined) {
          const node = await figma.getNodeByIdAsync(outlined.id);
          if (node && node.type === "COMPONENT") {
            const instance = node.createInstance();
            instance.name = `${category}/${iconName}/outlined/${size}.svg`;
            frame.appendChild(instance);
          }
        }

        const filled = variants.find(
          (v) => extractIconSize(v.name) === size && isFilledVariant(v.name)
        );
        if (filled) {
          const node = await figma.getNodeByIdAsync(filled.id);
          if (node && node.type === "COMPONENT") {
            const instance = node.createInstance();
            instance.name = `${category}/${iconName}/filled/${size}.svg`;
            frame.appendChild(instance);
          }
        }
      } else {
        const icon = variants[0];
        const node = await figma.getNodeByIdAsync(icon.id);
        if (node && node.type === "COMPONENT") {
          const instance = node.createInstance();
          instance.name = `db_ic_il_${category}_${iconName}.svg`;
          frame.appendChild(instance);
        }
      }
    }
  }

  return frame;
}

export async function buildMarketingFrame(
  selectedIcons: IconData[],
  iconType: string,
  allIcons: IconData[]
): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = "Export_Icon_UPDATE";
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = 16;

  const selectedBaseNames = new Set(
    selectedIcons.map((icon) => extractIconBaseName(icon.name))
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

  for (const [setName, variants] of iconSets) {
    const category = variants[0].category
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/&/g, "");
    const iconName = setName.toLowerCase().replace(/\s+/g, "_");

    for (const size of sizes) {
      if (iconType === "functional") {
        const outlined = variants.find(
          (v) => extractIconSize(v.name) === size && !isFilledVariant(v.name)
        );
        if (outlined) {
          const node = await figma.getNodeByIdAsync(outlined.id);
          if (node && node.type === "COMPONENT") {
            const instance = node.createInstance();
            let filename = `db_ic_${category}_${iconName}_${size}.svg`;
            instance.name = cleanFilename(filename);
            frame.appendChild(instance);
          }
        }

        const filled = variants.find(
          (v) => extractIconSize(v.name) === size && isFilledVariant(v.name)
        );
        if (filled) {
          const node = await figma.getNodeByIdAsync(filled.id);
          if (node && node.type === "COMPONENT") {
            const instance = node.createInstance();
            let filename = `db_ic_${category}_${iconName}_${size}_filled.svg`;
            instance.name = cleanFilename(filename);
            frame.appendChild(instance);
          }
        }
      } else {
        const icon = variants[0];
        const node = await figma.getNodeByIdAsync(icon.id);
        if (node && node.type === "COMPONENT") {
          const instance = node.createInstance();
          let filename = `db_ic_il_${category}_${iconName}.svg`;
          instance.name = cleanFilename(filename);
          frame.appendChild(instance);
        }
      }
    }
  }

  return frame;
}

export async function updateOverviewPage(addedIcons: IconData[], allIcons: IconData[]) {
  const overviewPage = figma.root.children.find((page) =>
    page.name.includes("Overview")
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
      (node) => node.type === "FRAME" && node.name.includes(`${category} Icons`)
    ) as FrameNode | null;

    if (!categoryFrame) {
      console.warn(`⚠️ Frame "${category} Icons" nicht gefunden`);
      continue;
    }

    const sortedIcons = icons.sort((a, b) =>
      extractIconBaseName(a.name).localeCompare(extractIconBaseName(b.name))
    );

    for (const icon of sortedIcons) {
      // Finde die 24px outlined Variante in allen Icons
      const baseName = extractIconBaseName(icon.name);
      const size24Icon = allIcons.find(
        (i) =>
          extractIconBaseName(i.name) === baseName &&
          extractIconSize(i.name) === 24 &&
          !isFilledVariant(i.name)
      );

      if (!size24Icon) {
        console.warn(`   ⚠️ Keine 24px Variante gefunden für: ${baseName}`);
        continue;
      }

      // Prüfe ob Icon bereits vorhanden ist
      const existingInstances = categoryFrame.findAll(
        (node) => node.type === "INSTANCE"
      ) as InstanceNode[];
      
      let alreadyExists = false;
      for (const inst of existingInstances) {
        const mainComp = await inst.getMainComponentAsync();
        if (mainComp?.id === size24Icon.id) {
          alreadyExists = true;
          break;
        }
      }

      if (alreadyExists) {
        console.log(`   ⏭️ Icon bereits vorhanden, überspringe: ${baseName}`);
        continue;
      }

      const node = await figma.getNodeByIdAsync(size24Icon.id);
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
  page: PageNode
): Promise<IconData | null> {
  const baseName = extractIconBaseName(icon.name);
  const allComponents = page.findAll(
    (node) => node.type === "COMPONENT"
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
  allIcons: IconData[]
) {
  const changelogPage = figma.root.children.find((page) =>
    page.name.includes("Changelog")
  );

  if (!changelogPage) {
    console.warn("⚠️ Changelog-Seite nicht gefunden");
    return;
  }

  await changelogPage.loadAsync();

  const tagComponent = await figma.importComponentByKeyAsync(TAG_COMPONENT_KEY);

  const existingFrames = changelogPage.findAll(
    (node) => node.type === "FRAME" && node.parent === changelogPage
  ) as FrameNode[];

  let yPosition = 0;
  if (existingFrames.length > 0) {
    const lastFrame = existingFrames.reduce((prev, curr) =>
      curr.y + curr.height > prev.y + prev.height ? curr : prev
    );
    yPosition = lastFrame.y + lastFrame.height + 48;
  }

  const versionFrame = figma.createFrame();
  versionFrame.name = `v${version}`;
  versionFrame.x = 0;
  versionFrame.y = yPosition;
  versionFrame.layoutMode = "VERTICAL";
  versionFrame.primaryAxisSizingMode = "AUTO";
  versionFrame.counterAxisSizingMode = "AUTO";
  versionFrame.itemSpacing = 32;
  versionFrame.paddingTop = 48;
  versionFrame.paddingBottom = 48;
  versionFrame.paddingLeft = 48;
  versionFrame.paddingRight = 48;
  versionFrame.cornerRadius = 8;
  versionFrame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  versionFrame.strokes = [
    { type: "SOLID", color: { r: 0.76, g: 0.78, b: 0.81 } },
  ];
  versionFrame.strokeWeight = 1;

  await bindChangelogFrameVariables(versionFrame);

  const headline = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  headline.characters = `v${version}`;
  headline.fontSize = 24;
  await bindChangelogHeadlineVariables(headline);
  versionFrame.appendChild(headline);

  for (const [status, icons] of iconsByStatus) {
    if (icons.length === 0) continue;

    const statusFrame = figma.createFrame();
    statusFrame.name = `Changelog - ${STATUS_CONFIG[status].label}`;
    statusFrame.layoutMode = "HORIZONTAL";
    statusFrame.primaryAxisSizingMode = "AUTO";
    statusFrame.counterAxisSizingMode = "AUTO";
    statusFrame.counterAxisAlignItems = "CENTER";
    statusFrame.itemSpacing = 16;
    statusFrame.paddingTop = 0;
    statusFrame.paddingBottom = 0;
    statusFrame.paddingLeft = 0;
    statusFrame.paddingRight = 0;
    statusFrame.fills = [];
    statusFrame.layoutAlign = "MIN";

    await bindChangelogStatusFrameVariables(statusFrame);

    if (tagComponent) {
      const tagInstance = tagComponent.createInstance();
      
      // Set properties based on status
      const statusProps = {
        added: { text: "⭐️ added", semantic: "Successful" },
        fixed: { text: "🪲 fixed", semantic: "Warning" },
        changed: { text: "🔁 changed", semantic: "Informational" },
        deprecated: { text: "⚠️ deprecated", semantic: "Critical" }
      };
      
      const props = statusProps[status];
      if (props) {
        tagInstance.setProperties({ 
          Semantic: props.semantic,
          "✏️ Text#498:799": props.text 
        });
      }
      
      statusFrame.appendChild(tagInstance);
    }

    const sortedIcons = icons.sort((a, b) =>
      extractIconBaseName(a.name).localeCompare(extractIconBaseName(b.name))
    );

    for (const icon of sortedIcons) {
      // Finde die 32px outlined Variante in allen Icons
      const baseName = extractIconBaseName(icon.name);
      const size32Icon = allIcons.find(
        (i) =>
          extractIconBaseName(i.name) === baseName &&
          extractIconSize(i.name) === 32 &&
          !isFilledVariant(i.name)
      );

      const iconToAdd = size32Icon || icon;
      const node = await figma.getNodeByIdAsync(iconToAdd.id);
      if (node && node.type === "COMPONENT") {
        const instance = node.createInstance();
        statusFrame.appendChild(instance);
      }
    }

    versionFrame.appendChild(statusFrame);
  }

  changelogPage.appendChild(versionFrame);
}
