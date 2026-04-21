import { delay } from "shared/utils";
import {
  readStampFromInstance,
  isEligibleForMigration,
  REQUIRED_STAMP_FOR_V5,
} from "shared/stamp";
import type {
  MigrationDefinition,
  MigrationNode,
  MigrationNodeResult,
  AnalysisContext,
  MigrationContext,
} from "../../src/types";

/**
 * Mapping: Komponentenname → Text-Layer die geprüft werden.
 */
const COMPONENT_TEXT_MAP: Record<
  string,
  Array<{ layerName: string; propertyLabel: string }>
> = {
  accordion: [
    { layerName: "Headline", propertyLabel: "Headline" },
    { layerName: "Text", propertyLabel: "Text" },
  ],
  badge: [{ layerName: "Text", propertyLabel: "Text" }],
  button: [{ layerName: "Text", propertyLabel: "Text" }],
};

const SUPPORTED_COMPONENTS = Object.keys(COMPONENT_TEXT_MAP);

function matchComponent(componentName: string): string | null {
  const lower = componentName.toLowerCase();
  for (const key of SUPPORTED_COMPONENTS) {
    if (lower.includes(key)) return key;
  }
  return null;
}

function findTextNode(
  node: SceneNode & ChildrenMixin,
  name: string,
): TextNode | null {
  for (const child of node.children) {
    if (
      child.type === "TEXT" &&
      child.name.toLowerCase() === name.toLowerCase()
    ) {
      return child as TextNode;
    }
    if ("children" in child) {
      const found = findTextNode(child as SceneNode & ChildrenMixin, name);
      if (found) return found;
    }
  }
  return null;
}

async function hasOverriddenText(
  instance: InstanceNode,
  layerName: string,
): Promise<{ overridden: boolean; currentText: string }> {
  const textNode = findTextNode(instance, layerName);
  if (!textNode) return { overridden: false, currentText: "" };

  const currentText = textNode.characters;
  const mainComponent = await instance.getMainComponentAsync();
  if (!mainComponent) return { overridden: false, currentText };

  const defaultTextNode = findTextNode(mainComponent, layerName);
  const defaultText = defaultTextNode?.characters ?? "";

  return { overridden: currentText !== defaultText, currentText };
}

async function analyzeRecursive(
  node: SceneNode,
  reportProgress: (n: number) => void,
  counter: { value: number },
  results: MigrationNode[],
): Promise<void> {
  counter.value++;
  reportProgress(counter.value);

  if (node.type === "INSTANCE") {
    const instance = node as InstanceNode;
    const mainComponent = await instance.getMainComponentAsync();

    if (mainComponent) {
      const componentKey = matchComponent(mainComponent.name);
      if (componentKey) {
        // Read the update stamp from the main component
        const stamp = await readStampFromInstance(instance);
        const eligible = isEligibleForMigration(stamp);

        const textFields = COMPONENT_TEXT_MAP[componentKey];
        const overriddenFields: Record<string, string> = {};
        let hasAnyOverride = false;

        for (const field of textFields) {
          const result = await hasOverriddenText(instance, field.layerName);
          if (result.overridden) {
            hasAnyOverride = true;
            overriddenFields[field.propertyLabel] = result.currentText;
          }
        }

        if (hasAnyOverride) {
          results.push({
            id: instance.id,
            name: instance.name,
            type: instance.type,
            details: {
              component:
                componentKey.charAt(0).toUpperCase() + componentKey.slice(1),
              mainComponentName: mainComponent.name,
              stamp: stamp ?? "–",
              eligible: eligible ? "ja" : "nein",
              ...overriddenFields,
            },
          });
        }
      }
    }
  }

  if ("children" in node) {
    for (const child of (node as SceneNode & ChildrenMixin).children) {
      await analyzeRecursive(child, reportProgress, counter, results);
      await delay(10);
    }
  }
}

/**
 * Slot-Introduction Migration
 *
 * Flow:
 * 1. Analyse: Findet Instanzen mit überschriebenen Texten, cacht sie in details
 * 2. User aktualisiert Instanzen manuell in Figma (Update Instance)
 * 3. User klickt "Inhalte wiederherstellen" → Plugin schreibt gecachte Texte zurück
 *
 * executionMode ist "automatic" — der "Migrieren"-Button schreibt direkt
 * die Texte zurück. Die Anleitung zum manuellen Update steht in der UI.
 */
const slotIntroduction: MigrationDefinition<void> = {
  id: "slot-introduction",
  releaseVersion: "5.0.0",
  executionMode: "automatic",
  title: "Einführung Slots in Komponenten",
  description:
    "Prüft Accordion, Badge und Button Instanzen auf überschriebene Texte. " +
    "Speichert die Inhalte zwischen, damit sie nach einem manuellen Update " +
    "der Instanz wiederhergestellt werden können.",
  priority: 10,

  async analyze(context: AnalysisContext): Promise<MigrationNode[]> {
    const results: MigrationNode[] = [];
    const counter = { value: 0 };
    for (const rootNode of context.rootNodes) {
      await analyzeRecursive(
        rootNode,
        context.reportProgress,
        counter,
        results,
      );
    }
    return results;
  },

  async migrate(
    node: MigrationNode,
    context: MigrationContext<void>,
  ): Promise<MigrationNodeResult> {
    // Check stamp eligibility before migrating
    if (node.details.eligible !== "ja") {
      const stampInfo =
        node.details.stamp === "–"
          ? "kein Stamp"
          : `Stamp: ${node.details.stamp}`;
      return {
        nodeId: node.id,
        status: "skipped",
        description: `${node.details.component} "${node.name}" – Manuelle Migration erforderlich (${stampInfo}, benötigt: ${REQUIRED_STAMP_FOR_V5}).`,
      };
    }

    const componentKey = node.details.component?.toLowerCase();
    if (!componentKey || !COMPONENT_TEXT_MAP[componentKey]) {
      return {
        nodeId: node.id,
        status: "skipped",
        description: `Unbekannte Komponente.`,
      };
    }

    const textFields = COMPONENT_TEXT_MAP[componentKey];
    const cachedContent: Record<string, string> = {};
    for (const field of textFields) {
      const value = node.details[field.propertyLabel];
      if (value) cachedContent[field.layerName] = value;
    }

    if (Object.keys(cachedContent).length === 0) {
      return {
        nodeId: node.id,
        status: "skipped",
        description: "Keine überschriebenen Texte.",
      };
    }

    if (context.dryRun) {
      const fields = Object.entries(cachedContent)
        .map(([k, v]) => `${k}="${v}"`)
        .join(", ");
      return {
        nodeId: node.id,
        status: "success",
        description: `Würde wiederherstellen: ${fields}`,
      };
    }

    // Get the actual Figma node and restore cached texts
    const figmaNode = await figma.getNodeByIdAsync(node.id);
    if (!figmaNode || figmaNode.type !== "INSTANCE") {
      return {
        nodeId: node.id,
        status: "error",
        description: `Node nicht gefunden.`,
        error: "Kein INSTANCE.",
      };
    }

    const instance = figmaNode as InstanceNode;
    const restored: string[] = [];
    const failed: string[] = [];

    for (const [layerName, text] of Object.entries(cachedContent)) {
      const textNode = findTextNode(instance, layerName);
      if (textNode) {
        try {
          const fontName = textNode.fontName;
          if (
            fontName &&
            typeof fontName === "object" &&
            "family" in fontName
          ) {
            await figma.loadFontAsync(fontName as FontName);
          }
          textNode.characters = text;
          restored.push(`${layerName}="${text}"`);
        } catch (err) {
          failed.push(
            `${layerName} (${err instanceof Error ? err.message : "Fehler"})`,
          );
        }
      } else {
        failed.push(`${layerName} (Layer nicht gefunden)`);
      }
    }

    if (restored.length === 0) {
      return {
        nodeId: node.id,
        status: "error",
        description: "Texte konnten nicht wiederhergestellt werden.",
        error: failed.join(", "),
      };
    }

    return {
      nodeId: node.id,
      status: "success",
      description:
        `${node.details.component} "${node.name}" – Wiederhergestellt: ${restored.join(", ")}` +
        (failed.length > 0 ? `. Fehlgeschlagen: ${failed.join(", ")}` : ""),
    };
  },
};

export default slotIntroduction;
