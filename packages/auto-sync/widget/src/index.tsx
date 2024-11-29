import { sendMessage } from "shared/figma";

const { widget } = figma;
const { Input, AutoLayout, Text, useSyncedState, useWidgetNodeId } = widget;

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
  const [syncName, setSyncName] = useSyncedState<string>(
    "syncName",
    "Group Name",
  );
  const [selectedNodeName, setSelectedNodeName] = useSyncedState<
    string | undefined
  >("selectedNodeName", undefined);
  const [selectedNodeId, setSelectedNodeId] = useSyncedState<
    string | undefined
  >("selectedNodeId", undefined);
  const [currentGroupId, setCurrentGroupId] = useSyncedState<
    string | undefined
  >("currentGroupId", undefined);
  const [isSyncing, setIsSyncing] = useSyncedState<boolean>("isSyncing", false);

  const widgetId = useWidgetNodeId();

  const selectNode = async () => {
    const widgetNode = (await figma.getNodeByIdAsync(widgetId)) as WidgetNode;

    if (figma.currentPage.selection.length === 1) {
      const current = figma.currentPage.selection[0];

      if (selectedNodeId === current.id) {
        figma.notify("You already initialized this node");
        return;
      }

      setSelectedNodeId(current.id);
      const cloned = current.clone();
      cloned.locked = true;
      setSelectedNodeName(cloned.name);
      if (currentGroupId && (await figma.getNodeByIdAsync(currentGroupId))) {
        await updateGroup(currentGroupId, cloned);
      } else {
        const group = figma.group([cloned], figma.currentPage);
        group.name = syncName;
        group.x = widgetNode.x;
        group.y = widgetNode.y + widgetNode.height + 50;
        setCurrentGroupId(group.id);
      }
    }
  };

  const refresh = async () => {
    if (selectedNodeId && currentGroupId) {
      const selectedNode = (await figma.getNodeByIdAsync(
        selectedNodeId,
      )) as SceneNode;
      if (selectedNode) {
        const cloned = selectedNode.clone();
        cloned.locked = true;
        await updateGroup(currentGroupId, cloned);
      }
    }
  };

  const startSync = async () => {
    await new Promise(() => {
      const title = `Auto-sync`;
      figma.showUI(__html__, {
        height: 0,
        width: title.length * 16,
        position: { x: 9999, y: 9999 },
        title,
      });
      sendMessage<string>({
        type: "data",
        data: syncName,
      });
      setIsSyncing(true);
      figma.on("close", () => {
        setIsSyncing(false);
        figma.ui.close();
      });
      figma.ui.on("message", (msg) => {
        if (msg.type === "refresh") {
          refresh();
        }
      });
    });
  };

  const stopSync = async () => {
    await new Promise(() => {
      setIsSyncing(false);
      figma.ui.close();
    });
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
        Auto Sync
      </Text>
      <Text fill="#43474E" fontSize={12}>
        1. Write group name
      </Text>
      <AutoLayout
        name="Input Field"
        cornerRadius={4}
        padding={12}
        stroke={{ type: "solid", color: "#C3C7CE" }}
        fill="#5a5e6814"
      >
        <Input
          onTextEditEnd={(event) => setSyncName(event.characters)}
          value={syncName}
        />
      </AutoLayout>
      <Text fill="#43474E" fontSize={12}>
        2. Select a node and press "Copy Node"
      </Text>
      <AutoLayout
        onClick={selectNode}
        verticalAlignItems="center"
        stroke="#1A1C1F"
        cornerRadius={4}
        padding={8}
        width="fill-parent"
        horizontalAlignItems="center"
      >
        <Text fontSize={12}>Copy Node</Text>
      </AutoLayout>

      <Text fill="#43474E" fontSize={12}>
        3. Start/stop auto sync
      </Text>
      <AutoLayout width="fill-parent" spacing={8}>
        <AutoLayout
          onClick={() =>
            selectedNodeName && !isSyncing ? startSync() : undefined
          }
          verticalAlignItems="center"
          stroke="#1A1C1F"
          cornerRadius={4}
          padding={8}
          width="fill-parent"
          horizontalAlignItems="center"
          opacity={selectedNodeName && !isSyncing ? 1 : 0.4}
        >
          <Text fontSize={12}>Start</Text>
        </AutoLayout>
        <AutoLayout
          onClick={() =>
            selectedNodeName && isSyncing ? stopSync() : undefined
          }
          verticalAlignItems="center"
          stroke="#1A1C1F"
          cornerRadius={4}
          padding={8}
          width="fill-parent"
          horizontalAlignItems="center"
          opacity={selectedNodeName && isSyncing ? 1 : 0.4}
        >
          <Text fontSize={12}>Stop sync</Text>
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>
  );
};

widget.register(AutoSync);
