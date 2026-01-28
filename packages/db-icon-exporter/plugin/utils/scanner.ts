// utils/scanner.ts

import { IconData, ExportRequest } from "../types";
import { EXCLUDED_PAGES } from "../config";
import { parseDescription } from "./parser";

export let globalIconType = "unknown";
export let globalIconData: IconData[] = [];
export let lastExportRequest: ExportRequest | null = null;

export function setLastExportRequest(request: ExportRequest | null) {
  lastExportRequest = request;
}

export async function scanIcons() {
  console.log("🔍 Starte Icon-Scan-Vorgang...");

  const fileName = figma.root.name;
  console.log(`📄 Dateiname: "${fileName}"`);

  let iconType = "unknown";

  // Sammle alle Seitennamen für Debugging
  const pageNames = figma.root.children.map(p => p.name);
  console.log(`📚 Gefundene Seiten (${pageNames.length}):`, pageNames);

  // Prüfe Dateinamen
  if (fileName.toLowerCase().includes("illustrative")) {
    iconType = "illustrative";
    console.log("✅ Library-Type aus Dateinamen erkannt: ILLUSTRATIVE");
  } else if (fileName.toLowerCase().includes("db theme icons") || fileName.toLowerCase().includes("functional")) {
    iconType = "functional";
    console.log("✅ Library-Type aus Dateinamen erkannt: FUNCTIONAL");
  } else {
    // Fallback: Analysiere erste Komponente
    console.log("⚠️ Library-Type nicht aus Dateinamen erkennbar, analysiere Komponenten...");
    
    for (const page of figma.root.children) {
      await page.loadAsync();
      const components = page.findAll(
        (node) => node.type === "COMPONENT_SET" || node.type === "COMPONENT"
      );
      
      if (components.length > 0) {
        const firstComp = components[0];
        let testNode: ComponentNode | null = null;
        
        if (firstComp.type === "COMPONENT_SET") {
          testNode = (firstComp as ComponentSetNode).children.find(
            (child) => child.type === "COMPONENT"
          ) as ComponentNode;
        } else {
          testNode = firstComp as ComponentNode;
        }
        
        if (testNode) {
          // Prüfe auf "Base" und "Pulse" Ebenen (typisch für Illustrative)
          const hasBaseLayer = testNode.findOne((n) => n.name === "Base") !== null;
          const hasPulseLayer = testNode.findOne((n) => n.name === "Pulse") !== null;
          
          if (hasBaseLayer && hasPulseLayer) {
            iconType = "illustrative";
            console.log("✅ Library-Type aus Komponenten-Struktur erkannt: ILLUSTRATIVE (Base + Pulse Ebenen gefunden)");
          } else {
            iconType = "functional";
            console.log("✅ Library-Type aus Komponenten-Struktur erkannt: FUNCTIONAL");
          }
          break;
        }
      }
    }
    
    if (iconType === "unknown") {
      iconType = "functional";
      console.log("⚠️ Library-Type konnte nicht erkannt werden - Fallback: FUNCTIONAL");
    }
  }

  globalIconType = iconType;

  console.log(`🚫 Ausgeschlossene Seiten-Begriffe:`, EXCLUDED_PAGES);

  const iconData: IconData[] = [];
  const totalPages = figma.root.children.length;
  console.log(`📚 Gesamtanzahl Seiten im Dokument: ${totalPages}`);

  let scannedPages = 0;
  let skippedPages = 0;

  for (const page of figma.root.children) {
    const pageName = page.name;

    const shouldExclude = EXCLUDED_PAGES.some((term) =>
      pageName.toLowerCase().includes(term.toLowerCase())
    );

    if (shouldExclude) {
      console.log(`⏭️ Seite übersprungen: "${pageName}"`);
      skippedPages++;
      continue;
    }

    console.log(`📄 Scanne Seite: "${pageName}"...`);
    scannedPages++;

    console.log(`   ⏳ Lade Seite "${pageName}"...`);
    await page.loadAsync();
    console.log(`   ✅ Seite geladen!`);

    const components = page.findAll(
      (node) => node.type === "COMPONENT_SET" || node.type === "COMPONENT"
    );

    console.log(`   ↳ ${components.length} Komponenten gefunden`);

    for (const comp of components) {
      if (comp.type === "COMPONENT_SET") {
        const componentSet = comp as ComponentSetNode;
        const setName = componentSet.name;

        console.log(`      📦 Component Set: "${setName}"`);

        const rawDescription = componentSet.description || "";
        const parsedDescription = parseDescription(rawDescription, iconType);

        const variantComponents = componentSet.children.filter(
          (child) => child.type === "COMPONENT"
        ) as ComponentNode[];

        console.log(
          `         ↳ ${variantComponents.length} Varianten gefunden`
        );

        variantComponents.forEach((variant) => {
          const fullName = `${setName}/${variant.name}`;

          console.log(`            • ${fullName}`);

          const iconEntry: IconData = {
            name: fullName,
            id: variant.id,
            category: pageName,
            description: rawDescription,
            parsedDescription: parsedDescription,
          };

          iconData.push(iconEntry);
        });
      } else if (comp.type === "COMPONENT") {
        // Einzelne Komponente ohne Set
        const component = comp as ComponentNode;
        const componentName = component.name;

        console.log(`      📦 Component: "${componentName}"`);

        const rawDescription = component.description || "";
        const parsedDescription = parseDescription(rawDescription, iconType);

        const iconEntry: IconData = {
          name: componentName,
          id: component.id,
          category: pageName,
          description: rawDescription,
          parsedDescription: parsedDescription,
        };

        iconData.push(iconEntry);
      }
    }

    console.log(`   🧹 Entlade Seite "${pageName}"...`);
  }

  console.log("📊 ========== SCAN ABGESCHLOSSEN ==========");
  console.log(`   Gesamt Seiten: ${totalPages}`);
  console.log(`   Gescannte Seiten: ${scannedPages}`);
  console.log(`   Übersprungene Seiten: ${skippedPages}`);
  console.log(`   Gefundene Icons: ${iconData.length}`);
  console.log("==========================================");

  const categoryMap = new Map<string, number>();
  iconData.forEach((icon) => {
    categoryMap.set(icon.category, (categoryMap.get(icon.category) || 0) + 1);
  });

  console.log(`🗂 Kategorien (${categoryMap.size}):`);
  categoryMap.forEach((count, category) => {
    console.log(`   • ${category}: ${count} Icons`);
  });

  console.log(`📤 Sende Scan-Ergebnis an UI...`);

  globalIconData = iconData;
  console.log(
    `💾 Gespeichert: ${globalIconData.length} Icons global verfügbar`
  );

  figma.ui.postMessage({
    type: "scan-result",
    icons: iconData,
    iconType: iconType,
  });

  console.log("✅ Daten erfolgreich an UI gesendet!");
}
