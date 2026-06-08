// utils/helpers.ts

export function extractIconBaseName(fullName: string): string {
  return fullName.split("/")[0].trim();
}

export function extractIconSize(fullName: string): number | null {
  const sizeMatch = fullName.match(/size=(\d+)/i);
  return sizeMatch ? parseInt(sizeMatch[1]) : null;
}

export function isFilledVariant(fullName: string): boolean {
  return /variant=filled/i.test(fullName) || /,\s*filled/i.test(fullName);
}

export function toHyphenatedKey(name: string, iconType?: string): string {
  // Icon-Namen direkt übernehmen, da sie bereits im richtigen Format aus Figma kommen
  // Funktionale: kebab-case, Illustrative: snake_case
  return name;
}

export function cleanFilename(filename: string): string {
  // Entfernt doppelte Unterstriche/Bindestriche
  return filename.replace(/__+/g, "_").replace(/--+/g, "-");
}
