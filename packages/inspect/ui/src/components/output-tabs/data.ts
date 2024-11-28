import {Node} from "shared/data.ts";


export const storageKey: string = "language";

export type OutputTabsProps = {
  code: Node;
  cssCode?: Node | null;
  selectLanguage?: string | null;
};
