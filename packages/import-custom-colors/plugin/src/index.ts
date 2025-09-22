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
  figma.showUI(__html__, { height: 700, width: 450 });
  
  figma.ui.onmessage = async (msg: UiMessageImportColors) => {
    try {
      if (msg.type === "import-colors") {
        sendMessage<string>({ type: "loading", data: "Importing custom colors..." });
        await importColors(msg.data as CustomColor[]);
        sendMessage<string>({ type: "success", data: "Colors imported successfully!" });
      } else if (msg.type === "import-json") {
        sendMessage<string>({ type: "loading", data: "Processing JSON file..." });
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
    // Create a new variable collection
    const collection = figma.variables.createVariableCollection("Design Tokens");
    
    // Create light and dark modes
    const lightMode = collection.modes[0]; // Default mode is light
    lightMode.name = "Light";
    const darkMode = collection.addMode("Dark");
    
    // Create variables for each color
    colors.forEach((color) => {
      const variable = figma.variables.createVariable(color.name, collection, "COLOR");
      
      // Convert hex to RGB for light mode
      const rgb = hexToRgb(color.hex);
      if (rgb) {
        const figmaColor = { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 };
        variable.setValueForMode(lightMode.modeId, figmaColor);
        variable.setValueForMode(darkMode.modeId, figmaColor); // Using same color for both modes initially
      }
    });
    
    sendMessage<string>({ type: "success", data: `Created variable collection with ${colors.length} color variables` });
  } catch (error) {
    console.warn("Could not create variable collection:", error);
    // Fallback to regular paint styles
  }
};

const importColors = async (colors: CustomColor[]) => {
  await createColorFrame(colors, "Custom Color Palette", false);
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