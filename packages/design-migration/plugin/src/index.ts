import { UiMessageDesignMigration } from "shared/data";
import {
  replaceDensityAndDevice,
  splitDensityAndDeviceAnalyze,
} from "../migrations/modes-density-device-split";
import { sendMessage } from "shared/figma";

export const handleDesignMigration = () => {
  figma.showUI(__html__, { height: 768, width: 312 });
  figma.ui.onmessage = async (msg: UiMessageDesignMigration) => {
    if (msg.type === "analyze") {
      sendMessage<string>({ type: "loading", data: "Analyze current page" });
      await splitDensityAndDeviceAnalyze();
      sendMessage<undefined>({ type: "loading", data: undefined });
    } else if (msg.type === "migrate") {
      await replaceDensityAndDevice(msg.data);
    }
  };
};

if (figma.editorType === "figma") {
  handleDesignMigration();
}
