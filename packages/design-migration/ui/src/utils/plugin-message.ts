import { PluginMessage } from "shared/data.ts";
import { MigrationNode } from "shared/design-migration/data.ts";

export const isLoadingMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<string> => message.type === "loading";

export const isErrorMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<string> => message.type === "error";

export const isCounterMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<undefined> => message.type === "counter";

export const isDataMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<MigrationNode[]> => message.type === "data";
export const isUpdateMessage = (
  message: PluginMessage<any>,
): message is PluginMessage<string> => message.type === "update";
