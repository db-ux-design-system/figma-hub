/**
 * Known DB UX Design System libraries.
 *
 * The `name` is used as a fuzzy identifier: a Figma document is considered
 * a match when its name *contains* the library name (case-insensitive).
 * This way version suffixes like "v4.8.0" or prefixes like "DB UX DS v3 -"
 * don't break detection.
 */

export interface LibraryEntry {
  name: string;
  fileKey: string;
  /** Prefix for changelog entry titles, e.g. "Core" or "🧪 Core Lab" */
  changelogTitle: string;
  /** Prefix for version numbers, e.g. "v" or "lab" */
  versionPrefix: string;
}

export const LIBRARIES: LibraryEntry[] = [
  {
    name: "Core Foundation",
    fileKey: "HiaxnfH92ilbE4gfboFMA0",
    changelogTitle: "Core Foundation",
    versionPrefix: "v",
  },
  {
    name: "Core Components",
    fileKey: "mlJ6R0GkfR15a93KSlqXtB",
    changelogTitle: "Core",
    versionPrefix: "v",
  },
  {
    name: "Core Lab",
    fileKey: "jS7unqZw51v07eYyXR6qP0",
    changelogTitle: "🧪 Core Lab",
    versionPrefix: "lab",
  },
];

export function findLibraryByFileKey(
  fileKey: string,
): LibraryEntry | undefined {
  return LIBRARIES.find((lib) => lib.fileKey === fileKey);
}

/**
 * Checks whether a document name matches a library entry.
 * Uses a "contains" check so that names like
 * "DB UX DS v3 - Core Components - v4.8.0" still match "Core Components".
 */
export function documentMatchesLibrary(
  documentName: string,
  library: LibraryEntry,
): boolean {
  return documentName.toLowerCase().includes(library.name.toLowerCase());
}

/**
 * Finds a library whose name is contained in the given document name.
 */
export function findLibraryByDocumentName(
  documentName: string,
): LibraryEntry | undefined {
  const normalized = documentName.trim().toLowerCase();
  return LIBRARIES.find((lib) => normalized.includes(lib.name.toLowerCase()));
}
