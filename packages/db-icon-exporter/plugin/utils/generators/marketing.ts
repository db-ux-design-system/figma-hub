// utils/generators/marketing.ts

import {
  IconData,
  ParsedDescriptionFunctional,
  ParsedDescriptionIllustrative,
} from "../../types";
import { ALLOWED_SIZES_FUNCTIONAL } from "../../config";
import {
  extractIconBaseName,
  extractIconSize,
  isFilledVariant,
  cleanFilename,
} from "../helpers";

export function generateMarketingPortalCSV(
  allIcons: IconData[],
  iconType: string,
): string {
  console.log(
    `🔧 Marketing CSV: Start (${allIcons.length} Icons, Type: ${iconType})`,
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

  // Debug: Zeige erstes Icon-Set
  if (sortedSetNames.length > 0) {
    const firstSet = sortedSetNames[0];
    const firstVariants = componentSets.get(firstSet)!;
    console.log(`🔧 Beispiel Icon-Set: "${firstSet}"`);
    console.log(`🔧 Varianten (${firstVariants.length}):`);
    firstVariants.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.name}`);
    });
  }

  if (iconType === "functional") {
    sortedSetNames.forEach((setName) => {
      const variants = componentSets.get(setName)!;
      const firstVariant = variants[0];
      const parsed =
        firstVariant.parsedDescription as ParsedDescriptionFunctional;
      const category = firstVariant.category;

      console.log(
        `🔧 Processing set: ${setName}, variants: ${variants.length}`,
      );

      ALLOWED_SIZES_FUNCTIONAL.forEach((size) => {
        const outlinedVariant = variants.find((v) => {
          const vSize = extractIconSize(v.name);
          const vIsFilled = isFilledVariant(v.name);
          return vSize === size && !vIsFilled;
        });

        if (outlinedVariant) {
          console.log(`  ✅ Found outlined variant for size ${size}`);
          const categorySlug = category
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/&/g, "");
          // Für Marketingportal: Icon-Name in snake_case konvertieren
          const nameSlug = setName.replace(/-/g, "_");
          let filename = `db_ic_${categorySlug}_${nameSlug}_${size}.svg`;
          filename = cleanFilename(filename);

          const titleWords = setName
            .split(/[\s-_]+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          const title = `${titleWords.join(" ")} ${size}dp`;

          const tags: string[] = [category];
          if (parsed.enDefault) tags.push(parsed.enDefault);
          if (parsed.enContextual)
            tags.push(...parsed.enContextual.split(",").map((s) => s.trim()));
          if (parsed.deDefault) tags.push(parsed.deDefault);
          if (parsed.deContextual)
            tags.push(...parsed.deContextual.split(",").map((s) => s.trim()));
          if (parsed.keywords)
            tags.push(...parsed.keywords.split(",").map((k) => k.trim()));

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
        } else {
          console.log(`  ❌ No outlined variant for size ${size}`);
        }

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
          // Für Marketingportal: Icon-Name in snake_case konvertieren
          const nameSlug = setName.replace(/-/g, "_");
          let filename = `db_ic_${categorySlug}_${nameSlug}_${size}_filled.svg`;
          filename = cleanFilename(filename);

          const titleWords = setName
            .split(/[\s-_]+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          const title = `${titleWords.join(" ")} Filled ${size}dp`;

          const tags: string[] = [category];
          if (parsed.enDefault) tags.push(parsed.enDefault);
          if (parsed.enContextual)
            tags.push(...parsed.enContextual.split(",").map((s) => s.trim()));
          if (parsed.deDefault) tags.push(parsed.deDefault);
          if (parsed.deContextual)
            tags.push(...parsed.deContextual.split(",").map((s) => s.trim()));
          if (parsed.keywords)
            tags.push(...parsed.keywords.split(",").map((k) => k.trim()));

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
    console.log(
      `🔧 Illustrative Icons: Processing ${sortedSetNames.length} sets`,
    );
    sortedSetNames.forEach((setName) => {
      const variants = componentSets.get(setName)!;
      const firstVariant = variants[0];
      const parsed =
        firstVariant.parsedDescription as ParsedDescriptionIllustrative;
      const category = firstVariant.category;
      const size = extractIconSize(firstVariant.name) || 64;

      console.log(
        `🔧 Processing: ${setName}, size: ${size}, name: ${firstVariant.name}`,
      );

      const categorySlug = category
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/&/g, "");
      // Icon-Name direkt übernehmen (bereits in snake_case aus Figma)
      const nameSlug = setName;
      let filename = `db_ic_il_${categorySlug}_${nameSlug}.svg`;
      filename = cleanFilename(filename);

      const titleWords = setName
        .split(/[\s-_]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      const title = titleWords.join(" ");

      const tags: string[] = [category];
      if (parsed.en) tags.push(parsed.en);
      if (parsed.de) tags.push(parsed.de);
      if (parsed.keywords)
        tags.push(...parsed.keywords.split(",").map((k) => k.trim()));

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
      console.log(`  ✅ Added row: ${filename}`);
    });
  }

  csvRows.sort((a, b) => a.filename.localeCompare(b.filename));

  console.log(`🔧 Marketing CSV: ${csvRows.length} Zeilen generiert`);

  if (iconType === "illustrative") {
    const header =
      '"Original filename","Width","Title","Short Description","Categories","Free Tags","Realm"';
    return header + "\n" + csvRows.map((item) => item.row).join("\n") + "\n";
  }

  const result = csvRows.map((item) => item.row).join("\n") + "\n";
  console.log(`🔧 Marketing CSV Result length: ${result.length}`);
  return result;
}
