/**
 * Custom hook for managing icon selection state and operations.
 * Handles selection, deselection, status updates, and bulk operations.
 */

import { useState, useCallback } from "react";
import { IconEntry, SelectedIcon, ChangelogStatus } from "../types";

const PROPERTY_NAMES = ["size", "variant", "state", "type", "color"] as const;
type PropertyName = (typeof PROPERTY_NAMES)[number];

/**
 * Type guard to check if a string is a property name.
 */
function isPropertyName(name: string): name is PropertyName {
  return PROPERTY_NAMES.includes(name as PropertyName);
}

export function useIconSelection() {
  const [selectedIcons, setSelectedIcons] = useState<SelectedIcon[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectAllStatus, setSelectAllStatus] =
    useState<ChangelogStatus | null>("feat");

  const getIconSetName = useCallback((iconName: string): string => {
    return iconName.split("/")[0].split("=")[0].trim();
  }, []);

  const isPropertyDefinition = useCallback((iconName: string): boolean => {
    const baseName = iconName.split("/")[0].split("=")[0].trim();
    return isPropertyName(baseName.toLowerCase()) || baseName.length === 0;
  }, []);

  const isIconSetSelected = useCallback(
    (setName: string): boolean => {
      return selectedIcons.some(
        (si) => getIconSetName(si.icon.name) === setName,
      );
    },
    [selectedIcons, getIconSetName],
  );

  const toggleIconSet = useCallback(
    (setName: string, icons: IconEntry[]) => {
      setSelectedIcons((prev) => {
        const isCurrentlySelected = prev.some(
          (si) => getIconSetName(si.icon.name) === setName,
        );

        if (isCurrentlySelected) {
          const newSelection = prev.filter(
            (si) => getIconSetName(si.icon.name) !== setName,
          );

          if (newSelection.length > 0) {
            const allSameStatus = newSelection.every(
              (si) => si.status === newSelection[0].status,
            );
            setSelectAllStatus(allSameStatus ? newSelection[0].status : null);
          } else {
            setSelectAllStatus("feat");
          }

          return newSelection;
        } else {
          const representativeIcon = icons[0];
          const newSelection = [
            ...prev,
            { icon: representativeIcon, status: "feat" as ChangelogStatus },
          ];

          const allSameStatus = newSelection.every(
            (si) => si.status === newSelection[0].status,
          );
          setSelectAllStatus(allSameStatus ? newSelection[0].status : null);

          return newSelection;
        }
      });
    },
    [getIconSetName],
  );

  const updateIconStatus = useCallback(
    (iconId: string, status: ChangelogStatus) => {
      setSelectedIcons((prev) => {
        const newSelection = prev.map((si) =>
          si.icon.id === iconId ? { ...si, status } : si,
        );

        const allSameStatus = newSelection.every(
          (si) => si.status === newSelection[0].status,
        );
        setSelectAllStatus(allSameStatus ? newSelection[0].status : null);

        return newSelection;
      });
    },
    [],
  );

  const setAllIconsToStatus = useCallback((status: ChangelogStatus) => {
    setSelectAllStatus(status);
    setSelectedIcons((prev) => prev.map((si) => ({ ...si, status })));
  }, []);

  const selectCategory = useCallback(
    (categoryName: string, iconSets: Map<string, IconEntry[]>) => {
      const categoryIconSets = Array.from(iconSets.entries()).filter(
        ([, icons]) => icons[0].category === categoryName,
      );

      const isCategorySelected = selectedCategories.includes(categoryName);

      if (isCategorySelected) {
        setSelectedIcons((prev) =>
          prev.filter((si) => si.icon.category !== categoryName),
        );
        setSelectedCategories((prev) => prev.filter((c) => c !== categoryName));
      } else {
        setSelectedCategories((prev) => [...prev, categoryName]);

        categoryIconSets.forEach(([setName, icons]) => {
          const isAlreadySelected = selectedIcons.some(
            (si) => getIconSetName(si.icon.name) === setName,
          );

          if (!isAlreadySelected) {
            setSelectedIcons((prev) => [
              ...prev,
              {
                icon: icons[0],
                status: "feat" as ChangelogStatus,
              },
            ]);
          }
        });
      }
    },
    [selectedCategories, selectedIcons, getIconSetName],
  );

  const selectAllIconSets = useCallback(
    (iconSets: Map<string, IconEntry[]>, categories: string[]) => {
      const allSets: SelectedIcon[] = Array.from(iconSets.entries()).map(
        ([, icons]) => ({
          icon: icons[0],
          status: "feat" as ChangelogStatus,
        }),
      );

      setSelectedIcons(allSets);
      setSelectedCategories(categories);
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedIcons([]);
    setSelectedCategories([]);
    setSelectAllStatus("feat");
  }, []);

  const setSelectedIconsFromExportPage = useCallback((icons: IconEntry[]) => {
    const iconSetMap = new Map<string, IconEntry>();
    icons.forEach((icon: IconEntry) => {
      const setName = icon.name.split("/")[0].split("=")[0].trim();
      const isProperty =
        isPropertyName(setName.toLowerCase()) || setName.length === 0;

      if (!isProperty && !iconSetMap.has(setName)) {
        iconSetMap.set(setName, icon);
      }
    });

    const iconsToSelect: SelectedIcon[] = Array.from(iconSetMap.values()).map(
      (icon) => ({
        icon,
        status: "feat" as ChangelogStatus,
      }),
    );

    setSelectedIcons(iconsToSelect);
  }, []);

  return {
    selectedIcons,
    selectedCategories,
    selectAllStatus,
    getIconSetName,
    isPropertyDefinition,
    isIconSetSelected,
    toggleIconSet,
    updateIconStatus,
    setAllIconsToStatus,
    selectCategory,
    selectAllIconSets,
    clearSelection,
    setSelectedIconsFromExportPage,
  };
}
