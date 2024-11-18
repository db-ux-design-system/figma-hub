import {OutputNode} from "shared/data.ts";


export const storageKey: string = "language";

export type OutputTabsProps = {
  code: OutputNode;
  cssCode?: OutputNode | null;
  selectLanguage?: string | null;
};
