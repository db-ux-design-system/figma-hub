import type { PluginModule, ModuleResult, ProgressUpdate } from "../../types";

const FONT_FAMILY = "DB Neo Screen Sans";
const FONT_REGULAR: FontName = { family: FONT_FAMILY, style: "Regular" };
const FONT_BOLD: FontName = { family: FONT_FAMILY, style: "Bold" };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ChangelogModule implements PluginModule {
  id = "changelog";
  name = "Changelog";
  description = "Version History auslesen und Changelog pflegen";
  runIn = "main" as const;

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
      case "check-page":
        return this.checkPage();
      default:
        return this.err(`Unknown action: "${action}"`);
    }
  }

  private async checkPage(): Promise<ModuleResult> {
    await figma.loadAllPagesAsync();
    const changelogPage = figma.root.children.find((p) =>
      p.name.includes("Changelog"),
    );
    return { success: true, data: { hasChangelogPage: !!changelogPage } };
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

    const headerFontSize = 16;
    const bodyFontSize = 14;

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
    titleNode.fontSize = headerFontSize;
    titleNode.characters = title;
    titleNode.layoutGrow = 1;
    headerRow.appendChild(titleNode);

    if (date) {
      const dateNode = figma.createText();
      dateNode.fontName = FONT_REGULAR;
      dateNode.fontSize = headerFontSize;
      dateNode.characters = date;
      dateNode.layoutGrow = 0;
      headerRow.appendChild(dateNode);
    }

    entryFrame.appendChild(headerRow);

    // --- Body: parse markdown-style formatting ---
    const lines = body.split("\n");
    // --- Body: group lines into merge entries (bold title + bullet description) ---
    // Each **title** starts a new group; bullet/plain lines belong to the current group
    interface MergeEntry {
      title: string | null;
      bullets: string[];
    }
    const entries: MergeEntry[] = [];
    let current: MergeEntry | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const boldMatch = trimmed.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) {
        current = { title: boldMatch[1], bullets: [] };
        entries.push(current);
        continue;
      }

      const bulletMatch = trimmed.match(/^[-–•*]\s+(.+)$/);
      if (bulletMatch) {
        if (!current) {
          current = { title: null, bullets: [] };
          entries.push(current);
        }
        current.bullets.push(bulletMatch[1]);
      } else {
        if (!current) {
          current = { title: null, bullets: [] };
          entries.push(current);
        }
        current.bullets.push(trimmed);
      }
    }

    // Create one TextNode per merge entry with bold title + native bullet list
    for (const entry of entries) {
      const textNode = figma.createText();
      textNode.fontName = FONT_REGULAR;
      textNode.fontSize = bodyFontSize;
      textNode.layoutAlign = "STRETCH";

      // Build the full text: title on first line, then bullet lines
      const parts: string[] = [];
      if (entry.title) parts.push(entry.title);
      for (const b of entry.bullets) parts.push(b);
      textNode.characters = parts.join("\n");

      // Apply bold to the title line
      if (entry.title) {
        textNode.setRangeFontName(0, entry.title.length, FONT_BOLD);
      }

      // Apply unordered list style to bullet lines
      if (entry.bullets.length > 0) {
        const bulletStart = entry.title ? entry.title.length + 1 : 0;
        const bulletEnd = textNode.characters.length;
        textNode.setRangeListOptions(bulletStart, bulletEnd, {
          type: "UNORDERED",
        });
      }

      entryFrame.appendChild(textNode);
    }

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
