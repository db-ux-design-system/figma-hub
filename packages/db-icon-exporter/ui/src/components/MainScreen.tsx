/**
 * Main screen component showing icon selection interface.
 */

import { useState, useCallback } from "react";
import { DBStack } from "@db-ux/react-core-components";
import { IconEntry, SelectedIcon, ChangelogStatus } from "../types";
import { SearchHeader } from "./SearchHeader";
import { SelectionControls } from "./SelectionControls";
import { OptimizedCategorySection } from "./OptimizedCategorySection";
import { StatusPanel } from "./StatusPanel";
import { ExportButtons } from "./ExportButtons";

interface MainScreenProps {
  iconType: string;
  versionNumber: string;
  searchTerm: string;
  selectedIcons: SelectedIcon[];
  selectedCategories: string[];
  selectAllStatus: ChangelogStatus | null;
  iconSetsByCategory: Map<string, [string, IconEntry[]][]>;
  totalFilteredSets: number;
  totalIconSets: number;
  getIconSetName: (iconName: string) => string;
  isIconSetSelected: (setName: string) => boolean;
  onVersionChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelectAll: () => void;
  onSelectExportPage: () => void;
  onClearSelection: () => void;
  onCategoryToggle: (category: string) => void;
  onIconSetToggle: (setName: string, icons: IconEntry[]) => void;
  onStatusChange: (iconId: string, status: ChangelogStatus) => void;
  onBulkStatusChange: (status: ChangelogStatus) => void;
  onExportFull: () => void;
  onExportInfoOnly: () => void;
  onExportChangelogOnly: () => void;
}

export function MainScreen({
  iconType,
  versionNumber,
  searchTerm,
  selectedIcons,
  selectedCategories,
  selectAllStatus,
  iconSetsByCategory,
  totalFilteredSets,
  totalIconSets,
  getIconSetName,
  isIconSetSelected,
  onVersionChange,
  onSearchChange,
  onSelectAll,
  onSelectExportPage,
  onClearSelection,
  onCategoryToggle,
  onIconSetToggle,
  onStatusChange,
  onBulkStatusChange,
  onExportFull,
  onExportInfoOnly,
  onExportChangelogOnly,
}: MainScreenProps) {
  // Track which accordions are open for performance optimization
  // Initialize with all categories open by default
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(() => {
    return new Set(Array.from(iconSetsByCategory.keys()));
  });

  const handleAccordionToggle = useCallback(
    (category: string, isOpen: boolean) => {
      setOpenAccordions((prev) => {
        const next = new Set(prev);
        if (isOpen) {
          next.add(category);
        } else {
          next.delete(category);
        }
        return next;
      });
    },
    [],
  );

  return (
    <div className="flex flex-col h-screen db-bg-color-basic-level-1 overflow-hidden">
      {/* Header with Search */}
      <header className="flex-shrink-0 border-b border-gray-100 gap-fix-md p-fix-md">
        <h1 className="text-xl my-fix-sm">
          DB Theme {iconType || "Unknown"} Icon Exporter
        </h1>

        <SearchHeader
          versionNumber={versionNumber}
          searchTerm={searchTerm}
          onVersionChange={onVersionChange}
          onSearchChange={onSearchChange}
        />

        <SelectionControls
          selectedCount={selectedIcons.length}
          totalCount={totalIconSets}
          totalFilteredSets={totalFilteredSets}
          onSelectAll={onSelectAll}
          onSelectExportPage={onSelectExportPage}
          onClearSelection={onClearSelection}
        />
      </header>

      {/* Scrollable Container for entire content */}
      <div className="flex-1 overflow-y-auto gap-fix-md px-fix-md">
        <DBStack>
          {/* Icon Sets List */}
          <div className="m-0 py-fix-md">
            {Array.from(iconSetsByCategory.entries()).map(
              ([category, sets]) => {
                const isCategorySelected =
                  selectedCategories.includes(category);

                return (
                  <OptimizedCategorySection
                    key={category}
                    category={category}
                    iconSets={sets}
                    isCategorySelected={isCategorySelected}
                    isIconSetSelected={isIconSetSelected}
                    onCategoryToggle={onCategoryToggle}
                    onIconSetToggle={onIconSetToggle}
                    isOpen={openAccordions.has(category)}
                    onAccordionToggle={handleAccordionToggle}
                  />
                );
              },
            )}

            {totalFilteredSets === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">
                No icon sets found
              </p>
            )}
          </div>

          {/* Selected Icons with Status Selection */}
          <StatusPanel
            selectedIcons={selectedIcons}
            selectAllStatus={selectAllStatus}
            getIconSetName={getIconSetName}
            onStatusChange={onStatusChange}
            onBulkStatusChange={onBulkStatusChange}
          />
        </DBStack>
      </div>

      {/* Export Buttons - Sticky at bottom */}
      <ExportButtons
        selectedCount={selectedIcons.length}
        hasVersion={versionNumber.trim().length > 0}
        onExportFull={onExportFull}
        onExportInfoOnly={onExportInfoOnly}
        onExportChangelogOnly={onExportChangelogOnly}
      />
    </div>
  );
}
