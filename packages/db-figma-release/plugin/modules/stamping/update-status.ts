/**
 * Updates the "Update status" frame on the "Overview" page.
 * Groups components by their page name with section headers.
 */

import { readUpdatedWith, readVersionMap } from "./stamp";

const UPDATE_STATUS_FRAME = "Component update status";
const TABLE_NODE = "Table";

interface TableRow {
  name: string;
  version: string;
  pageName: string;
}

export async function updateStatusFrame(
  components: (ComponentNode | ComponentSetNode)[],
): Promise<void> {
  await figma.loadAllPagesAsync();

  const overviewPage = figma.root.children.find((p) =>
    p.name.includes("Changelog"),
  );
  if (!overviewPage) {
    console.log("updateStatusFrame: 'Changelog' page not found");
    return;
  }

  const statusFrame = overviewPage.findOne(
    (n) => n.type === "FRAME" && n.name === UPDATE_STATUS_FRAME,
  ) as FrameNode | null;
  if (!statusFrame) {
    console.log("updateStatusFrame: 'Update status' frame not found");
    return;
  }

  // Update header text — use first direct TEXT child of the status frame
  const headerNode = statusFrame.children.find((n) => n.type === "TEXT") as
    | TextNode
    | undefined;
  if (headerNode) {
    // Determine highest version from the root version map (authoritative after Stamp All)
    const versionMap = readVersionMap();
    let highestVersion = "0.0";
    for (const v of Object.values(versionMap)) {
      const [major, minor] = v.split(".").map(Number);
      const [hMajor, hMinor] = highestVersion.split(".").map(Number);
      if (major > hMajor || (major === hMajor && minor > hMinor)) {
        highestVersion = v;
      }
    }
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
    const newText = `Library: v${highestVersion}, ${date}`;
    try {
      // Load all fonts used in the text node (handles mixed styles)
      const len = headerNode.characters.length;
      if (len > 0) {
        const fonts = headerNode.getRangeAllFontNames(0, len);
        for (const font of fonts) {
          await figma.loadFontAsync(font);
        }
      }
      headerNode.characters = newText;
      console.log("updateStatusFrame: header updated to:", newText);
    } catch (e) {
      console.log("updateStatusFrame: FAILED to update header:", e);
    }
  }

  const tableNode = statusFrame.findOne(
    (n) => n.name === TABLE_NODE && "children" in n,
  ) as FrameNode | null;
  if (!tableNode) {
    console.log("updateStatusFrame: 'Table' not found");
    return;
  }

  // Collect rows with page info
  const rows: TableRow[] = [];
  for (const node of components) {
    // Walk up to find the page
    let parent: BaseNode | null = node;
    while (parent && parent.type !== "PAGE") {
      parent = parent.parent;
    }
    const pageName = parent ? parent.name : "Unknown";

    rows.push({
      name: node.name,
      version: readUpdatedWith(node) ?? "—",
      pageName,
    });
  }

  // Group by page, sort pages and components alphabetically
  const grouped = new Map<string, TableRow[]>();
  for (const row of rows) {
    const group = grouped.get(row.pageName) ?? [];
    group.push(row);
    grouped.set(row.pageName, group);
  }
  const sortedPages = Array.from(grouped.keys()).sort((a, b) =>
    a.localeCompare(b),
  );
  for (const page of sortedPages) {
    grouped.get(page)!.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Use hardcoded fonts to avoid inheriting wrong style from previous run
  const fontFamily = "DB Neo Screen Sans";
  const font: FontName = { family: fontFamily, style: "Regular" };
  const fontBold: FontName = { family: fontFamily, style: "Bold" };
  let fontSize = 12;

  // Try to get font size from existing text
  for (const child of tableNode.children) {
    if (child.type === "TEXT") {
      fontSize = child.fontSize as number;
      break;
    }
  }

  await figma.loadFontAsync(font);
  await figma.loadFontAsync(fontBold);

  // Clear table
  for (let i = tableNode.children.length - 1; i >= 0; i--) {
    tableNode.children[i].remove();
  }

  // Build grouped table
  for (const pageName of sortedPages) {
    const pageRows = grouped.get(pageName)!;

    // Section header (page name)
    const header = figma.createText();
    header.fontName = fontBold;
    header.fontSize = fontSize;
    header.characters = pageName;
    tableNode.appendChild(header);

    // Component rows
    for (const row of pageRows) {
      const text = figma.createText();
      text.fontName = font;
      text.fontSize = fontSize;
      text.characters = `- ${row.name} - updated with v${row.version}`;
      tableNode.appendChild(text);
    }
  }

  console.log(
    "updateStatusFrame: table updated with",
    rows.length,
    "rows in",
    sortedPages.length,
    "groups",
  );
}
