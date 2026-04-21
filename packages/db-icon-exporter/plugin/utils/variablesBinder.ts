// utils/variablesBinder.ts

import { VARIABLE_KEYS } from "../config";
import { PaintWithBoundVariables } from "../types";

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
    const fills = JSON.parse(
      JSON.stringify(frame.fills),
    ) as PaintWithBoundVariables[];
    if (fills.length > 0 && fills[0].type === "SOLID") {
      fills[0].boundVariables = {
        color: { type: "VARIABLE_ALIAS", id: variables.fillColor.id },
      };
      frame.fills = fills;
    }

    const strokes = JSON.parse(
      JSON.stringify(frame.strokes),
    ) as PaintWithBoundVariables[];
    if (strokes.length > 0 && strokes[0].type === "SOLID") {
      strokes[0].boundVariables = {
        color: { type: "VARIABLE_ALIAS", id: variables.strokeColor.id },
      };
      frame.strokes = strokes;
    }
  } catch (error) {
    console.warn("⚠️ Changelog frame variables could not be bound:", error);
  }
}

export async function bindChangelogHeadlineVariables(
  text: TextNode,
): Promise<void> {
  try {
    const variables = await importChangelogHeadlineVariables();

    // Get the variable values for fontFamily and fontStyle
    const fontFamilyVar = variables.fontFamily;
    const fontStyleVar = variables.fontStyle;

    // Collect all unique font combinations across all modes so the correct
    // font is available regardless of which mode is currently active.
    const fontsToLoad: Array<{ family: string; style: string }> = [];

    try {
      const collection = await figma.variables.getVariableCollectionByIdAsync(
        fontFamilyVar.variableCollectionId,
      );

      if (collection && collection.modes.length > 0) {
        for (const mode of collection.modes) {
          const familyValue = fontFamilyVar.valuesByMode[mode.modeId];
          const styleValue = fontStyleVar.valuesByMode[mode.modeId];

          if (
            typeof familyValue === "string" &&
            typeof styleValue === "string"
          ) {
            // Avoid duplicates
            const alreadyAdded = fontsToLoad.some(
              (f) => f.family === familyValue && f.style === styleValue,
            );
            if (!alreadyAdded) {
              fontsToLoad.push({ family: familyValue, style: styleValue });
            }
          }
        }
      }
    } catch (varError) {
      console.warn("⚠️ Could not read font values from variables:", varError);
    }

    // Always include Inter as ultimate fallback
    if (fontsToLoad.length === 0) {
      fontsToLoad.push({ family: "Inter", style: "Regular" });
    }

    // Load all font variants so the bound variable works in every mode
    for (const font of fontsToLoad) {
      try {
        await figma.loadFontAsync(font);
        console.log(`✅ Font loaded: ${font.family} ${font.style}`);
      } catch (fontError) {
        console.warn(
          `⚠️ Font ${font.family} ${font.style} could not be loaded, using fallback`,
        );
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      }
    }

    // Now bind all variables
    text.setBoundVariable("fontFamily", variables.fontFamily);
    text.setBoundVariable("fontStyle", variables.fontStyle);
    text.setBoundVariable("fontSize", variables.fontSize);
    text.setBoundVariable("lineHeight", variables.lineHeight);
    text.setBoundVariable("paragraphSpacing", variables.paragraphSpacing);

    // Bind text color variable correctly
    // For text fills, we need to bind to the paint's color property
    const fills = JSON.parse(
      JSON.stringify(text.fills),
    ) as PaintWithBoundVariables[];
    if (fills.length > 0 && fills[0].type === "SOLID") {
      fills[0].boundVariables = {
        color: { type: "VARIABLE_ALIAS", id: variables.textColor.id },
      };
      text.fills = fills;
    }

    console.log("✅ Changelog headline variables successfully bound");
  } catch (error) {
    console.warn("⚠️ Changelog headline variables could not be bound:", error);
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
      "⚠️ Changelog status frame variables could not be bound:",
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
      "⚠️ Changelog icons container variables could not be bound:",
      error,
    );
  }
}
