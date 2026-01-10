figma.showUI(__html__, { width: 500, height: 380 });

function hexToRgba(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const a = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;
  return { r, g, b, a };
}

function areColorsEqual(c1: any, c2: any) {
  if (!c1 || !c2) return false;
  if (c1.type === "VARIABLE_ALIAS" || c2.type === "VARIABLE_ALIAS")
    return false;
  const tolerance = 0.001;
  return (
    Math.abs(c1.r - c2.r) < tolerance &&
    Math.abs(c1.g - c2.g) < tolerance &&
    Math.abs(c1.b - c2.b) < tolerance &&
    Math.abs(c1.a - c2.a) < tolerance
  );
}

const MAPPINGS = [
  {
    name: "bg/basic/level-1/default",
    light: "14",
    dark: "1",
    key: "539324f386b2150504d789cfbad9126c14cbdad1",
  },
  {
    name: "bg/basic/level-1/hovered",
    light: "13",
    dark: "3",
    key: "5251dd273a92bf1b08bef0def5ba1a1faf0aecfc",
  },
  {
    name: "bg/basic/level-1/pressed",
    light: "12",
    dark: "4",
    key: "86be13704755db82bb6ceb0a8e067c199df239ef",
  },
  {
    name: "bg/basic/level-2/default",
    light: "13",
    dark: "2",
    key: "e4c25c81df8e51185f22570c6d6317238cddfa4d",
  },
  {
    name: "bg/basic/level-2/hovered",
    light: "12",
    dark: "4",
    key: "4dfe761aaf772105cb2f206b8b11d8b4f33bf3c3",
  },
  {
    name: "bg/basic/level-2/pressed",
    light: "11",
    dark: "5",
    key: "35d5a4359c83dc1e938e7f793976681fbf6e5697",
  },
  {
    name: "bg/basic/level-3/default",
    light: "12",
    dark: "3",
    key: "5510a95229c069c0448a76361b0967b4ac96276d",
  },
  {
    name: "bg/basic/level-3/hovered",
    light: "11",
    dark: "1",
    key: "6045db217f6fc110088a3f00357b9cdae2d6f8eb",
  },
  {
    name: "bg/basic/level-3/pressed",
    light: "10",
    dark: "0",
    key: "0bf74dba48b9092b5de6e0643042e78bc8bad092",
  },
  {
    name: "bg/basic/transparent-full/default",
    light: "transparent-full-light-default",
    dark: "transparent-full-dark-default",
    key: "59a3dab692a3a1bb9c7ac7be39c57eb823b3e070",
  },
  {
    name: "bg/basic/transparent-full/hovered",
    light: "transparent-full-light-hovered",
    dark: "transparent-full-dark-hovered",
    key: "56cdcb03d65119dfba470e9bf1c77ed856ef6cc0",
  },
  {
    name: "bg/basic/transparent-full/pressed",
    light: "transparent-full-light-pressed",
    dark: "transparent-full-dark-pressed",
    key: "e7b57c6fe1ae21758e436eeb5fd7531ac7ea349c",
  },
  {
    name: "bg/basic/transparent-semi/default",
    light: "transparent-semi-light-default",
    dark: "transparent-semi-dark-default",
    key: "97bfa136fe951c4776eae1496df447ba5ed9a47b",
  },
  {
    name: "bg/basic/transparent-semi/hovered",
    light: "transparent-semi-light-hovered",
    dark: "transparent-semi-dark-hovered",
    key: "4f5f59c37a4b472d6d9c69d19724f5a73cd68a88",
  },
  {
    name: "bg/basic/transparent-semi/pressed",
    light: "transparent-semi-light-pressed",
    dark: "transparent-semi-dark-pressed",
    key: "75d12cb5cd0dcbdaf7626c27a7cd84188820f562",
  },
  {
    name: "bg/vibrant/default",
    light: 9,
    dark: 9,
    key: "df147d14084f41cb4b54164a1f03ebfd6339f487",
  },
  {
    name: "bg/vibrant/hovered",
    light: 12,
    dark: 12,
    key: "1c26e3e248e806dedfe749494cde6e8e1438f786",
  },
  {
    name: "bg/vibrant/pressed",
    light: 10,
    dark: 10,
    key: "d824ac4413fbf40360a63991e9884c66699ffcac",
  },
  {
    name: "bg/inverted/contrast-max/default",
    light: "1",
    dark: "12",
    key: "41bda154da5b0e6c26697decad9ea2cfbe7b140a",
  },
  {
    name: "bg/inverted/contrast-max/hovered",
    light: "5",
    dark: "9",
    key: "03cd7a20e90411b746eca8fae15ed336a376209f",
  },
  {
    name: "bg/inverted/contrast-max/pressed",
    light: "2",
    dark: "11",
    key: "a7a38b28d2b0b0a8e303fb21ba1ca68e3df3e2e2",
  },
  {
    name: "bg/inverted/contrast-high/default",
    light: "6",
    dark: "9",
    key: "7378b3ec80d3afd9c6c8fc4501d470a301c08e58",
  },
  {
    name: "bg/inverted/contrast-high/hovered",
    light: "2",
    dark: "12",
    key: "cb1b348146ce991fad3244df9c637a9fd97ca402",
  },
  {
    name: "bg/inverted/contrast-high/pressed",
    light: "5",
    dark: "10",
    key: "cb3e20368116972b1597d325ceda498dcdcb9d8b",
  },
  {
    name: "bg/inverted/contrast-low/default",
    light: "7",
    dark: "8",
    key: "9b9d23f7b48d29a9135d42b4da624599a63506e7",
  },
  {
    name: "bg/inverted/contrast-low/hovered",
    light: "3",
    dark: "12",
    key: "4988337b1cdcbea7b73408436348e0bb1d3e7782",
  },
  {
    name: "bg/inverted/contrast-low/pressed",
    light: "6",
    dark: "9",
    key: "33f2ddace0702bf06db3005a454245e5f0404a29",
  },
  {
    name: "on-bg/basic/emphasis-100/default",
    light: 1,
    dark: 12,
    key: "497497bca9694f6004d1667de59f1a903b3cd3ef",
  },
  {
    name: "on-bg/basic/emphasis-100/hovered",
    light: 5,
    dark: 9,
    key: "bad61c2037c016d565b3e062d3a0e05b310e285f",
  },
  {
    name: "on-bg/basic/emphasis-100/pressed",
    light: 2,
    dark: 11,
    key: "2055d56ae39730c118edcc6e639c7a372a22bbf6",
  },
  {
    name: "on-bg/basic/emphasis-90/default",
    light: 4,
    dark: 10,
    key: "4b6fa889078d2d2be01885affe2ccf9b6fe00bca",
  },
  {
    name: "on-bg/basic/emphasis-90/hovered",
    light: 0,
    dark: 14,
    key: "0e4e4c8feb52d34604961b4311d8479066d0eb1f",
  },
  {
    name: "on-bg/basic/emphasis-90/pressed",
    light: 3,
    dark: 11,
    key: "82aa0f32a9f4e83594b606717ae8fa753edf7927",
  },
  {
    name: "on-bg/basic/emphasis-80/default",
    light: 6,
    dark: 9,
    key: "de14758ec6fb33b47e9cb67eb4587d01d4f38828",
  },
  {
    name: "on-bg/basic/emphasis-80/hovered",
    light: 3,
    dark: 12,
    key: "bcb6cd914b7e3cfde997010881f6684ed30de973",
  },
  {
    name: "on-bg/basic/emphasis-80/pressed",
    light: 5,
    dark: 10,
    key: "eaa0ab7f8eb04bf8343dc7aef5218d1c8f361fdf",
  },
  {
    name: "on-bg/basic/emphasis-70/default",
    light: 7,
    dark: 8,
    key: "1a1b9dd754ea56f8a4579ff1396ab560b98c018d",
  },
  {
    name: "on-bg/basic/emphasis-70/hovered",
    light: 4,
    dark: 10,
    key: "53e37969a61bea174a6b81fd4560b1cd816b6e07",
  },
  {
    name: "on-bg/basic/emphasis-70/pressed",
    light: 6,
    dark: 9,
    key: "f8543e25bd128806d7740c739a1684890148882a",
  },
  {
    name: "on-bg/basic/emphasis-60/default",
    light: 10,
    dark: 6,
    key: "47a78b18c953cec8622180b54e0ab9c1ab5b30ca",
  },
  {
    name: "on-bg/basic/emphasis-50/default",
    light: 12,
    dark: 3,
    key: "bb22fcc29f4e0e01a03649f1dc2bb37e58a0dd38",
  },
  {
    name: "on-bg/vibrant/default",
    light: 1,
    dark: 1,
    key: "a42f695a2008065816ef79e3bc57616e8e226b46",
  },
  {
    name: "on-bg/vibrant/hovered",
    light: 4,
    dark: 4,
    key: "367a484313f6684af7146b4570b30cdecf4d942b",
  },
  {
    name: "on-bg/vibrant/pressed",
    light: 2,
    dark: 2,
    key: "85aadee42dbe009398fedff3a410585436f2408c",
  },
  {
    name: "on-bg/inverted/default",
    light: 14,
    dark: 3,
    key: "a9fd881c9fa11116a74f3860c44ceec1f86f4109",
  },
  {
    name: "on-bg/inverted/hovered",
    light: 11,
    dark: 0,
    key: "cf7ee9e4ba21afdc89b5ca7b8010d5eba872a6c5",
  },
  {
    name: "on-bg/inverted/pressed",
    light: 13,
    dark: 2,
    key: "85aadee42dbe009398fedff3a410585436f2408c",
  },
  {
    name: "origin/default",
    light: "origin-light-default",
    dark: "origin-dark-default",
    key: "1ae8186772215deaa543ef9d940ffad8677a126e",
  },
  {
    name: "origin/hovered",
    light: "origin-light-hovered",
    dark: "origin-dark-hovered",
    key: "5f5cfe40930e45a32dfab0e87d388b789e1cfba0",
  },
  {
    name: "origin/pressed",
    light: "origin-light-pressed",
    dark: "origin-dark-pressed",
    key: "1ae8186772215deaa543ef9d940ffad8677a126e",
  },
  {
    name: "on-origin/default",
    light: "on-origin-light-default",
    dark: "on-origin-dark-default",
    key: "891eb786eb94b732383f499c534d55269371ff73",
  },
];

figma.ui.onmessage = async (msg) => {
  if (msg.type === "import-json") {
    try {
      const data = msg.data;
      const colorFamilies = Object.keys(data.colors);
      const deleteMissing = msg.deleteMissing;

      let localCollections =
        await figma.variables.getLocalVariableCollectionsAsync();

      // --- BLANCO LOGIK: LÖSCHEN DER COLLECTIONS ---
      if (deleteMissing) {
        for (const col of localCollections) {
          if (col.name === "❌ Base Variables ❌") {
            // Nur Variablen mit Namen, die mit 'colors/' beginnen, löschen
            if (Array.isArray(col.variableIds)) {
              for (const id of col.variableIds) {
                const v = await figma.variables.getVariableByIdAsync(id);
                if (v && v.name.startsWith("colors/")) {
                  try {
                    await v.remove();
                  } catch {}
                }
              }
            }
          } else if (col.name === "Display Mode" || col.name === "Colors") {
            await col.remove();
          }
        }
        // Neu laden nach dem Löschen
        localCollections =
          await figma.variables.getLocalVariableCollectionsAsync();
      }

      // Collections finden oder neu erstellen
      let baseCol =
        localCollections.find((c) => c.name === "❌ Base Variables ❌") ||
        figma.variables.createVariableCollection("❌ Base Variables ❌");
      let displayCol =
        localCollections.find((c) => c.name === "Display Mode") ||
        figma.variables.createVariableCollection("Display Mode");
      let colorCol =
        localCollections.find((c) => c.name === "Colors") ||
        figma.variables.createVariableCollection("Colors");

      const baseModeId = baseCol.modes[0].modeId;

      // Display Mode Setup
      if (displayCol.modes[0].name !== "Light")
        displayCol.renameMode(displayCol.modes[0].modeId, "Light");
      if (!displayCol.modes.find((m) => m.name === "Dark"))
        displayCol.addMode("Dark");
      const lightModeId = displayCol.modes.find(
        (m) => m.name === "Light"
      )!.modeId;
      const darkModeId = displayCol.modes.find(
        (m) => m.name === "Dark"
      )!.modeId;

      // Colors Mode Setup
      if (colorCol.modes[0].name !== "db-adaptive")
        colorCol.renameMode(colorCol.modes[0].modeId, "db-adaptive");
      const dbAdaptiveModeId = colorCol.modes.find(
        (m) => m.name === "db-adaptive"
      )!.modeId;

      const colorFamilyModeIds: Record<string, string> = {};
      for (const family of colorFamilies) {
        let mode = colorCol.modes.find((m) => m.name === family);
        if (!mode) {
          const newModeId = colorCol.addMode(family);
          colorFamilyModeIds[family] = newModeId;
        } else {
          colorFamilyModeIds[family] = mode.modeId;
        }
      }

      // Map für schnellen Zugriff
      const existingVars = await figma.variables.getLocalVariablesAsync();
      const varMap = new Map<string, Variable>();
      existingVars.forEach((v) => varMap.set(v.name, v));

      const baseMap: Record<string, string> = {};
      const displayVarMap: Record<string, string> = {};
      const allCreatedVariables: { variable: Variable; targetScope: any }[] =
        [];

      // --- TIER 1: BASE VARIABLES ---
      for (const family of colorFamilies) {
        const tokens = data.colors[family];
        for (const tokenKey in tokens) {
          const token = tokens[tokenKey];
          if (token && token.$value) {
            const varPath = `colors/${family}/${tokenKey}`;
            let v = varMap.get(varPath);
            const newVal = hexToRgba(token.$value);

            if (v) {
              if (!areColorsEqual(v.valuesByMode[baseModeId], newVal))
                v.setValueForMode(baseModeId, newVal);
            } else {
              v = figma.variables.createVariable(varPath, baseCol, "COLOR");
              v.setValueForMode(baseModeId, newVal);
            }
            v.hiddenFromPublishing = true;
            baseMap[varPath] = v.id;
          }
        }
      }

      // --- TIER 2: DISPLAY MODE ---
      for (const family of colorFamilies) {
        for (const m of MAPPINGS) {
          const varPath = `${family}/${m.name}`;
          const lId = baseMap[`colors/${family}/${m.light}`];
          const dId = baseMap[`colors/${family}/${m.dark}`];

          if (!lId && !dId) continue;

          let v = varMap.get(varPath);
          if (!v) {
            v = figma.variables.createVariable(varPath, displayCol, "COLOR");
          }
          if (lId)
            v.setValueForMode(lightModeId, { type: "VARIABLE_ALIAS", id: lId });
          if (dId)
            v.setValueForMode(darkModeId, { type: "VARIABLE_ALIAS", id: dId });

          v.hiddenFromPublishing = true;
          displayVarMap[varPath] = v.id;
        }
      }

      // --- TIER 3: COLORS (Adaptive) ---
      for (const m of MAPPINGS) {
        const colorVarPath = `custom-adaptive/${m.name}`;
        let v = varMap.get(colorVarPath);

        let targetScopes: VariableScope[] = m.name.startsWith("bg/")
          ? ["FRAME_FILL", "SHAPE_FILL"]
          : ["SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR", "EFFECT_COLOR"];

        if (!v) {
          v = figma.variables.createVariable(colorVarPath, colorCol, "COLOR");
        }

        v.hiddenFromPublishing = false;

        // External Key (db-adaptive)
        if (m.key) {
          try {
            const ext = await figma.variables.importVariableByKeyAsync(m.key);
            v.setValueForMode(dbAdaptiveModeId, {
              type: "VARIABLE_ALIAS",
              id: ext.id,
            });
          } catch (e) {
            console.warn(`Key ${m.key} für ${m.name} nicht gefunden.`);
          }
        }

        for (const family of colorFamilies) {
          const sourceId = displayVarMap[`${family}/${m.name}`];
          if (sourceId) {
            v.setValueForMode(colorFamilyModeIds[family], {
              type: "VARIABLE_ALIAS",
              id: sourceId,
            });
          }
        }
      }

      figma.notify(
        deleteMissing
          ? "All collections newly created"
          : "Variables synchronized"
      );

      figma.ui.postMessage(
        deleteMissing
          ? { feedback: "Success: All collections newly created" }
          : { feedback: "Success: Variables synchronized" }
      );
    } catch (e) {
      console.error(e);
      figma.notify("Error: " + (e as Error).message);
      figma.ui.postMessage({ feedback: "Error: " + e });
    }
  }
};
