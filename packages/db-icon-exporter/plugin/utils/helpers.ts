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

export function toHyphenatedKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}

export function cleanFilename(filename: string): string {
  return filename
    .replace(/-/g, "_")
    .replace(/__+/g, "_");
}
