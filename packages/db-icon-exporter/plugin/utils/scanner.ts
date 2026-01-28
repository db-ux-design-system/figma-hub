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
  const pageNames = figma.root.children.map((p) => p.name);
  console.log(`📚 Gefundene Seiten (${pageNames.length}):`, pageNames);

  // Prüfe Dateinamen
  if (fileName.toLowerCase().includes("illustrative")) {
    iconType = "illustrative";
    console.log("✅ Library-Type aus Dateinamen erkannt: ILLUSTRATIVE");
  } else if (
    fileName.toLowerCase().includes("db theme icons") ||
    fileName.toLowerCase().includes("functional")
  ) {
    iconType = "functional";
    console.log("✅ Library-Type aus Dateinamen erkannt: FUNCTIONAL");
  } else {
    // Fallback: Analysiere erste Komponente
    console.log(
      "⚠️ Library-Type nicht aus Dateinamen erkennbar, analysiere Komponenten...",
    );

    for (const page of figma.root.children) {
      await page.loadAsync();
      const componentSets = page.findAll(
        (node) => node.type === "COMPONENT_SET",
      );

      // Wenn Component Sets gefunden werden, ist es functional
      if (componentSets.length > 0) {
        iconType = "functional";
        console.log(
          "✅ Library-Type erkannt: FUNCTIONAL (Component Sets gefunden)",
        );
        break;
      }

      // Sonst prüfe auf einzelne Components (= Illustrative)
      const components = page.findAll((node) => node.type === "COMPONENT");

      if (components.length > 0) {
        iconType = "illustrative";
        console.log(
          "✅ Library-Type erkannt: ILLUSTRATIVE (einzelne Components gefunden)",
        );
        break;
      }
    }

    if (iconType === "unknown") {
      iconType = "illustrative";
      console.log(
        "⚠️ Library-Type konnte nicht erkannt werden - Fallback: ILLUSTRATIVE",
      );
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
      pageName.toLowerCase().includes(term.toLowerCase()),
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
      (node) => node.type === "COMPONENT_SET" || node.type === "COMPONENT",
    );

    console.log(`   ↳ ${components.length} Komponenten gefunden`);

    for (const comp of components) {
      if (comp.type === "COMPONENT_SET") {
        const componentSet = comp as ComponentSetNode;
        let setName = componentSet.name;

        // Bereinige Set-Namen von Size/Variant-Suffixen (sollte nicht vorkommen, aber zur Sicherheit)
        setName = setName.split(",")[0].trim();
        setName = setName.split("=")[0].trim();

        // Filtere Property-Namen aus (z.B. "Size", "Variant", etc.)
        // Diese sind keine echten Icons, sondern nur Property-Definitionen
        const propertyNames = ["size", "variant", "state", "type", "color"];
        if (propertyNames.includes(setName.toLowerCase())) {
          console.log(`      ⏭️ Überspringe Property-Definition: "${setName}"`);
          continue;
        }

        // Zusätzlicher Check: Wenn der Set-Name leer ist oder nur aus Properties besteht
        if (!setName || setName.length === 0) {
          console.log(`      ⏭️ Überspringe Component Set ohne Namen`);
          continue;
        }

        // Prüfe ob der Component Set Name mit "=" beginnt (Property ohne Icon-Namen)
        if (
          componentSet.name.trim().startsWith("=") ||
          componentSet.name.trim().match(/^(Size|Variant|State|Type|Color)=/i)
        ) {
          console.log(
            `      ⏭️ Überspringe Property-Only Component Set: "${componentSet.name}"`,
          );
          continue;
        }

        console.log(`      📦 Component Set: "${setName}"`);

        const rawDescription = componentSet.description || "";
        const parsedDescription = parseDescription(rawDescription, iconType);

        const variantComponents = componentSet.children.filter(
          (child) => child.type === "COMPONENT",
        ) as ComponentNode[];

        console.log(
          `         ↳ ${variantComponents.length} Varianten gefunden`,
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
        let componentName = component.name;

        // Bereinige Component-Namen von Size/Variant-Suffixen (sollte bei illustrativen Icons nicht vorkommen)
        componentName = componentName.split(",")[0].trim();
        componentName = componentName.split("=")[0].trim();

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
    `💾 Gespeichert: ${globalIconData.length} Icons global verfügbar`,
  );

  figma.ui.postMessage({
    type: "scan-result",
    icons: iconData,
    iconType: iconType,
  });

  console.log("✅ Daten erfolgreich an UI gesendet!");
}
