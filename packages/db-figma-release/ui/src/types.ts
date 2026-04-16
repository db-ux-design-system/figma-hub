import type React from "react";

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
}

export interface ModuleViewProps {
  moduleId: string;
  moduleName: string;
  moduleDescription: string;
  sendMessage: (action: string, payload?: unknown) => void;
  onBack: () => void;
  initialVersion?: string;
  hasCanvasSelection?: boolean;
}

export type ModuleViewRegistry = Record<
  string,
  React.ComponentType<ModuleViewProps>
>;

/** Must match PluginToUIMessage in plugin/types.ts */
export interface PluginToUIMessage {
  type:
    | "modules"
    | "result"
    | "progress"
    | "error"
    | "storage"
    | "selectionVersion"
    | "publishStatus";
  module?: string;
  data?: unknown;
}

export interface ProgressUpdate {
  processed: number;
  total: number;
  currentComponent?: string;
}

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
