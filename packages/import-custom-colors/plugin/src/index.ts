import { UiMessageImportColors } from "shared/data";
import { sendMessage } from "shared/figma";

interface CustomColor {
  name: string;
  hex: string;
}

interface DesignTokenColor {
  $type: "color";
  $value: string;
}

interface DesignTokensSchema {
  colors: {
    [category: string]: {
      [tokenName: string]: DesignTokenColor;
    };
  };
}

export const handleImportCustomColors = () => {
  figma.showUI(__html__, { height: 600, width: 400 });
  
  figma.ui.onmessage = async (msg: UiMessageImportColors) => {
    try {
      if (msg.type === "import-json") {
        sendMessage<string>({ type: "loading", data: "Processing design token JSON file..." });
        const jsonData = (msg.data as { jsonData: string }).jsonData;
        const colors = parseDesignTokensJson(jsonData);
        await importColorsFromTokens(colors);
        sendMessage<string>({ type: "success", data: `Imported ${colors.length} colors from design tokens!` });
      }
    } catch (error) {
      console.error("Error importing colors:", error);
      sendMessage<string>({ 
        type: "error", 
        data: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  };
};

const parseDesignTokensJson = (jsonString: string): CustomColor[] => {
  try {
    const tokens: DesignTokensSchema = JSON.parse(jsonString);
    const colors: CustomColor[] = [];
    
    if (!tokens.colors) {
      throw new Error("Invalid JSON format: 'colors' property not found");
    }
    
    Object.entries(tokens.colors).forEach(([category, categoryColors]) => {
      Object.entries(categoryColors).forEach(([tokenName, token]) => {
        if (token.$type === "color" && token.$value) {
          colors.push({
            name: `${category}/${tokenName}`,
            hex: token.$value
          });
        }
      });
    });
    
    return colors;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Invalid format'}`);
  }
};

const importColorsFromTokens = async (colors: CustomColor[]) => {
  // Create base colors frame
  await createColorFrame(colors, "Base Colors", true);
  
  // Create variable collection for light and dark modes
  await createVariableCollection(colors);
};

const createVariableCollection = async (colors: CustomColor[]) => {
  try {
    // Group colors by category
    const colorsByCategory = new Map<string, CustomColor[]>();
    colors.forEach((color) => {
      const parts = color.name.split('/');
      const category = parts[0];
      if (!colorsByCategory.has(category)) {
        colorsByCategory.set(category, []);
      }
      colorsByCategory.get(category)!.push({
        name: parts[1] || parts[0],
        hex: color.hex
      });
    });

    // Create Base Colors collection
    const baseColorsCollection = figma.variables.createVariableCollection("Base Colors");
    const defaultMode = baseColorsCollection.modes[0];
    defaultMode.name = "Default";

    // Create variables for each category in Base Colors collection
    const baseColorVariables = new Map<string, Variable>();
    
    colorsByCategory.forEach((categoryColors, category) => {
      categoryColors.forEach((color) => {
        const variableName = `${category}/${color.name}`;
        const variable = figma.variables.createVariable(variableName, baseColorsCollection, "COLOR");
        
        const rgb = hexToRgb(color.hex);
        if (rgb) {
          const figmaColor = { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 };
          variable.setValueForMode(defaultMode.modeId, figmaColor);
          baseColorVariables.set(variableName, variable);
        }
      });
    });

    // Create Mode collection with Light and Dark modes
    const modeCollection = figma.variables.createVariableCollection("Mode");
    const lightMode = modeCollection.modes[0];
    lightMode.name = "Light Mode";
    const darkMode = modeCollection.addMode("Dark Mode");

    // Create semantic color variables with aliases
    colorsByCategory.forEach((categoryColors, category) => {
      // Create bg semantic variables
      const bgBasicLevel1Variable = figma.variables.createVariable(`${category}/bg/basic/level-1`, modeCollection, "COLOR");
      const bgBasicLevel1HoveredVariable = figma.variables.createVariable(`${category}/bg/basic/level-1/hovered`, modeCollection, "COLOR");
      const bgBasicLevel1PressedVariable = figma.variables.createVariable(`${category}/bg/basic/level-1/pressed`, modeCollection, "COLOR");

      // Set up aliases for light mode (using high numbers for light backgrounds)
      const lightBaseVariable = baseColorVariables.get(`${category}/14`) || baseColorVariables.get(`${category}/origin-light-default`);
      const lightHoveredVariable = baseColorVariables.get(`${category}/13`) || baseColorVariables.get(`${category}/origin-light-hovered`);
      const lightPressedVariable = baseColorVariables.get(`${category}/12`) || baseColorVariables.get(`${category}/origin-light-pressed`);

      // Set up aliases for dark mode (using low numbers for dark backgrounds)  
      const darkBaseVariable = baseColorVariables.get(`${category}/1`) || baseColorVariables.get(`${category}/origin-dark-default`);
      const darkHoveredVariable = baseColorVariables.get(`${category}/3`) || baseColorVariables.get(`${category}/origin-dark-hovered`);
      const darkPressedVariable = baseColorVariables.get(`${category}/2`) || baseColorVariables.get(`${category}/origin-dark-pressed`);

      if (lightBaseVariable && darkBaseVariable) {
        // Create aliases to Base Colors collection variables
        bgBasicLevel1Variable.setValueForMode(lightMode.modeId, figma.variables.createVariableAlias(lightBaseVariable));
        bgBasicLevel1Variable.setValueForMode(darkMode.modeId, figma.variables.createVariableAlias(darkBaseVariable));
      }

      if (lightHoveredVariable && darkHoveredVariable) {
        bgBasicLevel1HoveredVariable.setValueForMode(lightMode.modeId, figma.variables.createVariableAlias(lightHoveredVariable));
        bgBasicLevel1HoveredVariable.setValueForMode(darkMode.modeId, figma.variables.createVariableAlias(darkHoveredVariable));
      }

      if (lightPressedVariable && darkPressedVariable) {
        bgBasicLevel1PressedVariable.setValueForMode(lightMode.modeId, figma.variables.createVariableAlias(lightPressedVariable));
        bgBasicLevel1PressedVariable.setValueForMode(darkMode.modeId, figma.variables.createVariableAlias(darkPressedVariable));
      }

      // Create text color variables  
      const textBasicDefaultVariable = figma.variables.createVariable(`${category}/text/basic/default`, modeCollection, "COLOR");
      const textBasicHoveredVariable = figma.variables.createVariable(`${category}/text/basic/hovered`, modeCollection, "COLOR");
      const textBasicPressedVariable = figma.variables.createVariable(`${category}/text/basic/pressed`, modeCollection, "COLOR");

      // Text colors use opposite logic - dark text on light backgrounds, light text on dark backgrounds
      const lightTextVariable = baseColorVariables.get(`${category}/1`) || baseColorVariables.get(`${category}/on-origin-light-default`);
      const darkTextVariable = baseColorVariables.get(`${category}/14`) || baseColorVariables.get(`${category}/on-origin-dark-default`);

      if (lightTextVariable && darkTextVariable) {
        textBasicDefaultVariable.setValueForMode(lightMode.modeId, figma.variables.createVariableAlias(lightTextVariable));
        textBasicDefaultVariable.setValueForMode(darkMode.modeId, figma.variables.createVariableAlias(darkTextVariable));
        
        textBasicHoveredVariable.setValueForMode(lightMode.modeId, figma.variables.createVariableAlias(lightTextVariable));
        textBasicHoveredVariable.setValueForMode(darkMode.modeId, figma.variables.createVariableAlias(darkTextVariable));
        
        textBasicPressedVariable.setValueForMode(lightMode.modeId, figma.variables.createVariableAlias(lightTextVariable));
        textBasicPressedVariable.setValueForMode(darkMode.modeId, figma.variables.createVariableAlias(darkTextVariable));
      }

      // Create border color variables
      const borderBasicDefaultVariable = figma.variables.createVariable(`${category}/border/basic/default`, modeCollection, "COLOR");
      const borderBasicHoveredVariable = figma.variables.createVariable(`${category}/border/basic/hovered`, modeCollection, "COLOR");
      const borderBasicPressedVariable = figma.variables.createVariable(`${category}/border/basic/pressed`, modeCollection, "COLOR");

      // Border colors use mid-range values
      const lightBorderVariable = baseColorVariables.get(`${category}/7`) || baseColorVariables.get(`${category}/origin-light-default`);
      const darkBorderVariable = baseColorVariables.get(`${category}/7`) || baseColorVariables.get(`${category}/origin-dark-default`);

      if (lightBorderVariable && darkBorderVariable) {
        borderBasicDefaultVariable.setValueForMode(lightMode.modeId, figma.variables.createVariableAlias(lightBorderVariable));
        borderBasicDefaultVariable.setValueForMode(darkMode.modeId, figma.variables.createVariableAlias(darkBorderVariable));
        
        borderBasicHoveredVariable.setValueForMode(lightMode.modeId, figma.variables.createVariableAlias(lightBorderVariable));
        borderBasicHoveredVariable.setValueForMode(darkMode.modeId, figma.variables.createVariableAlias(darkBorderVariable));
        
        borderBasicPressedVariable.setValueForMode(lightMode.modeId, figma.variables.createVariableAlias(lightBorderVariable));
        borderBasicPressedVariable.setValueForMode(darkMode.modeId, figma.variables.createVariableAlias(darkBorderVariable));
      }
    });

    sendMessage<string>({ 
      type: "success", 
      data: `Created Base Colors collection with ${baseColorVariables.size} variables and Mode collection with semantic color aliases for ${colorsByCategory.size} categories` 
    });
  } catch (error) {
    console.warn("Could not create variable collections:", error);
    sendMessage<string>({ 
      type: "error", 
      data: `Failed to create variable collections: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
};

const createColorFrame = async (colors: CustomColor[], frameName: string, isBaseColors: boolean) => {
  // Get the current page
  const currentPage = figma.currentPage;
  
  // Create or find a color palette frame
  let colorFrame = currentPage.findOne(node => 
    node.type === "FRAME" && node.name === frameName
  ) as FrameNode;
  
  if (!colorFrame) {
    colorFrame = figma.createFrame();
    colorFrame.name = frameName;
    colorFrame.resize(800, Math.max(400, Math.ceil(colors.length / 8) * 100));
    colorFrame.x = 0;
    colorFrame.y = 0;
    colorFrame.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.98 } }];
  }
  
  // Clear existing colors in the frame
  colorFrame.children.forEach(child => child.remove());
  
  // Create color swatches
  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    const col = i % 8;
    const row = Math.floor(i / 8);
    
    // Convert hex to RGB
    const rgb = hexToRgb(color.hex);
    if (!rgb) {
      console.warn(`Invalid hex color: ${color.hex}`);
      continue;
    }
    
    // Create color swatch
    const swatch = figma.createRectangle();
    swatch.resize(80, 80);
    swatch.x = col * 90 + 20;
    swatch.y = row * 90 + 60;
    swatch.fills = [{
      type: "SOLID",
      color: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 }
    }];
    swatch.name = color.name;
    
    // Add color name text
    const text = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    text.characters = color.name;
    text.fontSize = 10;
    text.x = col * 90 + 20;
    text.y = row * 90 + 145;
    text.resize(80, 20);
    text.textAlignHorizontal = "CENTER";
    
    // Add hex value text
    const hexText = figma.createText();
    hexText.characters = color.hex.toUpperCase();
    hexText.fontSize = 8;
    hexText.x = col * 90 + 20;
    hexText.y = row * 90 + 160;
    hexText.resize(80, 16);
    hexText.textAlignHorizontal = "CENTER";
    hexText.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
    
    // Add to frame
    colorFrame.appendChild(swatch);
    colorFrame.appendChild(text);
    colorFrame.appendChild(hexText);
    
    // Create local paint style
    const paintStyle = figma.createPaintStyle();
    const styleCategory = isBaseColors ? "Base Colors" : "Custom Colors";
    paintStyle.name = `${styleCategory}/${color.name}`;
    paintStyle.paints = [{
      type: "SOLID",
      color: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 }
    }];
  }
  
  // Focus on the color frame
  figma.viewport.scrollAndZoomIntoView([colorFrame]);
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

if (figma.editorType === "figma") {
  handleImportCustomColors();
}