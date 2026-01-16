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
  iconStatuses?: Record<string, ChangelogStatus>
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
      page.name === "🚀 Icon Export"
  );

  if (existingExportPage) {
    console.log(`🗑️ Lösche existierende Export-Seite: "${existingExportPage.name}"`);
    
    // Wechsle zu einer anderen Seite, bevor wir löschen
    const otherPage = figma.root.children.find((p) => p.id !== existingExportPage.id);
    if (otherPage) {
      await figma.setCurrentPageAsync(otherPage);
    }
    
    existingExportPage.remove();
  }

  const exportPage = figma.createPage();
  exportPage.name = "🚀 Icon Export";

  const pageCount = figma.root.children.length;
  figma.root.insertChild(pageCount - 1, exportPage);

  console.log(`✅ Export-Seite "${exportPage.name}" erstellt`);

  await figma.setCurrentPageAsync(exportPage);

  try {
    console.log("📦 Erstelle GitLab Frame...");
    const gitlabFrame = await buildGitLabFrame(selectedIcons, iconType, globalIconData);
    exportPage.appendChild(gitlabFrame);

    console.log("📦 Erstelle Marketing Frame...");
    const marketingFrame = await buildMarketingFrame(selectedIcons, iconType, globalIconData);
    marketingFrame.y = gitlabFrame.height + 48;
    exportPage.appendChild(marketingFrame);

    if (generateOverview && iconStatuses) {
      const addedIconIds = selectedIconIds.filter((id) => iconStatuses[id] === "added");
      
      if (addedIconIds.length > 0) {
        const addedIcons = addedIconIds
          .map((id) => globalIconData.find((i) => i.id === id))
          .filter(Boolean);
        
        console.log(`📋 Aktualisiere Overview mit ${addedIcons.length} neuen Icons...`);
        await updateOverviewPage(addedIcons, globalIconData);
      }
    }

    if (version) {
      const iconsByStatus = new Map<ChangelogStatus, any[]>();
      ["added", "fixed", "changed", "deprecated"].forEach((status) => {
        iconsByStatus.set(status as ChangelogStatus, []);
      });

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
    }

    const gitlabJsonSelected = generateGitLabDescriptions(selectedIcons, iconType);
    const gitlabJsonAll = generateGitLabDescriptions(globalIconData, iconType);
    const marketingCsv = generateMarketingPortalCSV(globalIconData, iconType);

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
  iconType: string
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
    const gitlabJsonSelected = generateGitLabDescriptions(selectedIcons, iconType);
    const gitlabJsonAll = generateGitLabDescriptions(globalIconData, iconType);
    const marketingCsv = generateMarketingPortalCSV(globalIconData, iconType);

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
