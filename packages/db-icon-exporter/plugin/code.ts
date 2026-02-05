// code.ts

import {
  scanIcons,
  globalIconData,
  globalIconType,
  lastExportRequest,
} from "./utils/scanner";
import {
  exportFullWithAssets,
  exportInfoOnly,
  exportChangelogOnly,
} from "./utils/exporter";

console.log("🚀 Plugin Backend gestartet");

figma.showUI(__html__, { width: 900, height: 700 });
console.log("✅ UI-Fenster erstellt (900x700)");

figma.ui.onmessage = async (msg) => {
  console.log("📩 Backend: Nachricht von UI erhalten:", JSON.stringify(msg));

  if (msg.type === "UI_READY") {
    console.log("👍 UI ist bereit - starte Scan!");
    try {
      await scanIcons();
    } catch (error) {
      console.error("❌ Fehler beim Scannen:", error);
      figma.ui.postMessage({
        type: "error",
        message: `Scan-Fehler: ${error}`,
      });
    }
  } else if (msg.type === "LOG_SELECTED_ICONS") {
    console.log("📋 Backend: Logge ausgewählte Icons mit Details...");
    msg.selectedIcons.forEach((selectedIcon: any, index: number) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📌 Icon ${index + 1}/${msg.selectedIcons.length}`);
      console.log(`🏷  Icon Name: ${selectedIcon.name}`);
      console.log(`📂 Kategorie: ${selectedIcon.category}`);
      console.log(`🔖 Status: ${selectedIcon.status}`);
      console.log(`\n📝 Raw Description:`);
      console.log(selectedIcon.description || "(keine Description vorhanden)");
      console.log(`\n🔍 Parsed Description Data:`);
      console.log(JSON.stringify(selectedIcon.parsedDescription, null, 2));
    });
  } else if (msg.type === "SELECT_FROM_EXPORT_PAGE") {
    console.log("📄 Backend: Lade Icons von Export-Seite...");

    if (globalIconData.length === 0) {
      figma.ui.postMessage({
        type: "error",
        message: "Bitte erst Icons scannen, bevor Export-Seite geladen wird.",
      });
      return;
    }

    try {
      const exportPage = figma.root.children.find(
        (page) => page.name === "🚀 Icon Export",
      );

      console.log("📄 Export-Seite gefunden:", exportPage?.name);

      if (!exportPage) {
        figma.ui.postMessage({
          type: "error",
          message:
            "Keine Export-Seite gefunden. Bitte erst einen Export durchführen.",
        });
        return;
      }

      await exportPage.loadAsync();

      // Finde Marketing Frame (enthält alle Icons, nicht nach Packages getrennt)
      const marketingFrame = exportPage.findOne(
        (n) => n.type === "FRAME" && n.name === "Export_Icon_UPDATE",
      ) as FrameNode;

      console.log("📄 Marketing Frame gefunden:", marketingFrame?.name);

      if (!marketingFrame) {
        figma.ui.postMessage({
          type: "error",
          message: "Kein Marketing Frame auf Export-Seite gefunden.",
        });
        return;
      }

      // Sammle alle Icon-IDs vom Marketing Frame
      const exportIconSetIds = new Set<string>();
      const exportComponentIds = new Set<string>();

      // Property-Namen die gefiltert werden sollen
      const propertyNames = ["size", "variant", "state", "type", "color"];

      const instances = marketingFrame.findAll(
        (n) => n.type === "INSTANCE",
      ) as InstanceNode[];

      console.log("📄 Gefundene Instanzen:", instances.length);

      for (const instance of instances) {
        const mainComponent = await instance.getMainComponentAsync();
        if (mainComponent) {
          // Funktionale Icons: Component ist Teil eines Component Sets
          if (mainComponent.parent?.type === "COMPONENT_SET") {
            const componentSet = mainComponent.parent as ComponentSetNode;
            const setName = componentSet.name
              .split(",")[0]
              .split("=")[0]
              .trim();

            // Filtere Property-Definitionen aus
            const isProperty =
              propertyNames.includes(setName.toLowerCase()) ||
              setName.length === 0 ||
              componentSet.name.trim().startsWith("=") ||
              componentSet.name
                .trim()
                .match(/^(Size|Variant|State|Type|Color)=/i);

            console.log(
              `🔍 Backend: Prüfe Component Set: "${componentSet.name}" → setName: "${setName}" → isProperty: ${isProperty}`,
            );

            if (!isProperty) {
              exportIconSetIds.add(componentSet.id);
              console.log(
                `✅ Backend: Component Set hinzugefügt: "${setName}"`,
              );
            } else {
              console.log(
                `🚫 Backend: Property-Definition übersprungen: "${componentSet.name}"`,
              );
            }
          } else {
            // Illustrative Icons: Component ist standalone
            exportComponentIds.add(mainComponent.id);
          }
        }
      }

      console.log(
        `✅ ${exportIconSetIds.size} Component Sets (funktional) + ${exportComponentIds.size} Components (illustrativ) von Export-Seite gefunden`,
      );

      // Finde alle Varianten dieser Icon-Sets in globalIconData
      const iconsWithData: typeof globalIconData = [];

      // Reuse propertyNames from above scope
      for (const icon of globalIconData) {
        // Filtere Property-Definitionen bereits hier aus
        // Bei funktionalen Icons: "SetName/Variant" → prüfe "SetName"
        // Bei illustrativen Icons: "ComponentName" → prüfe "ComponentName"
        const iconBaseName = icon.name.split("/")[0].split("=")[0].trim();
        const isProperty =
          propertyNames.includes(iconBaseName.toLowerCase()) ||
          iconBaseName.length === 0;

        if (isProperty) {
          console.log(
            `🚫 Backend: Filtere Property-Definition aus: "${icon.name}"`,
          );
          continue;
        }

        const node = await figma.getNodeByIdAsync(icon.id);
        if (node) {
          // Funktionale Icons: Prüfe ob Component Set ID dabei ist
          if (
            node.parent?.type === "COMPONENT_SET" &&
            exportIconSetIds.has(node.parent.id)
          ) {
            iconsWithData.push(icon);
            console.log(`✅ Backend: Icon hinzugefügt: "${icon.name}"`);
          }
          // Illustrative Icons: Prüfe ob Component ID dabei ist
          else if (
            node.type === "COMPONENT" &&
            exportComponentIds.has(node.id)
          ) {
            iconsWithData.push(icon);
            console.log(`✅ Backend: Icon hinzugefügt: "${icon.name}"`);
          }
        }
      }

      console.log("📄 iconsWithData Länge:", iconsWithData.length);

      // Debug: Log alle Icon-Namen die gesendet werden
      console.log("📋 Backend: Sende folgende Icons an UI:");
      iconsWithData.forEach((icon, index) => {
        const setName = icon.name.split("/")[0].split("=")[0].trim();
        console.log(`   ${index + 1}. "${icon.name}" → Set: "${setName}"`);
      });

      figma.ui.postMessage({
        type: "select-export-page-icons",
        icons: iconsWithData,
      });
    } catch (error) {
      console.error("❌ Fehler beim Laden der Export-Seite:", error);
      figma.ui.postMessage({
        type: "error",
        message: `Fehler: ${error}`,
      });
    }
  } else if (msg.type === "EXPORT_FULL") {
    console.log("🚀 Backend: Starte Full Export mit Assets...");
    await exportFullWithAssets(
      msg.selectedIconIds,
      msg.version,
      msg.generateOverview,
      globalIconType,
      msg.iconStatuses,
    );
  } else if (msg.type === "EXPORT_INFO_ONLY") {
    console.log("🚀 Backend: Starte Info-Only Export...");
    await exportInfoOnly(
      msg.selectedIconIds,
      msg.version,
      msg.generateOverview,
      globalIconType,
    );
  } else if (msg.type === "EXPORT_CHANGELOG_ONLY") {
    console.log("🚀 Backend: Starte Changelog-Only Export...");
    await exportChangelogOnly(
      msg.selectedIconIds,
      msg.version,
      globalIconType,
      msg.iconStatuses,
    );
  } else {
    console.warn("⚠️ Unbekannter Message Type:", msg.type);
  }
};

console.log("✅ Message-Handler registriert - warte auf UI_READY Signal...");

setTimeout(() => {
  console.log("⏰ Timeout: Starte Scan automatisch nach 2 Sekunden...");
  scanIcons();
}, 2000);
