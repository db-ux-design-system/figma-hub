// utils/variablesBinder.ts

import { VARIABLE_KEYS } from "../config";

async function importChangelogVariables(): Promise<{
  gap: Variable;
  padding: Variable;
}> {
  const [gap, padding] = await Promise.all([
    figma.variables.importVariableByKeyAsync(VARIABLE_KEYS.changelog.gap),
    figma.variables.importVariableByKeyAsync(VARIABLE_KEYS.changelog.padding),
  ]);

  return { gap, padding };
}

async function importChangelogHeadlineVariables(): Promise<{
  fontFamily: Variable;
  fontStyle: Variable;
  fontSize: Variable;
  lineHeight: Variable;
  paragraphSpacing: Variable;
}> {
  const [fontFamily, fontStyle, fontSize, lineHeight, paragraphSpacing] = await Promise.all([
    figma.variables.importVariableByKeyAsync(VARIABLE_KEYS.changelogHeadline.fontFamily),
    figma.variables.importVariableByKeyAsync(VARIABLE_KEYS.changelogHeadline.fontStyle),
    figma.variables.importVariableByKeyAsync(VARIABLE_KEYS.changelogHeadline.fontSize),
    figma.variables.importVariableByKeyAsync(VARIABLE_KEYS.changelogHeadline.lineHeight),
    figma.variables.importVariableByKeyAsync(VARIABLE_KEYS.changelogHeadline.paragraphSpacing),
  ]);

  return { fontFamily, fontStyle, fontSize, lineHeight, paragraphSpacing };
}

async function importChangelogStatusVariables(): Promise<{
  gap: Variable;
}> {
  const gap = await figma.variables.importVariableByKeyAsync(
    VARIABLE_KEYS.changelogStatus.gap
  );

  return { gap };
}

export async function bindChangelogFrameVariables(
  frame: FrameNode
): Promise<void> {
  try {
    const variables = await importChangelogVariables();

    frame.setBoundVariable("itemSpacing", variables.gap);
    frame.setBoundVariable("paddingTop", variables.padding);
    frame.setBoundVariable("paddingBottom", variables.padding);
    frame.setBoundVariable("paddingLeft", variables.padding);
    frame.setBoundVariable("paddingRight", variables.padding);
  } catch (error) {
    console.warn("⚠️ Changelog Frame Variablen konnten nicht verknüpft werden:", error);
  }
}

export async function bindChangelogHeadlineVariables(
  text: TextNode
): Promise<void> {
  try {
    const variables = await importChangelogHeadlineVariables();

    await figma.loadFontAsync(text.fontName as FontName);
    text.setBoundVariable("fontFamily", variables.fontFamily);
    text.setBoundVariable("fontStyle", variables.fontStyle);
    text.setBoundVariable("fontSize", variables.fontSize);
    text.setBoundVariable("lineHeight", variables.lineHeight);
    text.setBoundVariable("paragraphSpacing", variables.paragraphSpacing);
  } catch (error) {
    console.warn("⚠️ Changelog Headline Variablen konnten nicht verknüpft werden:", error);
  }
}

export async function bindChangelogStatusFrameVariables(
  frame: FrameNode
): Promise<void> {
  try {
    const variables = await importChangelogStatusVariables();

    frame.setBoundVariable("itemSpacing", variables.gap);
  } catch (error) {
    console.warn("⚠️ Changelog Status Frame Variablen konnten nicht verknüpft werden:", error);
  }
}
