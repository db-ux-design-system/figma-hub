/**
 * Custom hook for handling export operations.
 */

import { useCallback } from "react";
import { SelectedIcon, ChangelogStatus } from "../types";

export function useExport() {
  const exportFull = useCallback(
    (selectedIcons: SelectedIcon[], versionNumber: string) => {
      if (selectedIcons.length === 0) {
        alert("Please select at least one icon.");
        return;
      }

      const hasVersion = versionNumber.trim().length > 0;
      const hasFeatIcons = selectedIcons.some((si) => si.status === "feat");

      const selectedIconIds = selectedIcons.map(({ icon }) => icon.id);
      const iconStatuses: Record<string, ChangelogStatus> = {};
      selectedIcons.forEach(({ icon, status }) => {
        iconStatuses[icon.id] = status;
      });

      parent.postMessage(
        {
          pluginMessage: {
            type: "EXPORT_FULL",
            selectedIconIds: selectedIconIds,
            version: hasVersion ? versionNumber : null,
            generateOverview: hasFeatIcons,
            iconStatuses: iconStatuses,
          },
        },
        "*",
      );
    },
    [],
  );

  const exportInfoOnly = useCallback(
    (selectedIcons: SelectedIcon[], versionNumber: string) => {
      if (selectedIcons.length === 0) {
        alert("Please select at least one icon.");
        return;
      }

      const hasVersion = versionNumber.trim().length > 0;
      const hasFeatIcons = selectedIcons.some((si) => si.status === "feat");

      const selectedIconIds = selectedIcons.map(({ icon }) => icon.id);

      parent.postMessage(
        {
          pluginMessage: {
            type: "EXPORT_INFO_ONLY",
            selectedIconIds: selectedIconIds,
            version: hasVersion ? versionNumber : null,
            generateOverview: hasFeatIcons,
          },
        },
        "*",
      );
    },
    [],
  );

  const exportChangelogOnly = useCallback(
    (selectedIcons: SelectedIcon[], versionNumber: string) => {
      if (selectedIcons.length === 0) {
        alert("Please select at least one icon.");
        return;
      }

      const hasVersion = versionNumber.trim().length > 0;

      if (!hasVersion) {
        alert("Please enter a version number to create a changelog.");
        return;
      }

      const selectedIconIds = selectedIcons.map(({ icon }) => icon.id);
      const iconStatuses: Record<string, ChangelogStatus> = {};
      selectedIcons.forEach(({ icon, status }) => {
        iconStatuses[icon.id] = status;
      });

      parent.postMessage(
        {
          pluginMessage: {
            type: "EXPORT_CHANGELOG_ONLY",
            selectedIconIds: selectedIconIds,
            version: versionNumber,
            iconStatuses: iconStatuses,
          },
        },
        "*",
      );

      alert(`Changelog frame for v${versionNumber} created!`);
    },
    [],
  );

  return {
    exportFull,
    exportInfoOnly,
    exportChangelogOnly,
  };
}
