import { Node, PluginMessage } from "shared/data.ts";
import { HandoverConfig } from "shared/handover/data.ts";

export const isDataMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<Node[]> => message.type === "data";

export const isConfigMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<HandoverConfig[]> => message.type === "config";
