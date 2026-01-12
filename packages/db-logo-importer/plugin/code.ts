figma.showUI(__html__, { width: 500, height: 380 });

/**
 * CONFIGURATION: Centralized IDs and Constants
 */
const CONFIG = {
  keys: {
    dbLogo: "998998d67d3ebef6f2692db932bce69431b3d0cc",
    logoAddition: "497497bca9694f6004d1667de59f1a903b3cd3ef",
    componentHeight: "a86f4bd0e008abb3435ff1dcbe25042ae9fef2d6",
  },
  targetHeight: 24,
};

figma.ui.onmessage = async (msg) => {
  if (msg.type === "import-svg") {
    const { svg: svgText, filename } = msg;

    if (!svgText || !svgText.includes("<svg")) {
      figma.notify("Error: Invalid SVG data received.");
      return;
    }

    try {
      // 1. Initial SVG creation
      const svgNode = figma.createNodeFromSvg(svgText);
      const cleanName = (filename || "Imported Logo").replace(/\.[^/.]+$/, "");

      // 2. Layer Processing (Flattening & Renaming)
      if (svgNode.type === "FRAME") {
        const vectors = svgNode.children.filter(
          (c) => c.type === "VECTOR" && c.name === "Vector"
        );
        if (vectors.length > 0) {
          const flattened = figma.flatten(vectors, svgNode);
          flattened.name = "Logo Addition";
        }

        const group = svgNode.children.find((c) => c.type === "GROUP");
        if (group) {
          const flattenedGroup = figma.flatten([group], svgNode);
          flattenedGroup.name = "DB Logo";
        }
      }

      // 3. Component Creation
      const component = figma.createComponent();
      component.name = cleanName;
      svgNode.name = "SVG Container";

      component.appendChild(svgNode);
      figma.currentPage.appendChild(component);

      // 4. Scaling and Auto Layout Setup
      const scale = CONFIG.targetHeight / svgNode.height;
      const newWidth = svgNode.width * scale;
      svgNode.resize(newWidth, CONFIG.targetHeight);

      component.layoutMode = "HORIZONTAL";
      component.primaryAxisSizingMode = "AUTO"; // Hug Width
      component.counterAxisSizingMode = "FIXED"; // Fixed Height

      component.paddingLeft = 0;
      component.paddingRight = 0;
      component.paddingTop = 0;
      component.paddingBottom = 0;
      component.itemSpacing = 0;

      // Configure Layout Setup Container
      component.children[0].lockAspectRatio();
      component.children[0].layoutGrow = 1;

      // 5. Positioning in Center of Viewport
      const viewCenter = figma.viewport.center;
      component.x = viewCenter.x - component.width / 2;
      component.y = viewCenter.y - component.height / 2;

      try {
        const [varDB, varAdd, varHeight] = await Promise.all([
          figma.variables.importVariableByKeyAsync(CONFIG.keys.dbLogo),
          figma.variables.importVariableByKeyAsync(CONFIG.keys.logoAddition),
          figma.variables.importVariableByKeyAsync(CONFIG.keys.componentHeight),
        ]);

        const bindFill = (layerName: string, variable: Variable) => {
          const target = component.findOne((n) => n.name === layerName);
          if (target && "fills" in target) {
            const paint = figma.variables.setBoundVariableForPaint(
              { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
              "color",
              variable
            );
            target.fills = [paint];
          }
        };

        bindFill("DB Logo", varDB);
        bindFill("Logo Addition", varAdd);

        component.setBoundVariable("height", varHeight);
        component.lockAspectRatio();
      } catch (varError) {
        figma.notify("Variables could not be linked. Check Library.");
      }

      figma.notify("Component created in viewport center");
      figma.ui.postMessage({ feedback: "Success: Logo imported." });
    } catch (e) {
      figma.notify("Error: SVG import failed.");
      figma.ui.postMessage({ feedback: "Error: " + e });
    }
  }
};
