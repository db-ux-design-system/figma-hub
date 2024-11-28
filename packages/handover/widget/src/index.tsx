import { sendMessage } from "shared/figma";
import { Node } from "shared/data";
import { HandoverConfig } from "shared/handover/data";
import { delay } from "shared/utils";

const { widget } = figma;
const {
  Input,
  AutoLayout,
  Text,
  useSyncedState,
  useSyncedMap,
  useWidgetNodeId,
  waitForTask,
} = widget;

const modeCollectionId =
  "VariableCollectionId:d6c69d4b85c3314fa0dcaa78a03eaec7d1026877/4994:1563";
const lightModeId = "1:3";
const darkModeId = "101:2";

const updateGroup = async (currentGroupId: string, newNode: SceneNode) => {
  const currentGroup = (await figma.getNodeByIdAsync(
    currentGroupId,
  )) as GroupNode;

  const childrenToDelete = currentGroup.children.map((child) => child.id);
  newNode.x = currentGroup.x;
  newNode.y = currentGroup.y;
  currentGroup.appendChild(newNode);
  for (const id of childrenToDelete) {
    const previousChild = await figma.getNodeByIdAsync(id);
    previousChild?.remove();
  }
};

const AutoSync = () => {
  const [config, setConfig] = useSyncedState<HandoverConfig[]>("config", []);

  const widgetId = useWidgetNodeId();

  const openConfig = async () => {
    await new Promise<void>(async (resolve) => {
      try {
        const title = `Handover Config`;
        const data: Node[] = figma.root.children.map((page) => ({
          id: page.id,
          name: page.name,
          type: page.type,
        }));

        figma.showUI(__html__, {
          title,
          height: 768,
          width: 312,
        });
        figma.ui.on("message", (msg) => {
          if (msg.type === "save") {
            setConfig(msg.config);
            figma.ui.close();
            resolve();
          }
        });

        await delay(500);

        sendMessage<Node[]>({
          type: "data",
          data,
        });
        sendMessage<HandoverConfig[]>({
          type: "config",
          data: config,
        });
      } catch (_) {}
    });
  };

  const generate = async () => {
    const widgetNode = (await figma.getNodeByIdAsync(widgetId)) as WidgetNode;
    const modeCollection =
      await figma.variables.getVariableCollectionByIdAsync(modeCollectionId);
    for (const child of figma.currentPage.children) {
      if (child.id !== widgetId) {
        child.remove();
      }
    }

    let lastGroup: GroupNode | undefined;
    for (const hConfig of config) {
      const page = (await figma.getNodeByIdAsync(hConfig.pageId)) as PageNode;
      if (page) {
        const group = figma.group(
          page.children.map((child) => child.clone()),
          figma.currentPage,
        );
        group.locked = true;
        group.name = `${page.name} - ${hConfig.mode}`;
        group.expanded = false;
        if (modeCollection) {
          group.setExplicitVariableModeForCollection(
            modeCollection,
            hConfig.mode === "light" ? lightModeId : darkModeId,
          );
        }
        if (lastGroup) {
          group.x = widgetNode.x;
          group.y = lastGroup.y + lastGroup.height + 50;
        } else {
          group.x = widgetNode.x;
          group.y = widgetNode.y + widgetNode.height + 50;
        }

        lastGroup = group;
      }
    }
  };

  return (
    <AutoLayout
      verticalAlignItems="center"
      direction="vertical"
      padding={12}
      fill="#FFFFFF"
      cornerRadius={8}
      spacing={12}
      stroke={{
        type: "solid",
        color: "#C3C7CE",
      }}
    >
      <Text fontSize={24} fontWeight={900}>
        Handover
      </Text>
      <Text fill="#43474E" fontSize={12}>
        1. Configure pages
      </Text>
      <AutoLayout
        onClick={openConfig}
        verticalAlignItems="center"
        stroke="#1A1C1F"
        cornerRadius={4}
        padding={8}
        width="fill-parent"
        horizontalAlignItems="center"
      >
        <Text fontSize={12}>Open Configuration</Text>
      </AutoLayout>

      <Text fill="#43474E" fontSize={12}>
        2. Generate Handovers
      </Text>
      <AutoLayout
        onClick={config.length > 0 ? generate : undefined}
        verticalAlignItems="center"
        stroke="#1A1C1F"
        cornerRadius={4}
        padding={8}
        width="fill-parent"
        horizontalAlignItems="center"
        opacity={config.length > 0 ? 1 : 0.4}
      >
        <Text fontSize={12}>Generate</Text>
      </AutoLayout>
    </AutoLayout>
  );
};

widget.register(AutoSync);
