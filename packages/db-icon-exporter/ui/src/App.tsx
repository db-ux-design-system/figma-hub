/**
 * Main App component - Refactored version
 * Orchestrates the icon exporter UI using custom hooks and components.
 */

import { useState, useMemo, useCallback } from "react";
import { IconEntry, CategoryInfo, ExportData } from "./types";
import { copyToClipboardWithFeedback } from "./utils/clipboard";
import { useIconSelection } from "./hooks/useIconSelection";
import { usePluginMessages } from "./hooks/usePluginMessages";
import { useExport } from "./hooks/useExport";
import { useDebounce } from "./hooks/useDebounce";
import { LoadingState } from "./components/LoadingState";
import { MainScreen } from "./components/MainScreen";
import { ExportScreen } from "./components/ExportScreen";

const App = () => {
  // Basic state
  const [icons, setIcons] = useState<IconEntry[]>([]);
  const [iconType, setIconType] = useState<string>("");
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [versionNumber, setVersionNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<"main" | "export">("main");
  const [exportData, setExportData] = useState<ExportData>({
    mode: null,
    gitlabJsonSelected: {},
    gitlabJsonAll: {},
    marketingCsv: "",
    iconType: "",
  });

  // Custom hooks
  const {
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
  } = useIconSelection();

  const { selectFromExportPage } = usePluginMessages({
    onIconsScanned: (
      scannedIcons: IconEntry[],
      scannedIconType: string,
      scannedCategories: CategoryInfo[],
    ) => {
      setIcons(scannedIcons);
      setIconType(scannedIconType);
      setCategories(scannedCategories);
      setIsLoading(false);
    },
    onExportPageIconsReceived: (icons: IconEntry[]) => {
      setSelectedIconsFromExportPage(icons);
    },
    onExportDataReady: (data: ExportData) => {
      setExportData(data);
      setCurrentScreen("export");
    },
    onError: () => {
      setIsLoading(false);
    },
    onExportError: (message: string) => {
      alert(message);
    },
  });

  const { exportFull, exportInfoOnly, exportChangelogOnly } = useExport();

  // Debounce search term to reduce expensive filtering operations
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Computed values
  const iconSets = useMemo(() => {
    const sets = new Map<string, IconEntry[]>();

    icons.forEach((icon) => {
      if (isPropertyDefinition(icon.name)) {
        return;
      }

      const setName = getIconSetName(icon.name);
      if (!sets.has(setName)) {
        sets.set(setName, []);
      }
      sets.get(setName)!.push(icon);
    });

    return sets;
  }, [icons, isPropertyDefinition, getIconSetName]);

  const iconSetsByCategory = useMemo(() => {
    const filtered = Array.from(iconSets.entries());

    const filteredSets = debouncedSearchTerm.trim()
      ? filtered.filter(([setName, icons]) => {
          const lowerSearch = debouncedSearchTerm.toLowerCase();
          return (
            setName.toLowerCase().includes(lowerSearch) ||
            icons[0].category.toLowerCase().includes(lowerSearch)
          );
        })
      : filtered;

    const byCategory = new Map<string, [string, IconEntry[]][]>();

    filteredSets.forEach(([setName, icons]) => {
      const category = icons[0].category;
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push([setName, icons]);
    });

    // Sort icon sets within each category alphabetically
    byCategory.forEach((sets) => {
      sets.sort((a, b) => a[0].localeCompare(b[0]));
    });

    return byCategory;
  }, [iconSets, debouncedSearchTerm]);

  const totalFilteredSets = useMemo(() => {
    return Array.from(iconSetsByCategory.values()).reduce(
      (sum, sets) => sum + sets.length,
      0,
    );
  }, [iconSetsByCategory]);

  // Event handlers - memoized to prevent unnecessary re-renders
  const handleSelectAll = useCallback(() => {
    selectAllIconSets(
      iconSets,
      categories.map((c) => c.name),
    );
  }, [selectAllIconSets, iconSets, categories]);

  const handleCategoryToggle = useCallback(
    (categoryName: string) => {
      selectCategory(categoryName, iconSets);
    },
    [selectCategory, iconSets],
  );

  const handleExportFull = useCallback(() => {
    exportFull(selectedIcons, versionNumber);
  }, [exportFull, selectedIcons, versionNumber]);

  const handleExportInfoOnly = useCallback(() => {
    exportInfoOnly(selectedIcons, versionNumber);
  }, [exportInfoOnly, selectedIcons, versionNumber]);

  const handleExportChangelogOnly = useCallback(() => {
    exportChangelogOnly(selectedIcons, versionNumber);
  }, [exportChangelogOnly, selectedIcons, versionNumber]);

  const handleCopy = useCallback(async (content: string, label: string) => {
    await copyToClipboardWithFeedback(content, label);
  }, []);

  const handleBackToMain = useCallback(() => {
    setCurrentScreen("main");
  }, []);

  // Render
  if (isLoading) {
    return <LoadingState />;
  }

  if (currentScreen === "export") {
    return (
      <ExportScreen
        exportData={exportData}
        onBack={handleBackToMain}
        onCopy={handleCopy}
      />
    );
  }

  return (
    <MainScreen
      iconType={iconType}
      versionNumber={versionNumber}
      searchTerm={searchTerm}
      selectedIcons={selectedIcons}
      selectedCategories={selectedCategories}
      selectAllStatus={selectAllStatus}
      iconSetsByCategory={iconSetsByCategory}
      totalFilteredSets={totalFilteredSets}
      totalIconSets={iconSets.size}
      getIconSetName={getIconSetName}
      isIconSetSelected={isIconSetSelected}
      onVersionChange={setVersionNumber}
      onSearchChange={setSearchTerm}
      onSelectAll={handleSelectAll}
      onSelectExportPage={selectFromExportPage}
      onClearSelection={clearSelection}
      onCategoryToggle={handleCategoryToggle}
      onIconSetToggle={toggleIconSet}
      onStatusChange={updateIconStatus}
      onBulkStatusChange={setAllIconsToStatus}
      onExportFull={handleExportFull}
      onExportInfoOnly={handleExportInfoOnly}
      onExportChangelogOnly={handleExportChangelogOnly}
    />
  );
};

export default App;
