// types.ts

export interface ParsedDescriptionFunctional {
  enDefault: string;
  enContextual: string;
  deDefault: string;
  deContextual: string;
  keywords: string;
}

export interface ParsedDescriptionIllustrative {
  en: string;
  de: string;
  keywords: string;
}

export type ParsedDescription =
  | ParsedDescriptionFunctional
  | ParsedDescriptionIllustrative;

// Package-related types for spatial detection
export const PACKAGE_NAMES = ["Core", "RI", "InfraGO", "Movas"] as const;
export type PackageName = (typeof PACKAGE_NAMES)[number];

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PackageFrame {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IconData {
  name: string;
  id: string;
  category: string;
  description: string;
  parsedDescription: ParsedDescription;
  package?: string; // Optional for now, will be populated by scanner in later tasks
}

export type ChangelogStatus =
  | "feat"
  | "fix"
  | "refactor"
  | "docs"
  | "chore"
  | "deprecated";

export interface ExportRequest {
  type: "EXPORT_FULL" | "EXPORT_INFO_ONLY";
  selectedIconIds: string[];
  version: string | null;
  generateOverview: boolean;
  iconStatuses?: Record<string, ChangelogStatus>;
}
