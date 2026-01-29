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
  customPrefix?: string;
}

export interface ColorData {
  colors: Record<string, Record<string, ColorToken>>;
}

export interface ColorToken {
  $value: string;
}
