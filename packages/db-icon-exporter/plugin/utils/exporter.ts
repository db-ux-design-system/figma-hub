// utils/exporter.ts

import { ExportRequest, ChangelogStatus } from "../types";
import { globalIconData, setLastExportRequest } from "./scanner";
import { generateGitLabDescriptions } from "./generators/gitlab";
import { generateMarketingPortalCSV } from "./generators/marketing";
import {
  buildGitLabFrame,
  buildMarketingFrame,
  updateOverviewPage,
  createChangelogFrame,
} from "./pageBuilder";

export async function exportFullWithAssets(
  selectedIconIds: string[],
  version: string | null,
  generateOverview: boolean,
  iconType: string,
  iconStatuses?: Record<string, ChangelogStatus>,
) {
  console.log("📦 ========== FULL EXPORT MIT ASSETS ==========");

  setLastExportRequest({
    type: "EXPORT_FULL",
    selectedIconIds,
    version,
    generateOverview,
    iconStatuses,
  });

  const selectedIcons = selectedIconIds
    .map((id) => globalIconData.find((i) => i.id === id))
    .filter(Boolean);

  const existingExportPage = figma.root.children.find(
    (page) =>
      page.name.toLowerCase().includes("icon export") ||
      page.name === "🚀 Icon Export",
  );

  if (existingExportPage) {
    console.log(
      `🗑️ Lösche existierende Export-Seite: "${existingExportPage.name}"`,
    );

    // Wechsle zu einer anderen Seite, bevor wir löschen
    const otherPage = figma.root.children.find(
      (p) => p.id !== existingExportPage.id,
    );
    if (otherPage) {
      await figma.setCurrentPageAsync(otherPage);
    }

    existingExportPage.remove();
  }

  const exportPage = figma.createPage();
  exportPage.name = "🚀 Icon Export";
  exportPage.backgrounds = [
    {
      type: "SOLID",
      color: { r: 0.894, g: 0.949, b: 0.992 },
    },
  ];

  const pageCount = figma.root.children.length;
  figma.root.insertChild(pageCount - 1, exportPage);

  console.log(`✅ Export-Seite "${exportPage.name}" erstellt`);

  await figma.setCurrentPageAsync(exportPage);

  try {
    console.log("📦 Erstelle GitLab Frames...");
    const gitlabFrames = await buildGitLabFrame(
      selectedIcons,
      iconType,
      globalIconData,
    );

    // Add all GitLab frames to the export page
    let currentY = 0;
    gitlabFrames.forEach((frame, index) => {
      frame.y = currentY;
      exportPage.appendChild(frame);
      currentY += frame.height + 48; // Add spacing between frames
    });

    console.log("📦 Erstelle Marketing Frame...");
    const marketingFrame = await buildMarketingFrame(
      selectedIcons,
      iconType,
      globalIconData,
    );
    marketingFrame.y = currentY;
    exportPage.appendChild(marketingFrame);

    if (generateOverview && iconStatuses) {
      // Filter for icons with "feat" status (new icons)
      const featIconIds = selectedIconIds.filter(
        (id) => iconStatuses[id] === "feat",
      );

      if (featIconIds.length > 0) {
        const featIcons = featIconIds
          .map((id) => globalIconData.find((i) => i.id === id))
          .filter(Boolean);

        console.log(
          `📋 Aktualisiere Overview mit ${featIcons.length} neuen Icons (feat)...`,
        );
        await updateOverviewPage(featIcons, globalIconData, iconType);
      } else {
        console.log(
          `ℹ️ Keine Icons mit Status "feat" gefunden - Overview wird nicht aktualisiert`,
        );
      }
    }

    if (version) {
      const iconsByStatus = new Map<ChangelogStatus, IconData[]>();
      ["feat", "fix", "refactor", "docs", "chore", "deprecated"].forEach(
        (status) => {
          iconsByStatus.set(status as ChangelogStatus, []);
        },
      );

      // Group icons by status - simplified logic
      selectedIcons.forEach((icon) => {
        const status = iconStatuses?.[icon.id];
        if (status && iconsByStatus.has(status)) {
          // Check if this icon set is already added (by base name)
          const baseName = icon.name.split("/")[0];
          const existing = iconsByStatus.get(status)!;
          const alreadyAdded = existing.some(
            (i) => i.name.split("/")[0] === baseName,
          );

          if (!alreadyAdded) {
            iconsByStatus.get(status)!.push(icon);
          }
        }
      });

      await createChangelogFrame(version, iconsByStatus, globalIconData);
    }

    const gitlabJsonSelectedMap = generateGitLabDescriptions(
      selectedIcons,
      iconType,
    );
    const gitlabJsonAllMap = generateGitLabDescriptions(
      globalIconData,
      iconType,
    );
    const marketingCsv = generateMarketingPortalCSV(globalIconData, iconType);

    // Convert Maps to plain objects for postMessage
    const gitlabJsonSelected = Object.fromEntries(gitlabJsonSelectedMap);
    const gitlabJsonAll = Object.fromEntries(gitlabJsonAllMap);

    figma.ui.postMessage({
      type: "export-data-ready",
      mode: "full",
      gitlabJsonSelected,
      gitlabJsonAll,
      marketingCsv,
      iconType,
    });
  } catch (error) {
    console.error("❌ Fehler:", error);
    figma.ui.postMessage({
      type: "export-error",
      message: `Fehler: ${error}`,
    });
  }
}

export async function exportInfoOnly(
  selectedIconIds: string[],
  version: string | null,
  generateOverview: boolean,
  iconType: string,
) {
  console.log("📋 ========== INFO-ONLY EXPORT ==========");

  setLastExportRequest({
    type: "EXPORT_INFO_ONLY",
    selectedIconIds,
    version,
    generateOverview,
  });

  const selectedIcons = selectedIconIds
    .map((id) => globalIconData.find((i) => i.id === id))
    .filter(Boolean);

  // TODO: Aktualisierung der Export-Seite basierend auf Icon-Status und Changelog (falls vorhanden)

  try {
    const gitlabJsonSelectedMap = generateGitLabDescriptions(
      selectedIcons,
      iconType,
    );
    const gitlabJsonAllMap = generateGitLabDescriptions(
      globalIconData,
      iconType,
    );
    const marketingCsv = generateMarketingPortalCSV(globalIconData, iconType);

    // Convert Maps to plain objects for postMessage
    const gitlabJsonSelected = Object.fromEntries(gitlabJsonSelectedMap);
    const gitlabJsonAll = Object.fromEntries(gitlabJsonAllMap);

    figma.ui.postMessage({
      type: "export-data-ready",
      mode: "info-only",
      gitlabJsonSelected,
      gitlabJsonAll,
      marketingCsv,
      iconType,
    });
  } catch (error) {
    console.error("❌ Fehler:", error);
    figma.ui.postMessage({
      type: "export-error",
      message: `Fehler: ${error}`,
    });
  }
}

export async function exportChangelogOnly(
  selectedIconIds: string[],
  version: string,
  iconType: string,
  iconStatuses: Record<string, ChangelogStatus>,
) {
  console.log("📝 ========== CHANGELOG-ONLY EXPORT ==========");

  setLastExportRequest({
    type: "EXPORT_CHANGELOG_ONLY",
    selectedIconIds,
    version,
    iconStatuses,
  });

  const selectedIcons = selectedIconIds
    .map((id) => globalIconData.find((i) => i.id === id))
    .filter(Boolean);

  try {
    const iconsByStatus = new Map<ChangelogStatus, any[]>();
    ["feat", "fix", "refactor", "docs", "chore", "deprecated"].forEach(
      (status) => {
        iconsByStatus.set(status as ChangelogStatus, []);
      },
    );

    selectedIcons.forEach((icon) => {
      const baseName = icon.name.split("/")[0];
      const iconId = selectedIconIds.find((id) => {
        const foundIcon = globalIconData.find((i) => i.id === id);
        return foundIcon && foundIcon.name.split("/")[0] === baseName;
      });
      const status = iconId && iconStatuses?.[iconId];
      if (status && iconsByStatus.has(status)) {
        const existing = iconsByStatus.get(status)!;
        if (!existing.some((i) => i.name.split("/")[0] === baseName)) {
          iconsByStatus.get(status)!.push(icon);
        }
      }
    });

    console.log(`📋 Erstelle Changelog Frame für v${version}...`);
    await createChangelogFrame(version, iconsByStatus, globalIconData);

    console.log("✅ Changelog Frame erstellt!");
  } catch (error) {
    console.error("❌ Fehler:", error);
    figma.ui.postMessage({
      type: "export-error",
      message: `Fehler beim Erstellen des Changelog Frames: ${error}`,
    });
  }
}
