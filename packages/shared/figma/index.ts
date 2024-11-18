import {PluginMessage} from "../data";

export const sendMessage = <T>(pluginMessage: PluginMessage<T>) => {
    figma.ui.postMessage(pluginMessage);
};