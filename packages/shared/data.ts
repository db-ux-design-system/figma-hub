export type PluginMessage<T> = {
  type:
    | "config"
    | "update"
    | "data"
    | "cssData"
    | "selectionchange"
    | "loading"
    | "error"
    | "storage"
    | "counter";
  data: T;
};

export type VariableModeType = {
  collectionId?: string;
  collectionName?: string;
  modeId?: string;
  foundModeName?: string;
};

export type Node = {
  type: "FRAME" | "TEXT" | "INSTANCE" | "GROUP" | string;
  name: string;
  id: string;
  text?: string;
  fontName?:
    | {
        family: string;
        style: string;
      }
    // @ts-ignore
    | unique symbol;
  css?: {
    [key: string]: string;
  };
  variantProperties?: { [p: string]: string } | null;
  componentProperties?: Record<string, string | boolean>;
  mainComponentName?: string;
  componentName?: string;

  // Modes
  modes?: VariableModeType[];

  children?: Node[];
};

export type UiMessage = {
  type: "generate" | "css" | "notify" | "setStorage" | "getStorage";
  data?: any;
};

export type UiMessageDesignMigration = {
  type: "analyze";
  data?: any;
};
