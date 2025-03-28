import {Node, PluginMessage} from "shared/data.ts";


export const isSelectionChangeMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<boolean> => message.type === "selectionchange";

export const isBaseDataMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<Node> => message.type === "data";

export const isCssDataMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<Node> => message.type === "cssData";

export const isLoadingMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<string> => message.type === "loading";

export const isErrorMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<string> => message.type === "error";

export const isStorage = (
  message: PluginMessage<any>,
): message is PluginMessage<string | null> => message.type === "storage";
