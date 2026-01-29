import { ColorData, ImportMessage } from "../types";
import { MAPPINGS } from "../config";
import { hexToRgba, areColorsEqual } from "./color";
import { deleteCollections } from "./cleanup";
import {
  getOrCreateCollections,
  setupDisplayModes,
  setupColorModes,
} from "./collections";

export async function getExistingVariablesMap() {
  const existingVars = await figma.variables.getLocalVariablesAsync();
  const varMap = new Map<string, Variable>();
  existingVars.forEach((v) => varMap.set(v.name, v));
  return varMap;
}

export async function createBaseVariables(
  data: ColorData,
  colorFamilies: string[],
  baseCol: VariableCollection,
  baseModeId: string,
  varMap: Map<string, Variable>,
  prefix: string,
) {
  const baseMap: Record<string, string> = {};

  for (const family of colorFamilies) {
    const tokens = data.colors[family];
    for (const tokenKey in tokens) {
      const token = tokens[tokenKey];
      if (token && token.$value) {
        // Check if family already starts with prefix to avoid duplication
        const familyWithPrefix = family
          .toLowerCase()
          .startsWith(prefix.toLowerCase() + "-")
          ? family
          : `${prefix}-${family}`;

        const varPath = `${prefix}-colors/${familyWithPrefix}/${tokenKey}`;
        let v = varMap.get(varPath);
        const newVal = hexToRgba(token.$value);

        if (v) {
          if (!areColorsEqual(v.valuesByMode[baseModeId], newVal))
            v.setValueForMode(baseModeId, newVal);
        } else {
          v = figma.variables.createVariable(varPath, baseCol, "COLOR");
          v.setValueForMode(baseModeId, newVal);
        }
        v.scopes = [];
        v.hiddenFromPublishing = true;
        baseMap[varPath] = v.id;
      }
    }
  }

  return baseMap;
}

export async function createDisplayModeVariables(
  colorFamilies: string[],
  displayCol: VariableCollection,
  lightModeId: string,
  darkModeId: string,
  baseMap: Record<string, string>,
  varMap: Map<string, Variable>,
  prefix: string,
) {
  const displayVarMap: Record<string, string> = {};

  for (const family of colorFamilies) {
    for (const m of MAPPINGS) {
      // Check if family already starts with prefix to avoid duplication
      const familyWithPrefix = family
        .toLowerCase()
        .startsWith(prefix.toLowerCase() + "-")
        ? family
        : `${prefix}-${family}`;

      const varPath = `${familyWithPrefix}/${m.name}`;
      const lId = baseMap[`${prefix}-colors/${familyWithPrefix}/${m.light}`];
      const dId = baseMap[`${prefix}-colors/${familyWithPrefix}/${m.dark}`];

      if (!lId && !dId) continue;

      let v = varMap.get(varPath);
      if (!v) {
        v = figma.variables.createVariable(varPath, displayCol, "COLOR");
      }
      if (lId)
        v.setValueForMode(lightModeId, { type: "VARIABLE_ALIAS", id: lId });
      if (dId)
        v.setValueForMode(darkModeId, { type: "VARIABLE_ALIAS", id: dId });

      v.scopes = [];
      v.hiddenFromPublishing = true;
      displayVarMap[varPath] = v.id;
    }
  }

  return displayVarMap;
}

export async function createAdaptiveColorVariables(
  colorFamilies: string[],
  colorCol: VariableCollection,
  dbAdaptiveModeId: string,
  colorFamilyModeIds: Record<string, string>,
  displayVarMap: Record<string, string>,
  varMap: Map<string, Variable>,
  prefix: string,
) {
  for (const m of MAPPINGS) {
    const colorVarPath = `${prefix}-adaptive/${m.name}`;
    let v = varMap.get(colorVarPath);

    if (!v) {
      v = figma.variables.createVariable(colorVarPath, colorCol, "COLOR");
    }

    v.hiddenFromPublishing = false;

    // Set scopes based on variable name
    if (m.name.startsWith("bg/") || m.name.startsWith("origin/")) {
      v.scopes = ["FRAME_FILL", "SHAPE_FILL"];
    } else if (m.name.startsWith("on-bg/") || m.name.startsWith("on-origin/")) {
      v.scopes = ["SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR", "EFFECT_COLOR"];
    }

    if (m.key) {
      try {
        const ext = await figma.variables.importVariableByKeyAsync(m.key);
        v.setValueForMode(dbAdaptiveModeId, {
          type: "VARIABLE_ALIAS",
          id: ext.id,
        });
      } catch (e) {
        console.warn(`Key ${m.key} für ${m.name} nicht gefunden.`);
      }
    }

    for (const family of colorFamilies) {
      // Check if family already starts with prefix to avoid duplication
      const familyWithPrefix = family
        .toLowerCase()
        .startsWith(prefix.toLowerCase() + "-")
        ? family
        : `${prefix}-${family}`;

      const sourceId = displayVarMap[`${familyWithPrefix}/${m.name}`];
      if (sourceId) {
        v.setValueForMode(colorFamilyModeIds[family], {
          type: "VARIABLE_ALIAS",
          id: sourceId,
        });
      }
    }
  }
}

export async function handleImportJson(msg: ImportMessage) {
  try {
    const data = msg.data;
    const colorFamilies = Object.keys(data.colors);
    const deleteMissing = msg.deleteMissing;
    const fileName = msg.fileName || "";
    const customPrefix = msg.customPrefix;

    // Use custom prefix if provided, otherwise extract from filename
    let prefix = "custom";
    let prefixOriginal = "custom"; // Keep original casing for collection names

    if (customPrefix) {
      // Use the prefix confirmed by the user
      prefixOriginal = customPrefix;
      prefix = customPrefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    } else if (fileName) {
      // Fallback: Extract prefix from filename (legacy behavior)
      const nameWithoutExt = fileName.replace(/\.json$/i, "");
      const knownPrefixes = ["DB", "Whitelabel", "S-Bahn", "sab"];
      const regexWithMiddle = new RegExp(
        `^(${knownPrefixes.join("|")})[-\\s]+(.+?)Theme-figma`,
        "i",
      );
      const regexDirect = new RegExp(
        `^(${knownPrefixes.join("|")})[-\\s]+Theme-figma`,
        "i",
      );

      const matchWithMiddle = nameWithoutExt.match(regexWithMiddle);
      const matchDirect = nameWithoutExt.match(regexDirect);

      if (matchWithMiddle && matchWithMiddle[2]) {
        prefixOriginal = matchWithMiddle[2].trim();
      } else if (matchDirect && matchDirect[1]) {
        prefixOriginal = matchDirect[1];
      }

      prefix = prefixOriginal.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    }

    // Fallback to "custom" if empty
    if (!prefix) {
      prefix = "custom";
      prefixOriginal = "custom";
    }

    if (deleteMissing) {
      await deleteCollections();
    }

    const { baseCol, displayCol, colorCol } =
      await getOrCreateCollections(prefixOriginal);
    const baseModeId = baseCol.modes[0].modeId;
    const { lightModeId, darkModeId } = setupDisplayModes(displayCol, baseCol);
    const { dbAdaptiveModeId, colorFamilyModeIds } = setupColorModes(
      colorCol,
      colorFamilies,
      prefix,
    );

    const varMap = await getExistingVariablesMap();

    const baseMap = await createBaseVariables(
      data,
      colorFamilies,
      baseCol,
      baseModeId,
      varMap,
      prefix,
    );
    const displayVarMap = await createDisplayModeVariables(
      colorFamilies,
      displayCol,
      lightModeId,
      darkModeId,
      baseMap,
      varMap,
      prefix,
    );
    await createAdaptiveColorVariables(
      colorFamilies,
      colorCol,
      dbAdaptiveModeId,
      colorFamilyModeIds,
      displayVarMap,
      varMap,
      prefix,
    );

    figma.notify(
      deleteMissing
        ? "All collections newly created"
        : "Variables synchronized",
    );

    figma.ui.postMessage(
      deleteMissing
        ? { feedback: "Success: All collections newly created" }
        : { feedback: "Success: Variables synchronized" },
    );
  } catch (e) {
    console.error(e);
    figma.notify("Error: " + (e as Error).message);
    figma.ui.postMessage({ feedback: "Error: " + e });
  }
}
