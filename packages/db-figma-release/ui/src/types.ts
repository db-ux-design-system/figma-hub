import type React from "react";

/** Modul-Metadaten für die UI-Navigation */
export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
}

/** UI-Modul-Komponente Props */
export interface ModuleViewProps {
  moduleId: string;
  sendMessage: (action: string, payload?: unknown) => void;
}

/** Mapping von Modul-ID zu React-Komponente */
export type ModuleViewRegistry = Record<
  string,
  React.ComponentType<ModuleViewProps>
>;

/** Nachricht von Plugin an UI */
export interface PluginToUIMessage {
  type: "modules" | "result" | "progress" | "error" | "storage";
  module?: string;
  data?: unknown;
}

/** Fortschritts-Update */
export interface ProgressUpdate {
  processed: number;
  total: number;
  currentComponent?: string;
}

/** Ergebnis einer Modul-Ausführung */
export interface ModuleResult {
  success: boolean;
  data?: unknown;
  errors?: ModuleError[];
}

export interface ModuleError {
  componentName: string;
  componentId: string;
  message: string;
}
