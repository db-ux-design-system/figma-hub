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

/**
 * Helper function to create variable groups from a path
 * Keeps original family names but creates nested groups
 * The selectedPrefix is only used for collection names, not variable names
 */
function createVariableGroupPath(
  family: string,
  selectedPrefix: string,
): string {
  // Keep the original family name - don't add selectedPrefix to it
  // Just create the group structure from the existing family name

  // Split by dashes to find potential group structure
  const parts = family.split("-");

  // If we have at least 3 parts (prefix-group-subgroup), try to create nested structure
  if (parts.length >= 3) {
    // Find common prefix patterns
    // Example: "db-poi-db-services" -> ["db", "poi", "db", "services"]
    // We want to group as: "db-poi/db-services"

    // Strategy: Look for repeated prefix patterns
    const result: string[] = [];
    let i = 0;

    while (i < parts.length) {
      // Check if current part + next part forms a known prefix pattern
      if (i < parts.length - 1) {
        const combined = `${parts[i]}-${parts[i + 1]}`;
        // If this looks like a prefix (2 parts), group it
        if (i === 0 || result.length === 0) {
          result.push(combined);
          i += 2;
        } else {
          // Start a new group
          result.push(parts.slice(i).join("-"));
          break;
        }
      } else {
        // Last part, add it
        result.push(parts[i]);
        i++;
      }
    }

    // Join with slashes for nested groups
    return result.join("/");
  }

  // If less than 3 parts, return as-is (keep original family name)
  return family;
}

/**
 * Helper function to ensure variable group exists in a collection
 * Creates nested groups if they don't exist
 */
async function ensureVariableGroup(
  collection: VariableCollection,
  groupPath: string,
): Promise<VariableResolvedDataType | null> {
  // Split path by slashes to get group hierarchy
  const groups = groupPath.split("/");

  // For Figma API, we need to create the full path as the variable name
  // Figma handles the grouping automatically based on the "/" separator
  // No explicit group creation needed - just return null to indicate no specific group
  return null;
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
  themePrefix: string,
  variablePrefix: string,
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
        // Create grouped path with slashes using variable prefix
        const groupPath = createVariableGroupPath(family, variablePrefix);

        // Use theme prefix for the top-level group
        const varPath = `${themePrefix}-colors/${groupPath}/${tokenKey}`;
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
  themePrefix: string,
  variablePrefix: string,
) {
  log.subsection("Creating Display Mode Variables");
  const displayVarMap: Record<string, string> = {};
  let createdCount = 0;
  let updatedCount = 0;

  for (const family of colorFamilies) {
    for (const m of MAPPINGS) {
      // Create grouped path with slashes using variable prefix
      const groupPath = createVariableGroupPath(family, variablePrefix);

      // Variable path uses the original family structure
      const varPath = `${groupPath}/${m.name}`;
      const lId = baseMap[`${themePrefix}-colors/${groupPath}/${m.light}`];
      const dId = baseMap[`${themePrefix}-colors/${groupPath}/${m.dark}`];

      if (!lId && !dId) continue;

      // Check if variable already exists (by exact name match)
      let v = varMap.get(varPath);
      if (!v) {
        // Variable doesn't exist, create it
        v = figma.variables.createVariable(varPath, displayCol, "COLOR");
        createdCount++;
        log.debug(
          `Created new variable: ${varPath}`,
          "createDisplayModeVariables",
        );
      } else {
        // Variable exists, update it
        updatedCount++;
        log.debug(
          `Reusing existing variable: ${varPath}`,
          "createDisplayModeVariables",
        );
      }

      // Set or update the mode values
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
  log.info(
    `Updated ${updatedCount} existing display mode variables`,
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
  themePrefix: string,
  variablePrefix: string,
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

    // If not found, create new one with theme prefix
    if (!v) {
      const colorVarPath = `${themePrefix}-adaptive/${m.name}`;
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
      // Create grouped path with slashes using variable prefix
      const groupPath = createVariableGroupPath(family, variablePrefix);

      const sourceId = displayVarMap[`${groupPath}/${m.name}`];
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
    const themePrefix = msg.themePrefix || "custom";
    const variablePrefix = msg.variablePrefix || themePrefix;

    log.info(`File: ${fileName}`, "handleImportJson");
    log.info(`Color families: ${colorFamilies.join(", ")}`, "handleImportJson");
    log.info(`Delete existing: ${deleteMissing}`, "handleImportJson");
    log.info(`Theme prefix: ${themePrefix}`, "handleImportJson");
    log.info(`Variable prefix: ${variablePrefix}`, "handleImportJson");

    if (deleteMissing) {
      await deleteCollections();
    }

    const { baseCol, displayCol, colorCol } =
      await getOrCreateCollections(themePrefix);
    const baseModeId = baseCol.modes[0].modeId;
    const { lightModeId, darkModeId } = setupDisplayModes(displayCol, baseCol);
    const { dbAdaptiveModeId, colorFamilyModeIds } = setupColorModes(
      colorCol,
      colorFamilies,
      variablePrefix,
    );

    const varMap = await getExistingVariablesMap();

    const baseMap = await createBaseVariables(
      data,
      colorFamilies,
      baseCol,
      baseModeId,
      varMap,
      themePrefix,
      variablePrefix,
    );
    const displayVarMap = await createDisplayModeVariables(
      colorFamilies,
      displayCol,
      lightModeId,
      darkModeId,
      baseMap,
      varMap,
      themePrefix,
      variablePrefix,
    );
    await createAdaptiveColorVariables(
      colorFamilies,
      colorCol,
      dbAdaptiveModeId,
      colorFamilyModeIds,
      displayVarMap,
      varMap,
      themePrefix,
      variablePrefix,
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
