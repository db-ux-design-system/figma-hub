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

export interface IconEntry {
  name: string;
  id: string;
  category: string;
  description: string;
  parsedDescription: ParsedDescription;
}

export interface CategoryInfo {
  name: string;
  count: number;
}

export type ChangelogStatus =
  | "feat"
  | "fix"
  | "refactor"
  | "docs"
  | "chore"
  | "deprecated";

export interface SelectedIcon {
  icon: IconEntry;
  status: ChangelogStatus;
}

export interface ExportData {
  mode: "full" | "info-only" | null;
  gitlabJsonSelected: string;
  gitlabJsonAll: string;
  marketingCsv: string;
  iconType: string;
}
