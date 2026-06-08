import { useCallback, useEffect, useRef, useState } from "react";
import type { PluginMessageToUI, UIMessageToPlugin } from "../types";

export function usePluginMessages() {
  const [lastMessage, setLastMessage] = useState<PluginMessageToUI | null>(
    null,
  );
  const initialized = useRef(false);

  const sendToPlugin = useCallback((msg: UIMessageToPlugin) => {
    parent.postMessage({ pluginMessage: msg }, "*");
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage as PluginMessageToUI | undefined;
      if (msg && msg.type) {
        setLastMessage(msg);
      }
    };

    window.addEventListener("message", handler);

    if (!initialized.current) {
      initialized.current = true;
      sendToPlugin({ type: "init" });
    }

    return () => window.removeEventListener("message", handler);
  }, [sendToPlugin]);

  return { sendToPlugin, lastMessage };
}
