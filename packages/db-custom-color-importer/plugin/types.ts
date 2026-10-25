export type VariableScope =
  | "ALL_SCOPES"
  | "ALL_FILLS"
  | "FRAME_FILL"
  | "SHAPE_FILL"
  | "TEXT_FILL"
  | "STROKE_COLOR"
  | "EFFECT_COLOR";

export interface Mapping {
  name: string;
  light: string | number;
  dark: string | number;
  key: string;
}

export interface ImportMessage {
  type: string;
  data: ColorData;
  deleteMissing: boolean;
  fileName?: string;
  themePrefix?: string;
  variablePrefix?: string;
}

export interface ColorData {
  colors: Record<string, Record<string, ColorToken>>;
}

export interface ColorToken {
  $value: string;
}
