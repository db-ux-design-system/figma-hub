figma.showUI(__html__, { width: 400, height: 250 });

/**
 * CONFIGURATION: Centralized IDs and Constants
 */
const CONFIG = {
  keys: {
    dbLogo: "998998d67d3ebef6f2692db932bce69431b3d0cc",
    logoAddition: "497497bca9694f6004d1667de59f1a903b3cd3ef",
    componentHeight: "1395b959268f9a53cbbacbf9619b871914c8a9d6",
  },
  targetHeight: 24,
};

figma.ui.onmessage = async (msg) => {
  if (msg.type === "import-svg") {
    const { svg: svgText, filename } = msg;

    if (!svgText || !svgText.includes("<svg")) {
      figma.notify("❌ Error: Invalid SVG data received.");
      return;
    }

    try {
      // 1. Initial SVG creation
      const svgNode = figma.createNodeFromSvg(svgText);
      const cleanName = (filename || "Imported Logo").replace(/\.[^/.]+$/, "");

      svgNode.x = figma.viewport.center.x;
      svgNode.y = figma.viewport.center.y;

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

      // IMPORTANT: Append child before defining Auto Layout behavior
      component.appendChild(svgNode);
      figma.currentPage.appendChild(component);

      // 4. Scaling and Auto Layout Setup
      // We resize the SVG first so the parent knows the dimensions to "Hug"
      const scale = CONFIG.targetHeight / svgNode.height;
      const newWidth = svgNode.width * scale;
      svgNode.resize(newWidth, CONFIG.targetHeight);

      // Now set Auto Layout
      component.layoutMode = "HORIZONTAL";
      component.primaryAxisSizingMode = "AUTO"; // This is "Hug" (Width)
      component.counterAxisSizingMode = "FIXED"; // This is "Fixed" (Height)

      // Reset paddings and gaps to ensure a tight hug
      component.paddingLeft = 0;
      component.paddingRight = 0;
      component.paddingTop = 0;
      component.paddingBottom = 0;
      component.itemSpacing = 0;

      // 5. Variable Assignment (Fills & Height)
      try {
        console.log("Fetching library variables...");

        const [varDB, varAdd, varHeight] = await Promise.all([
          figma.variables.importVariableByKeyAsync(CONFIG.keys.dbLogo),
          figma.variables.importVariableByKeyAsync(CONFIG.keys.logoAddition),
          figma.variables.importVariableByKeyAsync(CONFIG.keys.componentHeight),
        ]);

        const bindFill = (layerName, variable) => {
          const target = component.findOne((n) => n.name === layerName);
          if (target && "fills" in target) {
            const paint = figma.variables.setBoundVariableForPaint(
              { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
              "color",
              variable
            );
            target.fills = [paint];
            console.log(`Variable bound to fill of: "${layerName}"`);
          }
        };

        // Apply fills
        bindFill("DB Logo", varDB);
        bindFill("Logo Addition", varAdd);

        // Bind Height variable and Lock Aspect Ratio
        component.setBoundVariable("height", varHeight.id);
        component.constrainProportions = true;

        console.log("Height variable and Proportions locked.");
      } catch (varError) {
        console.error("Variable assignment failed:", varError);
        figma.notify("⚠️ Variables could not be linked. Check Library.");
      }

      figma.notify("✅ Component created successfully");
      figma.ui.postMessage({ feedback: "✅ Success: Logo imported." });
    } catch (e) {
      console.error("Critical Plugin Error:", e);
      figma.notify("👀 Error: SVG import failed.");
      figma.ui.postMessage({ feedback: "Error: " + e.message });
    }
  }
};
