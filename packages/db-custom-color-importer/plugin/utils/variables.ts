import { ColorData } from "../types";
import { MAPPINGS } from "../config";
import { hexToRgba, areColorsEqual } from "./color";
import { deleteCollections } from "./cleanup";
import { getOrCreateCollections, setupDisplayModes, setupColorModes } from "./collections";

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
  varMap: Map<string, Variable>
) {
  const baseMap: Record<string, string> = {};
  
  for (const family of colorFamilies) {
    const tokens = data.colors[family];
    for (const tokenKey in tokens) {
      const token = tokens[tokenKey];
      if (token && token.$value) {
        const varPath = `colors/${family}/${tokenKey}`;
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
  varMap: Map<string, Variable>
) {
  const displayVarMap: Record<string, string> = {};
  
  for (const family of colorFamilies) {
    for (const m of MAPPINGS) {
      const varPath = `${family}/${m.name}`;
      const lId = baseMap[`colors/${family}/${m.light}`];
      const dId = baseMap[`colors/${family}/${m.dark}`];

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
  varMap: Map<string, Variable>
) {
  for (const m of MAPPINGS) {
    const colorVarPath = `custom-adaptive/${m.name}`;
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
      const sourceId = displayVarMap[`${family}/${m.name}`];
      if (sourceId) {
        v.setValueForMode(colorFamilyModeIds[family], {
          type: "VARIABLE_ALIAS",
          id: sourceId,
        });
      }
    }
  }
}

export async function handleImportJson(msg: any) {
  try {
    const data = msg.data;
    const colorFamilies = Object.keys(data.colors);
    const deleteMissing = msg.deleteMissing;

    if (deleteMissing) {
      await deleteCollections();
    }

    const { baseCol, displayCol, colorCol } = await getOrCreateCollections();
    const baseModeId = baseCol.modes[0].modeId;
    const { lightModeId, darkModeId } = setupDisplayModes(displayCol);
    const { dbAdaptiveModeId, colorFamilyModeIds } = setupColorModes(colorCol, colorFamilies);

    const varMap = await getExistingVariablesMap();

    const baseMap = await createBaseVariables(data, colorFamilies, baseCol, baseModeId, varMap);
    const displayVarMap = await createDisplayModeVariables(colorFamilies, displayCol, lightModeId, darkModeId, baseMap, varMap);
    await createAdaptiveColorVariables(colorFamilies, colorCol, dbAdaptiveModeId, colorFamilyModeIds, displayVarMap, varMap);

    figma.notify(
      deleteMissing
        ? "All collections newly created"
        : "Variables synchronized"
    );

    figma.ui.postMessage(
      deleteMissing
        ? { feedback: "Success: All collections newly created" }
        : { feedback: "Success: Variables synchronized" }
    );
  } catch (e) {
    console.error(e);
    figma.notify("Error: " + (e as Error).message);
    figma.ui.postMessage({ feedback: "Error: " + e });
  }
}
