import { PluginMessage } from "shared/data.ts";

export const isDataMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<string> => message.type === "data";
