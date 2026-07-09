import { useEffect } from "react";
import type { PluginToUIMessage } from "../types";

export function sendMessage(
  type: string,
  module?: string,
  action?: string,
  payload?: unknown,
): void {
  parent.postMessage({ pluginMessage: { type, module, action, payload } }, "*");
}

export function usePluginMessage(
  handler: (msg: PluginToUIMessage) => void,
): void {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (msg) {
        handler(msg);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [handler]);
}
