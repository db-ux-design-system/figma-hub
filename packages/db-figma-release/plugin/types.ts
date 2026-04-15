/** Definiert den Vertrag, den jedes Modul erfüllen muss */
export interface PluginModule {
  id: string;
  name: string;
  description: string;
  execute(action: string, payload?: unknown): Promise<ModuleResult>;
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

/** Nachricht von UI an Plugin */
export interface UIToPluginMessage {
  type: "execute" | "getModules" | "getStorage" | "setStorage";
  module?: string;
  action?: string;
  payload?: unknown;
}

/** Nachricht von Plugin an UI */
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
