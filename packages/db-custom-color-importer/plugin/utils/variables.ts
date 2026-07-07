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
  // If the family name starts with the theme prefix (e.g. "dibe-"),
  // split it off as the first group and keep the rest as-is.
  // Example: prefix="dibe", family="dibe-br-color-01" -> "dibe/br-color-01"
  // Example: prefix="dibe", family="dibe-behandlung-bg" -> "dibe/behandlung-bg"
  const prefixWithDash = selectedPrefix.toLowerCase() + "-";
  if (family.toLowerCase().startsWith(prefixWithDash)) {
    const rest = family.slice(prefixWithDash.length);
    return `${selectedPrefix}/${rest}`;
  }

  // If no prefix match, return as-is
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

/**
 * Migrates variables created by earlier plugin versions from the flat group
 * naming (e.g. "dibe-colors/dibe-br-color-01/0" and
 * "dibe-br-color-01/<mapping>") to the new grouped naming
 * ("dibe-colors/dibe/br-color-01/0" and "dibe/br-color-01/<mapping>").
 *
 * Renaming a variable in Figma preserves its ID and all existing bindings,
 * so this migration does not break references in existing designs and avoids
 * creating duplicate variables on re-import.
 *
 * Safe & idempotent: only renames when the old name exists and the new name
 * does not yet exist (collision guard). Affects the Theme (base) and Mode
 * (display) collections; adaptive variables use no family grouping and are
 * left untouched.
 */
export async function migrateLegacyVariableNames(
  data: ColorData,
  colorFamilies: string[],
  themePrefix: string,
  variablePrefix: string,
): Promise<number> {
  const renameMap = new Map<string, string>();

  for (const family of colorFamilies) {
    const newGroup = createVariableGroupPath(family, variablePrefix);
    // Earlier versions used the flat family name as the group segment.
    const oldGroup = family;
    if (oldGroup === newGroup) continue;

    // Base variables (Theme collection)
    const tokens = data.colors[family];
    for (const tokenKey in tokens) {
      renameMap.set(
        `${themePrefix}-colors/${oldGroup}/${tokenKey}`,
        `${themePrefix}-colors/${newGroup}/${tokenKey}`,
      );
    }

    // Display variables (Mode collection)
    for (const m of MAPPINGS) {
      renameMap.set(`${oldGroup}/${m.name}`, `${newGroup}/${m.name}`);
    }
  }

  if (renameMap.size === 0) return 0;

  const allVars = await figma.variables.getLocalVariablesAsync();
  const byName = new Map<string, Variable>();
  for (const v of allVars) byName.set(v.name, v);

  let migrated = 0;
  for (const [oldName, newName] of renameMap) {
    const oldVar = byName.get(oldName);
    if (!oldVar) continue;
    // Collision guard: don't rename onto an already existing new-scheme name.
    if (byName.has(newName)) continue;
    oldVar.name = newName;
    byName.delete(oldName);
    byName.set(newName, oldVar);
    migrated++;
  }

  if (migrated > 0) {
    log.info(
      `Migrated ${migrated} legacy variables to the new naming`,
      "migrateLegacyVariableNames",
    );
  }

  return migrated;
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

    // Rename variables created by earlier plugin versions to the new grouped
    // naming before building the variable map, so they are reused (values
    // updated) instead of duplicated. Runs only when not deleting everything.
    const migratedCount = deleteMissing
      ? 0
      : await migrateLegacyVariableNames(
          data,
          colorFamilies,
          themePrefix,
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

    const feedbackMessage =
      migratedCount > 0
        ? `${successMessage} (migrated ${migratedCount} variables to the new naming)`
        : successMessage;

    log.section("Import Complete");
    log.success(feedbackMessage, "handleImportJson");

    figma.notify(feedbackMessage);

    figma.ui.postMessage({
      feedback: `Success: ${feedbackMessage}`,
    });
  } catch (e) {
    log.error("Import failed", e, "handleImportJson");
    const errorMessage = MESSAGES.ERROR_PREFIX + (e as Error).message;
    figma.notify(errorMessage);
    figma.ui.postMessage({ feedback: errorMessage });
  }
}
