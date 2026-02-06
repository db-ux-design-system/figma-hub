/**
 * Custom hook for handling plugin messages and communication.
 */

import { useEffect } from "react";
import { IconEntry, CategoryInfo, ExportData } from "../types";

interface UsePluginMessagesProps {
  onIconsScanned: (
    icons: IconEntry[],
    iconType: string,
    categories: CategoryInfo[],
  ) => void;
  onExportPageIconsReceived: (icons: IconEntry[]) => void;
  onExportDataReady: (data: ExportData) => void;
  onError: () => void;
  onExportError: (message: string) => void;
}

export function usePluginMessages({
  onIconsScanned,
  onExportPageIconsReceived,
  onExportDataReady,
  onError,
  onExportError,
}: UsePluginMessagesProps) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (!msg) {
        return;
      }

      if (msg.type === "scan-result") {
        const categoryMap = new Map<string, number>();
        msg.icons.forEach((icon: IconEntry) => {
          categoryMap.set(
            icon.category,
            (categoryMap.get(icon.category) || 0) + 1,
          );
        });

        const categoryList = Array.from(categoryMap.entries()).map(
          ([name, count]) => ({ name, count }),
        );

        onIconsScanned(msg.icons, msg.iconType, categoryList);
      } else if (msg.type === "select-export-page-icons") {
        onExportPageIconsReceived(msg.icons);
      } else if (msg.type === "error") {
        onError();
      } else if (msg.type === "export-error") {
        onExportError(msg.message);
      } else if (msg.type === "export-data-ready") {
        onExportDataReady({
          mode: msg.mode,
          gitlabJsonSelected: msg.gitlabJsonSelected,
          gitlabJsonAll: msg.gitlabJsonAll,
          marketingCsv: msg.marketingCsv,
          iconType: msg.iconType,
        });
      }
    };

    window.addEventListener("message", handleMessage);

    // Send UI_READY signal to backend
    parent.postMessage({ pluginMessage: { type: "UI_READY" } }, "*");

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [
    onIconsScanned,
    onExportPageIconsReceived,
    onExportDataReady,
    onError,
    onExportError,
  ]);

  const selectFromExportPage = () => {
    parent.postMessage(
      { pluginMessage: { type: "SELECT_FROM_EXPORT_PAGE" } },
      "*",
    );
  };

  return {
    selectFromExportPage,
  };
}
