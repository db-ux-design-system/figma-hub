import {PluginMessage} from "shared/data.js";

export const sendMessage = <T>(pluginMessage: PluginMessage<T>) => {
  figma.ui.postMessage(pluginMessage);
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
