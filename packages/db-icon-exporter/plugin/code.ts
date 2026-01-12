// code.ts

console.log("🚀 Plugin Backend gestartet");

// UI anzeigen
figma.showUI(__html__, { width: 900, height: 700 });
console.log("✅ UI-Fenster erstellt (900x700)");

// ====================================================================
// TYPES & INTERFACES
// ====================================================================
interface ParsedDescriptionFunctional {
  enDefault: string;
  enContextual: string;
  deDefault: string;
  deContextual: string;
  keywords: string;
}

interface ParsedDescriptionIllustrative {
  en: string;
  de: string;
  keywords: string;
}

type ParsedDescription =
  | ParsedDescriptionFunctional
  | ParsedDescriptionIllustrative;

interface IconData {
  name: string;
  id: string;
  category: string;
  description: string;
  parsedDescription: ParsedDescription;
}

// ====================================================================
// DESCRIPTION PARSER
// ====================================================================
function parseDescription(
  description: string,
  iconType: string
): ParsedDescription {
  if (!description || !description.trim()) {
    // Leere Default-Struktur zurückgeben
    if (iconType === "functional") {
      return {
        enDefault: "",
        enContextual: "",
        deDefault: "",
        deContextual: "",
        keywords: "",
      };
    } else {
      return {
        en: "",
        de: "",
        keywords: "",
      };
    }
  }

  const lines = description.split("\n").map((line) => line.trim());

  if (iconType === "functional") {
    const parsed: ParsedDescriptionFunctional = {
      enDefault: "",
      enContextual: "",
      deDefault: "",
      deContextual: "",
      keywords: "",
    };

    let currentLanguage = ""; // "EN" oder "DE"

    for (const line of lines) {
      // Zeilen mit # ignorieren
      if (line.startsWith("#")) {
        continue;
      }

      // Sprach-Section erkennen
      if (line === "EN:" || line.toLowerCase() === "en:") {
        currentLanguage = "EN";
        continue;
      }
      if (line === "DE:" || line.toLowerCase() === "de:") {
        currentLanguage = "DE";
        continue;
      }

      // Keywords erkennen
      if (line.toLowerCase().startsWith("keywords:")) {
        const content = line.split(":").slice(1).join(":").trim();
        parsed.keywords = content;
        continue;
      }

      // Default und Contextual innerhalb der Sprach-Sections
      if (currentLanguage === "EN") {
        if (line.toLowerCase().startsWith("default:")) {
          const content = line.split(":").slice(1).join(":").trim();
          parsed.enDefault = content;
        } else if (line.toLowerCase().startsWith("contextual:")) {
          const content = line.split(":").slice(1).join(":").trim();
          parsed.enContextual = content;
        }
      } else if (currentLanguage === "DE") {
        if (line.toLowerCase().startsWith("default:")) {
          const content = line.split(":").slice(1).join(":").trim();
          parsed.deDefault = content;
        } else if (line.toLowerCase().startsWith("contextual:")) {
          const content = line.split(":").slice(1).join(":").trim();
          parsed.deContextual = content;
        }
      }
    }

    return parsed;
  } else {
    // Illustrative
    const parsed: ParsedDescriptionIllustrative = {
      en: "",
      de: "",
      keywords: "",
    };

    for (const line of lines) {
      // Zeilen mit # ignorieren
      if (line.startsWith("#")) {
        continue;
      }

      // EN-Zeile
      if (line.toLowerCase().startsWith("en:")) {
        const content = line.split(":").slice(1).join(":").trim();
        parsed.en = content;
        continue;
      }

      // DE-Zeile
      if (line.toLowerCase().startsWith("de:")) {
        const content = line.split(":").slice(1).join(":").trim();
        parsed.de = content;
        continue;
      }

      // Keywords-Zeile
      if (line.toLowerCase().startsWith("keywords:")) {
        const content = line.split(":").slice(1).join(":").trim();
        parsed.keywords = content;
        continue;
      }
    }

    return parsed;
  }
}

// ====================================================================
// HAUPT-SCAN-FUNKTION
// ====================================================================

// Global variable to store icon type
let globalIconType = "unknown";

// Store scanned icons globally
let globalIconData: IconData[] = [];

// Store last export request for retry
let lastExportRequest: {
  type: "EXPORT_FULL" | "EXPORT_INFO_ONLY";
  selectedIconIds: string[];
  version: string | null;
  generateOverview: boolean;
} | null = null;

async function scanIcons() {
  console.log("🔍 Starte Icon-Scan-Vorgang...");

  // ----------------------------------------------------------------
  // STEP 1: Library-Check (Dateiname analysieren)
  // ----------------------------------------------------------------
  const fileName = figma.root.name;
  console.log(`📄 Dateiname: "${fileName}"`);

  let iconType = "unknown";

  if (fileName.includes("DB Theme Icons")) {
    iconType = "functional";
    console.log("✅ Library-Type erkannt: FUNCTIONAL");
  } else if (fileName.includes("DB Theme Illustrative Icons")) {
    iconType = "illustrative";
    console.log("✅ Library-Type erkannt: ILLUSTRATIVE");
  } else {
    console.warn("⚠️ Library-Type konnte nicht erkannt werden!");
  }

  // Store globally
  globalIconType = iconType;

  // ----------------------------------------------------------------
  // STEP 2: Seiten scannen (mit Ausschluss-Filter)
  // ----------------------------------------------------------------
  const excludedPages = [
    "cover",
    "welcome",
    "overview",
    "changelog",
    "placeholder",
    "template",
  ];
  console.log(`🚫 Ausgeschlossene Seiten-Begriffe:`, excludedPages);

  const iconData: IconData[] = [];

  const totalPages = figma.root.children.length;
  console.log(`📚 Gesamtanzahl Seiten im Dokument: ${totalPages}`);

  let scannedPages = 0;
  let skippedPages = 0;

  for (const page of figma.root.children) {
    const pageName = page.name;

    // Prüfen ob Seite ausgeschlossen werden soll
    const shouldExclude = excludedPages.some((term) =>
      pageName.toLowerCase().includes(term.toLowerCase())
    );

    if (shouldExclude) {
      console.log(`⏭️ Seite übersprungen: "${pageName}"`);
      skippedPages++;
      continue;
    }

    console.log(`📄 Scanne Seite: "${pageName}"...`);
    scannedPages++;

    // ----------------------------------------------------------------
    // STEP 3: Seite laden (WICHTIG für Figma!)
    // ----------------------------------------------------------------
    console.log(`   ⏳ Lade Seite "${pageName}"...`);
    await page.loadAsync();
    console.log(`   ✅ Seite geladen!`);

    // ----------------------------------------------------------------
    // STEP 4: Komponenten auf der Seite finden
    // ----------------------------------------------------------------
    const components = page.findAll(
      (node) => node.type === "COMPONENT" || node.type === "COMPONENT_SET"
    );

    console.log(`   ↳ ${components.length} Komponenten gefunden`);

    // Jede Komponente verarbeiten
    for (const comp of components) {
      const componentNode = comp as ComponentNode | ComponentSetNode;

      if (componentNode.type === "COMPONENT_SET") {
        // Es ist ein Component Set - scanne alle Variants
        const componentSet = componentNode as ComponentSetNode;
        const setName = componentSet.name;

        console.log(`      📦 Component Set: "${setName}"`);

        // Hole die Description vom Set (ist für alle Variants gleich)
        const rawDescription = componentSet.description || "";
        const parsedDescription = parseDescription(rawDescription, iconType);

        // Finde alle Components (Variants) im Set
        const variantComponents = componentSet.children.filter(
          (child) => child.type === "COMPONENT"
        ) as ComponentNode[];

        console.log(
          `         ↳ ${variantComponents.length} Varianten gefunden`
        );

        // Scanne jede Variante
        variantComponents.forEach((variant) => {
          // Der variant.name enthält die Properties: "size=20, variant=outlined"
          // Wir kombinieren Set-Name + Properties für den vollständigen Namen
          const fullName = `${setName}/${variant.name}`;

          console.log(`            • ${fullName}`);

          const iconEntry: IconData = {
            name: fullName, // z.B. "Ear/size=20, variant=outlined"
            id: variant.id,
            category: pageName,
            description: rawDescription, // Description vom Set
            parsedDescription: parsedDescription,
          };

          iconData.push(iconEntry);
        });
      } else {
        // Es ist eine einzelne Component (kein Set)
        const component = componentNode as ComponentNode;

        const rawDescription = component.description || "";
        const parsedDescription = parseDescription(rawDescription, iconType);

        const iconEntry: IconData = {
          name: component.name,
          id: component.id,
          category: pageName,
          description: rawDescription,
          parsedDescription: parsedDescription,
        };

        iconData.push(iconEntry);

        console.log(`      • ${component.name}`);
      }
    }

    // Seite entladen um Memory zu sparen (optional aber empfohlen)
    console.log(`   🧹 Entlade Seite "${pageName}"...`);
  }

  // ----------------------------------------------------------------
  // STEP 4: Scan-Zusammenfassung
  // ----------------------------------------------------------------
  console.log("📊 ========== SCAN ABGESCHLOSSEN ==========");
  console.log(`   Gesamt Seiten: ${totalPages}`);
  console.log(`   Gescannte Seiten: ${scannedPages}`);
  console.log(`   Übersprungene Seiten: ${skippedPages}`);
  console.log(`   Gefundene Icons: ${iconData.length}`);
  console.log("==========================================");

  // Kategorien-Übersicht ausgeben
  const categoryMap = new Map<string, number>();
  iconData.forEach((icon) => {
    categoryMap.set(icon.category, (categoryMap.get(icon.category) || 0) + 1);
  });

  console.log(`🗂 Kategorien (${categoryMap.size}):`);
  categoryMap.forEach((count, category) => {
    console.log(`   • ${category}: ${count} Icons`);
  });

  // ----------------------------------------------------------------
  // STEP 5: Ergebnis an UI senden
  // ----------------------------------------------------------------
  console.log(`📤 Sende Scan-Ergebnis an UI...`);

  // Store globally for later use
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

// ====================================================================
// FINAL CORRECTED GENERATORS
// ====================================================================

// Helper: Extrahiert Basis-Namen
function extractIconBaseName(fullName: string): string {
  return fullName.split("/")[0].trim();
}

// Helper: Extrahiert Size
function extractIconSize(fullName: string): number | null {
  const sizeMatch = fullName.match(/size=(\d+)/i);
  return sizeMatch ? parseInt(sizeMatch[1]) : null;
}

// Helper: Prüft ob Filled
function isFilledVariant(fullName: string): boolean {
  return /variant=filled/i.test(fullName) || /,\s*filled/i.test(fullName);
}

// Helper: Konvertiert Icon-Name zu lowercase-hyphenated Format
// "Alarm Clock" -> "alarm-clock"
// "Person with Wheelchair" -> "person-with-wheelchair"
function toHyphenatedKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-") // Leerzeichen → Bindestrich
    .replace(/_/g, "-"); // Unterstriche → Bindestrich
}

// Helper: Bereinigt Filename (für CSV)
// Entfernt doppelte Unterstriche und wandelt Bindestriche in Unterstriche um
function cleanFilename(filename: string): string {
  return filename
    .replace(/-/g, "_") // Bindestriche → Unterstriche
    .replace(/__+/g, "_"); // Doppelte (oder mehr) Unterstriche → einfacher Unterstrich
}

// ====================================================================
// GITLAB DESCRIPTIONS GENERATORS
// ====================================================================

function generateGitLabDescriptionsSelected(
  selectedIcons: IconData[],
  iconType: string
): string {
  const descriptionsMap: Record<string, any> = {};

  selectedIcons.forEach((iconData) => {
    const baseName = extractIconBaseName(iconData.name);

    // Konvertiere zu lowercase-hyphenated Key
    const key = toHyphenatedKey(baseName);

    if (descriptionsMap[key]) {
      return;
    }

    const parsed = iconData.parsedDescription;

    if (iconType === "functional") {
      descriptionsMap[key] = {
        en: {
          default: parsed.enDefault ? [parsed.enDefault] : [],
          contextual: parsed.enContextual
            ? parsed.enContextual.split(",").map((s: string) => s.trim())
            : [],
        },
        de: {
          default: parsed.deDefault ? [parsed.deDefault] : [],
          contextual: parsed.deContextual
            ? parsed.deContextual.split(",").map((s: string) => s.trim())
            : [],
        },
      };
    } else {
      // Illustrative Icons - nur en und de Arrays (kein default/contextual)
      descriptionsMap[key] = {
        en: parsed.en ? [parsed.en] : [],
        de: parsed.de ? [parsed.de] : [],
      };
    }
  });

  // Alphabetisch sortieren
  const sortedKeys = Object.keys(descriptionsMap).sort();
  const sortedDescriptions: Record<string, any> = {};
  sortedKeys.forEach((key) => {
    sortedDescriptions[key] = descriptionsMap[key];
  });

  return JSON.stringify(sortedDescriptions, null, "\t");
}

function generateGitLabDescriptionsAll(
  allIcons: IconData[],
  iconType: string
): string {
  return generateGitLabDescriptionsSelected(allIcons, iconType);
}

// ====================================================================
// MARKETING PORTAL CSV GENERATOR
// ====================================================================

function generateMarketingPortalCSV(
  allIcons: IconData[],
  iconType: string
): string {
  console.log(
    `🔧 Marketing CSV: Start (${allIcons.length} Icons, Type: ${iconType})`
  );

  const csvRows: { filename: string; row: string }[] = [];

  const componentSets = new Map<string, IconData[]>();

  allIcons.forEach((icon) => {
    const baseName = extractIconBaseName(icon.name);
    if (!componentSets.has(baseName)) {
      componentSets.set(baseName, []);
    }
    componentSets.get(baseName)!.push(icon);
  });

  console.log(`🔧 ${componentSets.size} Component Sets gefunden`);

  const sortedSetNames = Array.from(componentSets.keys()).sort();

  if (iconType === "functional") {
    const allowedSizes = [64, 48, 32, 24, 20];

    sortedSetNames.forEach((setName) => {
      const variants = componentSets.get(setName)!;

      const firstVariant = variants[0];
      const parsed =
        firstVariant.parsedDescription as ParsedDescriptionFunctional;
      const category = firstVariant.category;

      allowedSizes.forEach((size) => {
        // Outlined Variante
        const outlinedVariant = variants.find((v) => {
          const vSize = extractIconSize(v.name);
          const vIsFilled = isFilledVariant(v.name);
          return vSize === size && !vIsFilled;
        });

        if (outlinedVariant) {
          const categorySlug = category
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/&/g, "");
          const nameSlug = setName.toLowerCase().replace(/\s+/g, "_");

          let filename = `db_ic_${categorySlug}_${nameSlug}_${size}.svg`;
          filename = cleanFilename(filename);

          // Title: NUR für 64 und 48 ohne Icon-Name, nur Size
          let title: string;
          if (size === 64 || size === 48) {
            title = `${size}dp`;
          } else {
            const titleWords = setName
              .split(/[\s-]+/)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
            title = `${titleWords.join(" ")} ${size}dp`;
          }

          const tags: string[] = [];
          tags.push(category);
          if (parsed.enDefault) tags.push(parsed.enDefault);
          if (parsed.enContextual) {
            tags.push(...parsed.enContextual.split(",").map((s) => s.trim()));
          }
          if (parsed.deDefault) tags.push(parsed.deDefault);
          if (parsed.deContextual) {
            tags.push(...parsed.deContextual.split(",").map((s) => s.trim()));
          }
          if (parsed.keywords) {
            tags.push(...parsed.keywords.split(",").map((k) => k.trim()));
          }

          const tagString = tags.filter(Boolean).join(",");

          const row = [
            `"${filename}"`,
            `"${size}dp"`,
            `"${title}"`,
            `""`,
            `"Functionale Icon"`,
            `"${tagString}"`,
            `"Functionale Icon"`,
          ].join(",");

          csvRows.push({ filename, row });
        }

        // Filled Variante
        const filledVariant = variants.find((v) => {
          const vSize = extractIconSize(v.name);
          const vIsFilled = isFilledVariant(v.name);
          return vSize === size && vIsFilled;
        });

        if (filledVariant) {
          const categorySlug = category
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/&/g, "");
          const nameSlug = setName.toLowerCase().replace(/\s+/g, "_");

          let filename = `db_ic_${categorySlug}_${nameSlug}_${size}_filled.svg`;
          filename = cleanFilename(filename);

          // Title: NUR für 64 und 48 ohne Icon-Name, nur Size + Filled
          let title: string;
          if (size === 64 || size === 48) {
            title = `${size}dp Filled`;
          } else {
            const titleWords = setName
              .split(/[\s-]+/)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
            title = `${titleWords.join(" ")} Filled ${size}dp`;
          }

          const tags: string[] = [];
          tags.push(category);
          if (parsed.enDefault) tags.push(parsed.enDefault);
          if (parsed.enContextual) {
            tags.push(...parsed.enContextual.split(",").map((s) => s.trim()));
          }
          if (parsed.deDefault) tags.push(parsed.deDefault);
          if (parsed.deContextual) {
            tags.push(...parsed.deContextual.split(",").map((s) => s.trim()));
          }
          if (parsed.keywords) {
            tags.push(...parsed.keywords.split(",").map((k) => k.trim()));
          }

          const tagString = tags.filter(Boolean).join(",");

          const row = [
            `"${filename}"`,
            `"${size}dp"`,
            `"${title}"`,
            `""`,
            `"Functionale Icon"`,
            `"${tagString}"`,
            `"Functionale Icon"`,
          ].join(",");

          csvRows.push({ filename, row });
        }
      });
    });
  } else {
    sortedSetNames.forEach((setName) => {
      const variants = componentSets.get(setName)!;
      const firstVariant = variants[0];
      const parsed =
        firstVariant.parsedDescription as ParsedDescriptionIllustrative;
      const category = firstVariant.category;
      const size = extractIconSize(firstVariant.name) || 64;

      const categorySlug = category
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/&/g, "");
      const nameSlug = setName.toLowerCase().replace(/\s+/g, "_");

      let filename = `db_ic_il_${categorySlug}_${nameSlug}.svg`;
      filename = cleanFilename(filename);

      const titleWords = setName
        .split(/[\s-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      const title = titleWords.join(" ");

      const tags: string[] = [];
      tags.push(category);
      if (parsed.en) tags.push(parsed.en);
      if (parsed.de) tags.push(parsed.de);
      if (parsed.keywords) {
        tags.push(...parsed.keywords.split(",").map((k) => k.trim()));
      }

      const tagString = tags.filter(Boolean).join(",");

      const row = [
        `"${filename}"`,
        `"${size}dp"`,
        `"${title}"`,
        `""`,
        `"Illustrative Icon"`,
        `"${tagString}"`,
        `"Illustrative Icon"`,
      ].join(",");

      csvRows.push({ filename, row });
    });
  }

  console.log(`🔧 Sortiere ${csvRows.length} Zeilen alphabetisch...`);
  csvRows.sort((a, b) => a.filename.localeCompare(b.filename));

  console.log(`🔧 Marketing CSV: ${csvRows.length} Zeilen generiert`);

  // Header-Zeile NUR für Illustrative Icons hinzufügen
  if (iconType === "illustrative") {
    const header =
      '"Original filename","Width","Title","Short Description","Categories","Free Tags","Realm"';
    return header + "\n" + csvRows.map((item) => item.row).join("\n");
  }

  return csvRows.map((item) => item.row).join("\n");
}

// ====================================================================
// EXPORT FUNCTIONS
// ====================================================================

async function exportFullWithAssets(
  selectedIconIds: string[],
  version: string | null,
  generateOverview: boolean,
  iconType: string
) {
  console.log("📦 ========== FULL EXPORT MIT ASSETS ==========");
  console.log(`📦 Exportiere ${selectedIconIds.length} Icons vollständig...`);
  console.log(`📋 Icon Type: ${iconType}`);
  console.log(
    `📋 Version: ${version || "(keine - kein Changelog wird erstellt)"}`
  );
  console.log(`📊 Overview generieren: ${generateOverview ? "Ja" : "Nein"}`);

  // Store request for potential retry
  lastExportRequest = {
    type: "EXPORT_FULL",
    selectedIconIds,
    version,
    generateOverview,
  };

  // Lookup selected icons from global data
  console.log(
    `🔍 Suche ${selectedIconIds.length} Icons in globalIconData (${globalIconData.length} verfügbar)...`
  );
  const selectedIcons = selectedIconIds
    .map((id) => {
      const icon = globalIconData.find((i) => i.id === id);
      if (!icon) {
        console.warn(`⚠️ Icon mit ID ${id} nicht gefunden!`);
      }
      return icon;
    })
    .filter(Boolean); // Entferne undefined Werte

  console.log(`✅ ${selectedIcons.length} Icons gefunden`);

  // Prüfen ob bereits eine Export-Seite existiert
  const existingExportPage = figma.root.children.find(
    (page) =>
      page.name.toLowerCase().includes("icon export") ||
      page.name === "🚀 Icon Export"
  );

  if (existingExportPage) {
    console.log("⚠️ Export-Seite existiert bereits!");
    console.log(`   Seite: "${existingExportPage.name}"`);

    // Frage User ob überschreiben
    figma.ui.postMessage({
      type: "export-page-exists",
      message:
        "Eine Export-Seite existiert bereits. Möchten Sie diese überschreiben?",
    });
    return;
  }

  console.log("✅ Keine Export-Seite gefunden - erstelle neue Seite...");

  // Export-Seite erstellen
  const exportPage = figma.createPage();
  exportPage.name = "🚀 Icon Export";

  // Seite ans Ende verschieben
  const pageCount = figma.root.children.length;
  figma.root.insertChild(pageCount - 1, exportPage);

  console.log(`✅ Export-Seite "${exportPage.name}" erstellt`);

  if (version) {
    console.log("📝 Changelog wird erstellt (Version vorhanden)");
    // TODO: Changelog erstellen
  } else {
    console.log("⏭️ Kein Changelog (keine Version angegeben)");
  }

  if (generateOverview) {
    console.log("📊 Overview wird neu generiert");
    // TODO: Overview erstellen
  } else {
    console.log("⏭️ Keine Overview-Generierung");
  }

  console.log("🎯 Export-Daten vorbereiten...");

  try {
    console.log("📝 Generiere Export-Daten...");

    // 1. GitLab Descriptions - Ausgewählte Icons
    console.log("   → GitLab Descriptions (Selected)");
    const gitlabJsonSelected = generateGitLabDescriptionsSelected(
      selectedIcons,
      iconType
    );
    console.log(`   ✅ ${gitlabJsonSelected.length} Zeichen`);

    // 2. GitLab Descriptions - ALLE Icons der Library
    console.log("   → GitLab Descriptions (All)");
    const gitlabJsonAll = generateGitLabDescriptionsAll(
      globalIconData,
      iconType
    );
    console.log(`   ✅ ${gitlabJsonAll.length} Zeichen`);

    // 3. Marketing Portal CSV - ALLE Icons der Library
    console.log("   → Marketing Portal CSV (All)");
    const marketingCsv = generateMarketingPortalCSV(globalIconData, iconType);
    console.log(`   ✅ ${marketingCsv.length} Zeichen`);

    console.log("✅ Export-Daten generiert");

    // Sende Daten an UI
    console.log("📤 Sende export-data-ready an UI...");
    figma.ui.postMessage({
      type: "export-data-ready",
      mode: "info-only",
      gitlabJsonSelected: gitlabJsonSelected,
      gitlabJsonAll: gitlabJsonAll,
      marketingCsv: marketingCsv,
      iconType: iconType,
    });
    console.log("✅ Message an UI gesendet");
  } catch (error) {
    console.error("❌ Fehler bei Export-Daten-Generierung:", error);
    figma.ui.postMessage({
      type: "export-error",
      message: `Fehler bei der Daten-Generierung: ${error}`,
    });
  }
}

async function exportInfoOnly(
  selectedIconIds: string[],
  version: string | null,
  generateOverview: boolean,
  iconType: string
) {
  console.log("📋 ========== INFO-ONLY EXPORT ==========");
  console.log(`📋 Exportiere nur Infos für ${selectedIconIds.length} Icons...`);
  console.log(`📋 Icon Type: ${iconType}`);
  console.log(
    `📋 Version: ${version || "(keine - kein Changelog wird aktualisiert)"}`
  );
  console.log(`📊 Overview generieren: ${generateOverview ? "Ja" : "Nein"}`);

  // Store request for potential retry
  lastExportRequest = {
    type: "EXPORT_INFO_ONLY",
    selectedIconIds,
    version,
    generateOverview,
  };

  // Lookup selected icons from global data
  console.log(`🔍 Suche ${selectedIconIds.length} Icons in globalIconData...`);
  const selectedIcons = selectedIconIds
    .map((id) => {
      const icon = globalIconData.find((i) => i.id === id);
      if (!icon) {
        console.warn(`⚠️ Icon mit ID ${id} nicht gefunden!`);
      }
      return icon;
    })
    .filter(Boolean);

  console.log(`✅ ${selectedIcons.length} Icons gefunden`);

  // Prüfen ob Export-Seite existiert
  const existingExportPage = figma.root.children.find(
    (page) =>
      page.name.toLowerCase().includes("icon export") ||
      page.name === "🚀 Icon Export"
  );

  if (!existingExportPage) {
    console.warn("⚠️ Keine Export-Seite gefunden!");

    figma.ui.postMessage({
      type: "export-error",
      message:
        "Keine Export-Seite gefunden. Bitte führen Sie zuerst einen vollständigen Export durch.",
    });
    return;
  }

  console.log(`✅ Export-Seite gefunden: "${existingExportPage.name}"`);
  console.log("📝 Aktualisiere Infos auf bestehender Export-Seite...");

  if (version) {
    console.log("📝 Changelog wird aktualisiert (Version vorhanden)");
  } else {
    console.log("⏭️ Kein Changelog-Update (keine Version angegeben)");
  }

  if (generateOverview) {
    console.log("📊 Overview wird neu generiert");
  } else {
    console.log("⏭️ Keine Overview-Generierung");
  }

  console.log("🎯 Export-Daten vorbereiten...");

  try {
    // GETAUSCHT
    console.log("📝 Generiere Export-Daten...");

    // 1. GitLab Descriptions - Ausgewählte Icons
    console.log("   → GitLab Descriptions (Selected)");
    const gitlabJsonSelected = generateGitLabDescriptionsSelected(
      selectedIcons,
      iconType
    );
    console.log(`   ✅ ${gitlabJsonSelected.length} Zeichen`);

    // 2. GitLab Descriptions - ALLE Icons der Library
    console.log("   → GitLab Descriptions (All)");
    const gitlabJsonAll = generateGitLabDescriptionsAll(
      globalIconData,
      iconType
    );
    console.log(`   ✅ ${gitlabJsonAll.length} Zeichen`);

    // 3. Marketing Portal CSV - ALLE Icons der Library
    console.log("   → Marketing Portal CSV (All)");
    const marketingCsv = generateMarketingPortalCSV(globalIconData, iconType);
    console.log(`   ✅ ${marketingCsv.length} Zeichen`);

    console.log("✅ Export-Daten generiert");

    // Sende Daten an UI
    console.log("📤 Sende export-data-ready an UI...");
    figma.ui.postMessage({
      type: "export-data-ready",
      mode: "full",
      gitlabJsonSelected: gitlabJsonSelected,
      gitlabJsonAll: gitlabJsonAll,
      marketingCsv: marketingCsv,
      iconType: iconType,
    });
    console.log("✅ Message an UI gesendet");
  } catch (error) {
    console.error("❌ Fehler bei Export-Daten-Generierung:", error);
    figma.ui.postMessage({
      type: "export-error",
      message: `Fehler bei der Daten-Generierung: ${error}`,
    });
  }
}

// ====================================================================
// MESSAGE HANDLER (UI ↔ Backend Kommunikation)
// ====================================================================

// WICHTIG: Message Handler SOFORT registrieren
figma.ui.onmessage = async (msg) => {
  console.log("📩 Backend: Nachricht von UI erhalten:", JSON.stringify(msg));
  console.log("📩 Message Type:", msg?.type);

  // Auf UI-Ready Signal warten, bevor Scan gestartet wird
  if (msg.type === "UI_READY") {
    console.log("👍 UI ist bereit - starte Scan!");

    try {
      await scanIcons();
    } catch (error) {
      console.error("❌ Fehler beim Scannen:", error);

      // Fehler an UI senden
      figma.ui.postMessage({
        type: "error",
        message: `Scan-Fehler: ${error}`,
      });
    }
  } else if (msg.type === "LOG_SELECTED_ICONS") {
    console.log("📋 Backend: Logge ausgewählte Icons mit Details...");
    console.log("📋 Anzahl ausgewählter Icons:", msg.selectedIcons.length);

    // Detaillierte Ausgabe für jedes Icon
    msg.selectedIcons.forEach((selectedIcon: any, index: number) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📌 Icon ${index + 1}/${msg.selectedIcons.length}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🏷  Icon Name: ${selectedIcon.name}`);
      console.log(`📂 Kategorie: ${selectedIcon.category}`);
      console.log(`🔖 Status: ${selectedIcon.status}`);
      console.log(`\n📝 Raw Description:`);
      console.log(selectedIcon.description || "(keine Description vorhanden)");
      console.log(`\n🔍 Parsed Description Data:`);
      console.log(JSON.stringify(selectedIcon.parsedDescription, null, 2));
    });

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(
      `✅ Logging abgeschlossen für ${msg.selectedIcons.length} Icons`
    );
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  } else if (msg.type === "EXPORT_FULL") {
    console.log("🚀 Backend: Starte Full Export mit Assets...");
    await exportFullWithAssets(
      msg.selectedIconIds,
      msg.version,
      msg.generateOverview,
      globalIconType
    );
  } else if (msg.type === "EXPORT_INFO_ONLY") {
    console.log("🚀 Backend: Starte Info-Only Export...");
    await exportInfoOnly(
      msg.selectedIconIds,
      msg.version,
      msg.generateOverview,
      globalIconType
    );
  } else if (msg.type === "DELETE_EXPORT_PAGE_AND_RETRY") {
    console.log("🗑️ Backend: Lösche Export-Seite und wiederhole Export...");

    // Finde und lösche die Export-Seite
    const exportPage = figma.root.children.find(
      (page) =>
        page.name.toLowerCase().includes("icon export") ||
        page.name === "🚀 Icon Export"
    );

    if (exportPage) {
      console.log(`   ↳ Lösche Seite: "${exportPage.name}"`);
      exportPage.remove();
      console.log("   ✅ Seite gelöscht");
    }

    // Wiederhole letzten Export-Request
    if (lastExportRequest) {
      console.log(`   ↳ Wiederhole Export (Type: ${lastExportRequest.type})`);

      if (lastExportRequest.type === "EXPORT_FULL") {
        await exportFullWithAssets(
          lastExportRequest.selectedIconIds,
          lastExportRequest.version,
          lastExportRequest.generateOverview,
          globalIconType
        );
      } else {
        await exportInfoOnly(
          lastExportRequest.selectedIconIds,
          lastExportRequest.version,
          lastExportRequest.generateOverview,
          globalIconType
        );
      }
    } else {
      console.error("❌ Kein Export-Request zum Wiederholen vorhanden");
    }
  } else {
    console.warn("⚠️ Unbekannter Message Type:", msg.type);
  }

  // Hier können später weitere Message-Handler hinzugefügt werden
  // z.B. für "export-svg", "export-json", etc.
};

console.log("✅ Message-Handler registriert - warte auf UI_READY Signal...");

// FALLBACK: Wenn nach 2 Sekunden nichts passiert, Scan trotzdem starten
setTimeout(() => {
  console.log("⏰ Timeout: Starte Scan automatisch nach 2 Sekunden...");
  scanIcons();
}, 2000);
