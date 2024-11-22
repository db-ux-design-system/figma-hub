import { VariableModeType } from "../data";

export type MigrationNode = {
  id: string;
  name: string;
  type: string;
} & VariableModeType;
