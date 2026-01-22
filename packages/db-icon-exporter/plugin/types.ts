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

export interface IconData {
  name: string;
  id: string;
  category: string;
  description: string;
  parsedDescription: ParsedDescription;
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
