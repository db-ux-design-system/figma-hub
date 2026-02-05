import { ColorData, ImportMessage } from "../types";
import { MAPPINGS, getScopesForMapping, MESSAGES } from "../config";
import { hexToRgba, areColorsEqual } from "./color";
import { deleteCollections } from "./cleanup";
import {
  getOrCreateCollections,
  setupDisplayModes,
  setupColorModes,
} from "./collections";
import { log } from "./logger";

/**
 * Helper function to ensure family name has the correct prefix
 */
function ensurePrefixedFamily(family: string, prefix: string): string {
  return family.toLowerCase().startsWith(prefix.toLowerCase() + "-")
    ? family
    : `${prefix}-${family}`;
}

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
  log.subsection("Creating Base Variables");
  const baseMap: Record<string, string> = {};
  let createdCount = 0;
  let updatedCount = 0;

  for (const family of colorFamilies) {
    const tokens = data.colors[family];
    for (const tokenKey in tokens) {
      const token = tokens[tokenKey];
      if (token && token.$value) {
        const familyWithPrefix = ensurePrefixedFamily(family, prefix);

        const varPath = `${prefix}-colors/${familyWithPrefix}/${tokenKey}`;
        let v = varMap.get(varPath);
        const newVal = hexToRgba(token.$value);

        if (v) {
          if (!areColorsEqual(v.valuesByMode[baseModeId], newVal)) {
            v.setValueForMode(baseModeId, newVal);
            updatedCount++;
          }
        } else {
          v = figma.variables.createVariable(varPath, baseCol, "COLOR");
          v.setValueForMode(baseModeId, newVal);
          createdCount++;
        }
        v.scopes = [];
        v.hiddenFromPublishing = true;
        baseMap[varPath] = v.id;
      }
    }
  }

  log.info(`Created ${createdCount} new base variables`, "createBaseVariables");
  log.info(
    `Updated ${updatedCount} existing base variables`,
    "createBaseVariables",
  );
  log.success(
    `Processed ${Object.keys(baseMap).length} base variables`,
    "createBaseVariables",
  );

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
  log.subsection("Creating Display Mode Variables");
  const displayVarMap: Record<string, string> = {};
  let createdCount = 0;

  for (const family of colorFamilies) {
    for (const m of MAPPINGS) {
      const familyWithPrefix = ensurePrefixedFamily(family, prefix);

      const varPath = `${familyWithPrefix}/${m.name}`;
      const lId = baseMap[`${prefix}-colors/${familyWithPrefix}/${m.light}`];
      const dId = baseMap[`${prefix}-colors/${familyWithPrefix}/${m.dark}`];

      if (!lId && !dId) continue;

      let v = varMap.get(varPath);
      if (!v) {
        v = figma.variables.createVariable(varPath, displayCol, "COLOR");
        createdCount++;
      }
      if (lId)
        v.setValueForMode(lightModeId, { type: "VARIABLE_ALIAS", id: lId });
      if (dId)
        v.setValueForMode(darkModeId, { type: "VARIABLE_ALIAS", id: dId });

      // Set scopes based on variable name
      v.scopes = getScopesForMapping(m.name);

      v.hiddenFromPublishing = true;
      displayVarMap[varPath] = v.id;
    }
  }

  log.info(
    `Created ${createdCount} new display mode variables`,
    "createDisplayModeVariables",
  );
  log.success(
    `Processed ${Object.keys(displayVarMap).length} display mode variables`,
    "createDisplayModeVariables",
  );

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
  log.subsection("Creating Adaptive Color Variables");
  let createdCount = 0;
  let linkedCount = 0;

  // Process all mappings in parallel
  const processingPromises = MAPPINGS.map(async (m) => {
    // First, try to find existing adaptive variable (with any prefix)
    const adaptivePattern = `-adaptive/${m.name}`;
    let v: Variable | undefined;
    let isNewVariable = false;

    // Search for existing variable ending with "-adaptive/..."
    for (const [varName, variable] of varMap.entries()) {
      if (varName.endsWith(adaptivePattern)) {
        v = variable;
        break;
      }
    }

    // If not found, create new one with current prefix
    if (!v) {
      const colorVarPath = `${prefix}-adaptive/${m.name}`;
      v = figma.variables.createVariable(colorVarPath, colorCol, "COLOR");
      isNewVariable = true;
      createdCount++;
    }

    v.hiddenFromPublishing = false;

    // Set scopes based on variable name
    v.scopes = getScopesForMapping(m.name);

    // Set db-adaptive mode if variable is new OR if it doesn't have a value yet
    if (m.key) {
      const hasDbAdaptiveValue = v.valuesByMode[dbAdaptiveModeId] !== undefined;

      if (isNewVariable || !hasDbAdaptiveValue) {
        try {
          const ext = await figma.variables.importVariableByKeyAsync(m.key);
          v.setValueForMode(dbAdaptiveModeId, {
            type: "VARIABLE_ALIAS",
            id: ext.id,
          });
          linkedCount++;
        } catch (e) {
          log.warn(
            MESSAGES.WARNING_KEY_NOT_FOUND(m.key, m.name),
            "createAdaptiveColorVariables",
          );
        }
      }
    }

    // Add new color family modes to the existing variable
    for (const family of colorFamilies) {
      const familyWithPrefix = ensurePrefixedFamily(family, prefix);

      const sourceId = displayVarMap[`${familyWithPrefix}/${m.name}`];
      if (sourceId) {
        v.setValueForMode(colorFamilyModeIds[family], {
          type: "VARIABLE_ALIAS",
          id: sourceId,
        });
      }
    }
  });

  // Wait for all mappings to be processed
  await Promise.all(processingPromises);

  log.info(
    `Created ${createdCount} new adaptive variables`,
    "createAdaptiveColorVariables",
  );
  log.info(
    `Linked ${linkedCount} variables to DB adaptive`,
    "createAdaptiveColorVariables",
  );
  log.success(
    `Processed ${MAPPINGS.length} adaptive color variables`,
    "createAdaptiveColorVariables",
  );
}

export async function handleImportJson(msg: ImportMessage) {
  try {
    log.section("Starting JSON Import");

    const data = msg.data;
    const colorFamilies = Object.keys(data.colors);
    const deleteMissing = msg.deleteMissing;
    const fileName = msg.fileName || "";
    const customPrefix = msg.customPrefix;

    log.info(`File: ${fileName}`, "handleImportJson");
    log.info(`Color families: ${colorFamilies.join(", ")}`, "handleImportJson");
    log.info(`Delete existing: ${deleteMissing}`, "handleImportJson");

    // Use custom prefix if provided, otherwise extract from filename
    let prefix = "custom";
    let prefixOriginal = "custom"; // Keep original casing for collection names

    if (customPrefix) {
      // Use the prefix confirmed by the user
      prefixOriginal = customPrefix;
      prefix = customPrefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      log.info(`Using custom prefix: ${prefixOriginal}`, "handleImportJson");
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
      log.info(
        `Extracted prefix from filename: ${prefixOriginal}`,
        "handleImportJson",
      );
    }

    // Fallback to "custom" if empty
    if (!prefix) {
      prefix = "custom";
      prefixOriginal = "custom";
      log.info("Using default prefix: custom", "handleImportJson");
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

    const successMessage = deleteMissing
      ? MESSAGES.SUCCESS_CREATED
      : MESSAGES.SUCCESS_SYNCED;

    log.section("Import Complete");
    log.success(successMessage, "handleImportJson");

    figma.notify(successMessage);

    figma.ui.postMessage({
      feedback: `Success: ${successMessage}`,
    });
  } catch (e) {
    log.error("Import failed", e, "handleImportJson");
    const errorMessage = MESSAGES.ERROR_PREFIX + (e as Error).message;
    figma.notify(errorMessage);
    figma.ui.postMessage({ feedback: errorMessage });
  }
}
