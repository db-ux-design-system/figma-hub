import slugify from "@sindresorhus/slugify";
import { Node } from "../data";
import { css_beautify, html_beautify } from "js-beautify";

export type HtmlNode = {
  tag?: string;
  props?: { [k: string]: string };
  children?: (text: string) => string;
};

export type ResolvedIcons = {
  leadingIcon?: string;
  trailingIcon?: string;
};

export type CssNode = {
  id: string;
  className: string;
  css: { [k: string]: string };
};

export type FrameworkTarget = "react" | "html";

export const getId = (node: Node): string =>
  slugify(`${node.type}-${node.id}`);

export const getClassName = (node: Node): string => slugify(node.name);

export const formatHtml = (code: string): string => {
  return html_beautify(code, {
    indent_size: 4,
    max_preserve_newlines: 1,
    preserve_newlines: true,
    indent_scripts: "normal",
    wrap_line_length: 40,
  });
};

export const formatCss = (code: string): string => {
  return css_beautify(code, {
    indent_size: 4,
    max_preserve_newlines: 1,
    preserve_newlines: true,
    wrap_line_length: 40,
  });
};
