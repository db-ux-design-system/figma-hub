/**
 * Hardcoded library definitions.
 *
 * Each entry maps a Figma file key to a human-readable name.
 * The file key is the part of the Figma URL: figma.com/design/<fileKey>/…
 *
 * Only files listed here can use the Changelog module.
 * The Stamping module is available in all files.
 */

export interface LibraryDefinition {
  name: string;
  fileKey: string;
}

export const LIBRARIES: LibraryDefinition[] = [
  { name: "Core Foundation", fileKey: "HiaxnfH92ilbE4gfboFMA0" },
  { name: "Core Components", fileKey: "mlJ6R0GkfR15a93KSlqXtB" },
  { name: "Core Lab", fileKey: "jS7unqZw51v07eYyXR6qP0" },
];

/**
 * Finds the library definition matching the given file key.
 */
export function findLibraryByFileKey(
  fileKey: string,
): LibraryDefinition | undefined {
  return LIBRARIES.find((lib) => lib.fileKey === fileKey);
}

/**
 * Checks whether the given file key belongs to a known library.
 */
export function isKnownLibrary(fileKey: string): boolean {
  return LIBRARIES.some((lib) => lib.fileKey === fileKey);
}

/**
 * Checks whether a document name matches a library entry.
 * Uses a "contains" check so that names like
 * "DB UX DS v3 - Core Components - v4.8.0" still match "Core Components".
 */
export function documentMatchesLibrary(
  documentName: string,
  library: LibraryDefinition,
): boolean {
  return documentName.toLowerCase().includes(library.name.toLowerCase());
}

/**
 * Finds a library whose name is contained in the given document name.
 */
export function findLibraryByDocumentName(
  documentName: string,
): LibraryDefinition | undefined {
  const normalized = documentName.trim().toLowerCase();
  return LIBRARIES.find((lib) => normalized.includes(lib.name.toLowerCase()));
}
