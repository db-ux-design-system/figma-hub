import type { PluginModule, ModuleResult, ProgressUpdate } from "../../types";

const FONT_FAMILY = "DB Neo Screen Sans";
const FONT_REGULAR: FontName = { family: FONT_FAMILY, style: "Regular" };
const FONT_BOLD: FontName = { family: FONT_FAMILY, style: "Bold" };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ChangelogModule implements PluginModule {
  id = "changelog";
  name = "Changelog";
  description = "Version History auslesen und Changelog pflegen";

  private sendProgress: (data: ProgressUpdate) => void;

  constructor(sendProgress: (data: ProgressUpdate) => void) {
    this.sendProgress = sendProgress;
  }

  async execute(action: string, payload?: unknown): Promise<ModuleResult> {
    switch (action) {
      case "write-entry":
        return this.writeEntry(payload);
      case "detect-changed":
        return this.detectChanged();
      default:
        return this.err(`Unknown action: "${action}"`);
    }
  }

  private async detectChanged(): Promise<ModuleResult> {
    this.sendProgress({
      processed: 0,
      total: 0,
      currentComponent: "Loading pages…",
    });
    await delay(50);

    await figma.loadAllPagesAsync();

    console.log("detectChanged: pages loaded, collecting nodes…");

    // Collect all publishable nodes first
    const allNodes: {
      node: ComponentNode | ComponentSetNode;
      pageName: string;
    }[] = [];
    for (const page of figma.root.children) {
      const sets = page.findAllWithCriteria({ types: ["COMPONENT_SET"] });
      const comps = page.findAllWithCriteria({ types: ["COMPONENT"] });
      for (const n of sets) {
        if (n.key && !n.name.startsWith("."))
          allNodes.push({ node: n, pageName: page.name });
      }
      for (const n of comps) {
        if (
          n.key &&
          !n.name.startsWith(".") &&
          n.parent?.type !== "COMPONENT_SET"
        ) {
          allNodes.push({ node: n, pageName: page.name });
        }
      }
    }

    const total = allNodes.length;
    console.log("detectChanged: found", total, "nodes to scan");
    this.sendProgress({
      processed: 0,
      total,
      currentComponent: "Starting scan…",
    });
    await delay(50);

    const grouped: Record<string, string[]> = {};

    for (let i = 0; i < allNodes.length; i++) {
      const { node, pageName } = allNodes[i];
      try {
        const status = await Promise.race([
          node.getPublishStatusAsync(),
          delay(3000).then(() => "TIMEOUT" as const),
        ]);
        if (status === "CHANGED") {
          if (!grouped[pageName]) grouped[pageName] = [];
          grouped[pageName].push(node.name);
        }
      } catch {
        /* skip */
      }
      if ((i + 1) % 10 === 0 || i === allNodes.length - 1) {
        this.sendProgress({
          processed: i + 1,
          total,
          currentComponent: node.name,
        });
        await delay(50);
      }
    }

    return {
      success: true,
      data: { changedByPage: grouped },
    };
  }

  private async writeEntry(payload: unknown): Promise<ModuleResult> {
    const { title, date, body } =
      (payload as { title: string; date: string; body: string }) ?? {};
    if (!title || !body) return this.err("Missing title or body");

    await figma.loadAllPagesAsync();

    const changelogPage = figma.root.children.find((p) =>
      p.name.includes("Changelog"),
    );
    if (!changelogPage) return this.err("Changelog page not found");

    let entriesFrame = changelogPage.findOne(
      (n) => "children" in n && n.name === "Changelog entries",
    ) as FrameNode | null;

    if (!entriesFrame) {
      const parent = changelogPage.findOne(
        (n) => n.type === "FRAME" && n.name === "Changelog",
      ) as FrameNode | null;
      if (parent) {
        entriesFrame = parent.findOne(
          (n) => "children" in n && n.name === "Changelog entries",
        ) as FrameNode | null;
      }
    }

    if (!entriesFrame) return this.err("'Changelog entries' frame not found");

    await figma.loadFontAsync(FONT_REGULAR);
    await figma.loadFontAsync(FONT_BOLD);

    // Detect font size from existing text
    let fontSize = 14;
    const existingText = entriesFrame.findOne(
      (n) => n.type === "TEXT",
    ) as TextNode | null;
    if (existingText) fontSize = existingText.fontSize as number;

    const entryWidth = entriesFrame.width || 400;

    // --- Entry frame (vertical auto layout) ---
    const entryFrame = figma.createFrame();
    entryFrame.name = title;
    entryFrame.layoutMode = "VERTICAL";
    entryFrame.primaryAxisSizingMode = "AUTO";
    entryFrame.counterAxisSizingMode = "FIXED";
    entryFrame.layoutAlign = "STRETCH";
    entryFrame.itemSpacing = 4;
    entryFrame.fills = [];

    // --- Header row (horizontal auto layout: title left, date right) ---
    const headerRow = figma.createFrame();
    headerRow.name = "Header";
    headerRow.layoutMode = "HORIZONTAL";
    headerRow.primaryAxisSizingMode = "FIXED";
    headerRow.counterAxisSizingMode = "AUTO";
    headerRow.primaryAxisAlignItems = "SPACE_BETWEEN";
    headerRow.layoutAlign = "STRETCH";
    headerRow.fills = [];

    const titleNode = figma.createText();
    titleNode.fontName = FONT_BOLD;
    titleNode.fontSize = fontSize;
    titleNode.characters = title;
    titleNode.layoutGrow = 1;
    headerRow.appendChild(titleNode);

    if (date) {
      const dateNode = figma.createText();
      dateNode.fontName = FONT_REGULAR;
      dateNode.fontSize = fontSize;
      dateNode.characters = date;
      dateNode.layoutGrow = 0;
      headerRow.appendChild(dateNode);
    }

    entryFrame.appendChild(headerRow);

    // --- Body text ---
    const bodyNode = figma.createText();
    bodyNode.fontName = FONT_REGULAR;
    bodyNode.fontSize = fontSize;
    bodyNode.characters = body;
    bodyNode.layoutAlign = "STRETCH";
    entryFrame.appendChild(bodyNode);

    // Insert at the top of entries
    entriesFrame.insertChild(0, entryFrame);

    return {
      success: true,
      data: { message: `Entry "${title}" added to Changelog.` },
    };
  }

  private err(message: string): ModuleResult {
    return {
      success: false,
      errors: [{ componentName: "", componentId: "", message }],
    };
  }
}
