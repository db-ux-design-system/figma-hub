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
