/** Definiert den Vertrag, den jedes Modul erfüllen muss */
export interface PluginModule {
  /** Eindeutiger Bezeichner des Moduls */
  id: string;
  /** Anzeigename für die UI */
  name: string;
  /** Kurzbeschreibung der Funktionalität */
  description: string;
  /** Verarbeitet eine Aktion mit optionalem Payload */
  execute(action: string, payload?: unknown): Promise<ModuleResult>;
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

/** Nachricht von UI an Plugin */
export interface UIToPluginMessage {
  type: "execute" | "getModules" | "getStorage";
  module?: string;
  action?: string;
  payload?: unknown;
}

/** Nachricht von Plugin an UI */
export interface PluginToUIMessage {
  type: "modules" | "result" | "progress" | "error" | "storage";
  module?: string;
  data?: unknown;
}

/** Fortschritts-Update während einer Operation */
export interface ProgressUpdate {
  processed: number;
  total: number;
  currentComponent?: string;
}
