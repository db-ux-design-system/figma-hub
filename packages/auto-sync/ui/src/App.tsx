import "./index.css";
import { useEffect, useState } from "react";
import { isDataMessage } from "./utils/plugin-message.ts";
import { PluginMessage } from "shared/data.ts";

const defaultTime: number = 30;

const App = () => {
  const [syncName, setSyncName] = useState<string>();
  const [time, setTime] = useState<number>(defaultTime);

  useEffect(() => {
    onmessage = (event: MessageEvent) => {
      const message: PluginMessage<any> = event.data.pluginMessage;
      if (isDataMessage(message)) {
        setSyncName(message.data);
      }
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((current) => current - 1);
    }, 1000);

    return () => clearInterval(interval);
  });

  useEffect(() => {
    if (time === 0) {
      parent.postMessage({ pluginMessage: { type: "refresh" } }, "*");
      setTime(defaultTime);
    }
  }, [time]);

  return (
    <div className="flex text-center w-full h-full">
      <span className="m-auto flex justify-between gap-fix-sm">
        <strong>{syncName}: </strong>
        <em>{time}</em>
      </span>
    </div>
  );
};

export default App;
