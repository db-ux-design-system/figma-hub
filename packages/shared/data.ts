export type PluginMessage<T> = {
  type:
    | "baseData"
    | "cssData"
    | "selectionchange"
    | "loading"
    | "error"
    | "storage";
  data: T;
};

export type OutputNode = {
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
  children?: OutputNode[];
  variantProperties?: { [p: string]: string } | null;
  componentProperties?: Record<string, string | boolean>;
  mainComponentName?: string;
  componentName?: string;
};

export type UiMessage = {
  type: "generate" | "css" | "notify" | "setStorage" | "getStorage";
  data?: any;
};
