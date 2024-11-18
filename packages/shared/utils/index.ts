const clearAndUpper = (text: string) => text.replace(/-/, "").toUpperCase();

export const toPascalCase = (text: string) =>
  text.replace(/(^\w|-\w)/g, clearAndUpper);

export const toCamelCase = (text: string) =>
  text.replace(/-\w/g, clearAndUpper);

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
