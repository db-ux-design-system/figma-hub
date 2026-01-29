// utils/variablesBinder.ts

import { VARIABLE_KEYS } from "../config";

async function importChangelogVariables(): Promise<{
  gap: Variable;
  padding: Variable;
  strokeWeight: Variable;
  fillColor: Variable;
  strokeColor: Variable;
  width: Variable;
}> {
  const [gap, padding, strokeWeight, fillColor, strokeColor, width] =
    await Promise.all([
      figma.variables.importVariableByKeyAsync(VARIABLE_KEYS.changelog.gap),
      figma.variables.importVariableByKeyAsync(VARIABLE_KEYS.changelog.padding),
      figma.variables.importVariableByKeyAsync(
        VARIABLE_KEYS.changelog.strokeWeight,
      ),
      figma.variables.importVariableByKeyAsync(
        VARIABLE_KEYS.changelog.fillColor,
      ),
      figma.variables.importVariableByKeyAsync(
        VARIABLE_KEYS.changelog.strokeColor,
      ),
      figma.variables.importVariableByKeyAsync(VARIABLE_KEYS.changelog.width),
    ]);

  return { gap, padding, strokeWeight, fillColor, strokeColor, width };
}

async function importChangelogHeadlineVariables(): Promise<{
  fontFamily: Variable;
  fontStyle: Variable;
  fontSize: Variable;
  lineHeight: Variable;
  paragraphSpacing: Variable;
  textColor: Variable;
}> {
  const [
    fontFamily,
    fontStyle,
    fontSize,
    lineHeight,
    paragraphSpacing,
    textColor,
  ] = await Promise.all([
    figma.variables.importVariableByKeyAsync(
      VARIABLE_KEYS.changelogHeadline.fontFamily,
    ),
    figma.variables.importVariableByKeyAsync(
      VARIABLE_KEYS.changelogHeadline.fontStyle,
    ),
    figma.variables.importVariableByKeyAsync(
      VARIABLE_KEYS.changelogHeadline.fontSize,
    ),
    figma.variables.importVariableByKeyAsync(
      VARIABLE_KEYS.changelogHeadline.lineHeight,
    ),
    figma.variables.importVariableByKeyAsync(
      VARIABLE_KEYS.changelogHeadline.paragraphSpacing,
    ),
    figma.variables.importVariableByKeyAsync(
      VARIABLE_KEYS.changelogHeadline.textColor,
    ),
  ]);

  return {
    fontFamily,
    fontStyle,
    fontSize,
    lineHeight,
    paragraphSpacing,
    textColor,
  };
}

async function importChangelogStatusVariables(): Promise<{
  gap: Variable;
}> {
  const gap = await figma.variables.importVariableByKeyAsync(
    VARIABLE_KEYS.changelogStatus.gap,
  );

  return { gap };
}

async function importChangelogIconsContainerVariables(): Promise<{
  gap: Variable;
}> {
  const gap = await figma.variables.importVariableByKeyAsync(
    VARIABLE_KEYS.changelogIconsContainer.gap,
  );

  return { gap };
}

export async function bindChangelogFrameVariables(
  frame: FrameNode,
): Promise<void> {
  try {
    const variables = await importChangelogVariables();

    frame.setBoundVariable("itemSpacing", variables.gap);
    frame.setBoundVariable("paddingTop", variables.padding);
    frame.setBoundVariable("paddingBottom", variables.padding);
    frame.setBoundVariable("paddingLeft", variables.padding);
    frame.setBoundVariable("paddingRight", variables.padding);
    frame.setBoundVariable("strokeWeight", variables.strokeWeight);
    frame.setBoundVariable("width", variables.width);

    // Bind fills and strokes on paint objects
    const fills = JSON.parse(JSON.stringify(frame.fills)) as Paint[];
    if (fills.length > 0 && fills[0].type === "SOLID") {
      (fills[0] as any).boundVariables = {
        color: { type: "VARIABLE_ALIAS", id: variables.fillColor.id },
      };
      frame.fills = fills;
    }

    const strokes = JSON.parse(JSON.stringify(frame.strokes)) as Paint[];
    if (strokes.length > 0 && strokes[0].type === "SOLID") {
      (strokes[0] as any).boundVariables = {
        color: { type: "VARIABLE_ALIAS", id: variables.strokeColor.id },
      };
      frame.strokes = strokes;
    }
  } catch (error) {
    console.warn(
      "⚠️ Changelog Frame Variablen konnten nicht verknüpft werden:",
      error,
    );
  }
}

export async function bindChangelogHeadlineVariables(
  text: TextNode,
): Promise<void> {
  try {
    const variables = await importChangelogHeadlineVariables();

    await figma.loadFontAsync(text.fontName as FontName);
    text.setBoundVariable("fontFamily", variables.fontFamily);
    text.setBoundVariable("fontStyle", variables.fontStyle);
    text.setBoundVariable("fontSize", variables.fontSize);
    text.setBoundVariable("lineHeight", variables.lineHeight);
    text.setBoundVariable("paragraphSpacing", variables.paragraphSpacing);
    text.setBoundVariable("fills", variables.textColor);
  } catch (error) {
    console.warn(
      "⚠️ Changelog Headline Variablen konnten nicht verknüpft werden:",
      error,
    );
  }
}

export async function bindChangelogStatusFrameVariables(
  frame: FrameNode,
): Promise<void> {
  try {
    const variables = await importChangelogStatusVariables();

    frame.setBoundVariable("itemSpacing", variables.gap);
  } catch (error) {
    console.warn(
      "⚠️ Changelog Status Frame Variablen konnten nicht verknüpft werden:",
      error,
    );
  }
}

export async function bindChangelogIconsContainerVariables(
  frame: FrameNode,
): Promise<void> {
  try {
    const variables = await importChangelogIconsContainerVariables();

    frame.setBoundVariable("itemSpacing", variables.gap);
    frame.setBoundVariable("counterAxisSpacing", variables.gap);
  } catch (error) {
    console.warn(
      "⚠️ Changelog Icons Container Variablen konnten nicht verknüpft werden:",
      error,
    );
  }
}
