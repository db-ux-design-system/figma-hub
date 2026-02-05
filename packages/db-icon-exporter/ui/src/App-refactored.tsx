// App-refactored.tsx
import { useState, useEffect } from "react";
import { DBStack } from "@db-ux/react-core-components";

// Components
import { HeaderControls } from "./components/HeaderControls";
import { IconSetList } from "./components/IconSetList";
import { SelectedIconsPanel } from "./components/SelectedIconsPanel";
import { ExportButtons } from "./components/ExportButtons";
import { ExportResultsView } from "./components/ExportResultsView";

// Types
import {
  IconEntry,
  CategoryInfo,
  ChangelogStatus,
  SelectedIcon,
  ExportData,
} from "./types";

// Utils
import { validateVersion, sanitizeVersion } from "./utils/validation";
import { copyToClipboard } from "./utils/clipboard";

// ====================================================================
// MAIN COMPONENT
// ====================================================================
const App = () => {
  // State
  const [icons, setIcons] = useState<IconEntry[]>([]);
  const [iconType, setIconType] = useState<string>("");
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIcons, setSelectedIcons] = useState<SelectedIcon[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [versionNumber, setVersionNumber] = useState<string>("");
  const [versionError, setVersionError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<"main" | "export">("main");
  const [selectAllStatus, setSelectAllStatus] =
    useState<ChangelogStatus | null>("feat");
  const [exportData, setExportData] = useState<ExportData>({
    mode: null,
    gitlabJsonSelected: "",
    gitlabJsonAll: "",
    marketingCsv: "",
    iconType: "",
  });

  // ================================================================
  // LIFECYCLE & MESSAGE HANDLING
  // ================================================================
  useEffect(() => {
    console.log("🎨 App.tsx: Komponente gemountet");

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (!msg) {
        console.warn("⚠️ App.tsx: Keine pluginMessage gefunden!");
        return;
      }

      if (msg.type === "scan-result") {
        console.log(
          `📊 App.tsx: Scan-Ergebnis erhalten - ${msg.icons.length} Icons, Type: ${msg.iconType}`,
        );

        setIcons(msg.icons);
        setIconType(msg.iconType);
        setIsLoading(false);

        // Kategorien berechnen
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

        console.log(`🗂 App.tsx: ${categoryList.length} Kategorien gefunden`);
        setCategories(categoryList);
      } else if (msg.type === "select-export-page-icons") {
        console.log(
          `📄 App.tsx: ${msg.icons.length} Icons von Export-Seite erhalten`,
        );

        // Gruppiere nach Icon-Set und nimm nur einen Vertreter pro Set
        const iconSetMap = new Map<string, IconEntry>();
        msg.icons.forEach((icon: IconEntry) => {
          const setName = icon.name.split("/")[0].split("=")[0].trim();
          if (!iconSetMap.has(setName)) {
            iconSetMap.set(setName, icon);
          }
        });

        const iconsToSelect: SelectedIcon[] = Array.from(
          iconSetMap.values(),
        ).map((icon) => ({
          icon,
          status: "feat" as ChangelogStatus,
        }));

        setSelectedIcons(iconsToSelect);
        console.log(`✅ ${iconsToSelect.length} Icon-Sets ausgewählt`);
      } else if (msg.type === "error") {
        console.error("❌ App.tsx: Fehler vom Backend:", msg.message);
        setIsLoading(false);
      } else if (msg.type === "export-error") {
        console.error("❌ App.tsx: Export-Fehler:", msg.message);
        alert(msg.message);
      } else if (msg.type === "export-data-ready") {
        console.log(`✅ App.tsx: Export-Daten erhalten (Mode: ${msg.mode})`);

        setExportData({
          mode: msg.mode,
          gitlabJsonSelected: msg.gitlabJsonSelected,
          gitlabJsonAll: msg.gitlabJsonAll,
          marketingCsv: msg.marketingCsv,
          iconType: msg.iconType,
        });

        setCurrentScreen("export");
        console.log("✅ App.tsx: currentScreen auf 'export' gesetzt");
      }
    };

    window.addEventListener("message", handleMessage);
    console.log("✅ App.tsx: Message Listener registriert");

    // UI_READY Signal an Backend senden
    parent.postMessage({ pluginMessage: { type: "UI_READY" } }, "*");
    console.log("✅ App.tsx: UI_READY gesendet!");

    return () => {
      window.removeEventListener("message", handleMessage);
      console.log("🧹 App.tsx: Message Listener entfernt");
    };
  }, []);

  // ================================================================
  // HELPER FUNCTIONS
  // ================================================================

  // Icon-Set Namen extrahieren (ohne Variante/Größe)
  const getIconSetName = (iconName: string): string => {
    let baseName = iconName.split("/")[0].split("=")[0].trim();
    baseName = baseName.split(",")[0].trim();
    return baseName;
  };

  // Prüfe ob ein Icon-Name eine Property-Definition ist (kein echtes Icon)
  const isPropertyDefinition = (iconName: string): boolean => {
    const baseName = getIconSetName(iconName);
    const propertyNames = ["size", "variant", "state", "type", "color"];
    return (
      propertyNames.includes(baseName.toLowerCase()) || baseName.length === 0
    );
  };

  // Gruppiere Icons nach Icon-Sets
  const getIconSets = (): Map<string, IconEntry[]> => {
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
  };

  const iconSets = getIconSets();

  // Prüfe ob Icon-Set ausgewählt ist
  const isIconSetSelected = (setName: string): boolean => {
    return selectedIcons.some((si) => getIconSetName(si.icon.name) === setName);
  };

  // Gefilterte Icon-Sets basierend auf Suche, gruppiert nach Kategorien
  const getFilteredIconSetsByCategory = (): Map<
    string,
    [string, IconEntry[]][]
  > => {
    const filtered = Array.from(iconSets.entries());

    const filteredSets = searchTerm.trim()
      ? filtered.filter(([setName, icons]) => {
          const lowerSearch = searchTerm.toLowerCase();
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

    // Sortiere Icon-Sets innerhalb jeder Kategorie alphabetisch
    byCategory.forEach((sets) => {
      sets.sort((a, b) => a[0].localeCompare(b[0]));
    });

    return byCategory;
  };

  const iconSetsByCategory = getFilteredIconSetsByCategory();
  const totalFilteredSets = Array.from(iconSetsByCategory.values()).reduce(
    (sum, sets) => sum + sets.length,
    0,
  );

  // ================================================================
  // EVENT HANDLERS
  // ================================================================

  // Zurück zum Hauptscreen
  const goBackToMain = () => {
    console.log("🔙 App.tsx: Zurück zum Hauptscreen");
    setCurrentScreen("main");
  };

  // Version ändern mit Validierung
  const handleVersionChange = (value: string) => {
    setVersionNumber(value);

    if (value.trim().length > 0) {
      const validation = validateVersion(value);
      if (!validation.isValid) {
        setVersionError(validation.error || "");
      } else {
        setVersionError("");
      }
    } else {
      setVersionError("");
    }
  };

  // Toggle Icon-Set (alle Varianten)
  const toggleIconSet = (setName: string, icons: IconEntry[]) => {
    console.log(
      `🔄 App.tsx: Toggle Icon-Set '${setName}' mit ${icons.length} Varianten`,
    );

    setSelectedIcons((prev) => {
      const isSelected = prev.some(
        (si) => getIconSetName(si.icon.name) === setName,
      );

      if (isSelected) {
        const newSelection = prev.filter(
          (si) => getIconSetName(si.icon.name) !== setName,
        );
        console.log(`➖ Icon-Set entfernt. ${newSelection.length} Icons übrig`);

        updateSelectAllStatus(newSelection);
        return newSelection;
      } else {
        const representativeIcon = icons[0];
        const newSelection = [
          ...prev,
          { icon: representativeIcon, status: "feat" as ChangelogStatus },
        ];
        console.log(
          `➕ Icon-Set hinzugefügt. ${newSelection.length} Icons gesamt`,
        );

        updateSelectAllStatus(newSelection);
        return newSelection;
      }
    });
  };

  // Helper: Update select all status based on selection
  const updateSelectAllStatus = (selection: SelectedIcon[]) => {
    if (selection.length > 0) {
      const allSameStatus = selection.every(
        (si) => si.status === selection[0].status,
      );
      setSelectAllStatus(allSameStatus ? selection[0].status : null);
    } else {
      setSelectAllStatus("feat");
    }
  };

  // Status für ein Icon ändern
  const updateIconStatus = (iconId: string, status: ChangelogStatus) => {
    console.log(
      `🔄 App.tsx: Status für Icon ${iconId} auf '${status}' gesetzt`,
    );

    setSelectedIcons((prev) => {
      const updated = prev.map((si) =>
        si.icon.id === iconId ? { ...si, status } : si,
      );

      updateSelectAllStatus(updated);
      return updated;
    });
  };

  // Alle ausgewählten Icons auf einen Status setzen
  const setAllIconsToStatus = (status: ChangelogStatus) => {
    console.log(
      `🔄 App.tsx: Setze alle ${selectedIcons.length} Icons auf Status '${status}'`,
    );

    setSelectAllStatus(status);
    setSelectedIcons((prev) => prev.map((si) => ({ ...si, status })));
  };

  // Kategorie-Click: Toggle alle Icon-Sets dieser Kategorie
  const selectCategory = (categoryName: string) => {
    console.log(`🗂 App.tsx: Toggle Kategorie '${categoryName}'`);

    const categoryIconSets = Array.from(iconSets.entries()).filter(
      ([_, icons]) => icons[0].category === categoryName,
    );

    const isCategorySelected = selectedCategories.includes(categoryName);

    if (isCategorySelected) {
      console.log(`   ↳ Entferne alle Icons der Kategorie '${categoryName}'`);

      setSelectedIcons((prev) =>
        prev.filter((si) => si.icon.category !== categoryName),
      );

      setSelectedCategories((prev) => prev.filter((c) => c !== categoryName));
    } else {
      console.log(`   ↳ Füge ${categoryIconSets.length} Icon-Sets hinzu`);

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
  };

  // Alle Icon-Sets von Export-Seite auswählen
  const selectFromExportPage = () => {
    console.log("📄 App.tsx: Lade Icons von Export-Seite");
    parent.postMessage(
      { pluginMessage: { type: "SELECT_FROM_EXPORT_PAGE" } },
      "*",
    );
  };

  // Alle Icon-Sets auswählen
  const selectAllIconSets = () => {
    console.log(`✅ App.tsx: Wähle alle ${iconSets.size} Icon-Sets aus`);

    const allSets: SelectedIcon[] = Array.from(iconSets.entries()).map(
      ([_, icons]) => ({
        icon: icons[0],
        status: "feat" as ChangelogStatus,
      }),
    );

    setSelectedIcons(allSets);

    const allCategoryNames = categories.map((c) => c.name);
    setSelectedCategories(allCategoryNames);
    console.log(`   ↳ Alle ${allCategoryNames.length} Kategorien ausgewählt`);
  };

  // Auswahl leeren
  const clearSelection = () => {
    console.log("🗑️ App.tsx: Auswahl geleert");
    setSelectedIcons([]);
    setSelectedCategories([]);
  };

  // Export: Full mit Assets
  const handleExportFull = () => {
    console.log("🚀 App.tsx: Starte Full Export...");

    if (selectedIcons.length === 0) {
      alert("Bitte wählen Sie mindestens ein Icon aus.");
      return;
    }

    // Validate version if provided
    if (versionNumber.trim().length > 0) {
      const validation = validateVersion(versionNumber);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }
    }

    const hasVersion = versionNumber.trim().length > 0;
    const hasFeatIcons = selectedIcons.some((si) => si.status === "feat");

    const selectedIconIds = selectedIcons.map(({ icon }) => icon.id);
    const iconStatuses: Record<string, ChangelogStatus> = {};
    selectedIcons.forEach(({ icon, status }) => {
      iconStatuses[icon.id] = status;
    });

    console.log(`📤 Sende ${selectedIconIds.length} Icon-IDs zum Full Export`);

    parent.postMessage(
      {
        pluginMessage: {
          type: "EXPORT_FULL",
          selectedIconIds: selectedIconIds,
          version: hasVersion ? sanitizeVersion(versionNumber) : null,
          generateOverview: hasFeatIcons,
          iconStatuses: iconStatuses,
        },
      },
      "*",
    );
  };

  // Export: Nur Infos
  const handleExportInfoOnly = () => {
    console.log("🚀 App.tsx: Starte Info-Only Export...");

    if (selectedIcons.length === 0) {
      alert("Bitte wählen Sie mindestens ein Icon aus.");
      return;
    }

    const hasVersion = versionNumber.trim().length > 0;
    const hasFeatIcons = selectedIcons.some((si) => si.status === "feat");

    const selectedIconIds = selectedIcons.map(({ icon }) => icon.id);

    console.log(
      `📤 Sende ${selectedIconIds.length} Icon-IDs zum Info-Only Export`,
    );

    parent.postMessage(
      {
        pluginMessage: {
          type: "EXPORT_INFO_ONLY",
          selectedIconIds: selectedIconIds,
          version: hasVersion ? sanitizeVersion(versionNumber) : null,
          generateOverview: hasFeatIcons,
        },
      },
      "*",
    );
  };

  // Export: Nur Changelog
  const handleExportChangelogOnly = () => {
    console.log("🚀 App.tsx: Starte Changelog-Only Export...");

    if (selectedIcons.length === 0) {
      alert("Bitte wählen Sie mindestens ein Icon aus.");
      return;
    }

    if (versionNumber.trim().length === 0) {
      alert(
        "Bitte geben Sie eine Versionsnummer ein, um ein Changelog zu erstellen.",
      );
      return;
    }

    // Validate version
    const validation = validateVersion(versionNumber);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    const sanitized = sanitizeVersion(versionNumber);

    const selectedIconIds = selectedIcons.map(({ icon }) => icon.id);
    const iconStatuses: Record<string, ChangelogStatus> = {};
    selectedIcons.forEach(({ icon, status }) => {
      iconStatuses[icon.id] = status;
    });

    console.log(
      `📤 Sende ${selectedIconIds.length} Icon-IDs zum Changelog-Only Export`,
    );

    parent.postMessage(
      {
        pluginMessage: {
          type: "EXPORT_CHANGELOG_ONLY",
          selectedIconIds: selectedIconIds,
          version: sanitized,
          iconStatuses: iconStatuses,
        },
      },
      "*",
    );

    alert(`Changelog Frame für v${sanitized} wurde erstellt!`);
  };

  // ================================================================
  // RENDER
  // ================================================================

  console.log(
    "🎨 App.tsx RENDER - currentScreen:",
    currentScreen,
    "exportData.mode:",
    exportData.mode,
  );

  if (isLoading) {
    return (
      <div className="p-fix-md flex flex-col gap-fix-md">
        <p className="text-sm p-4">
          ⏳ Loading icons … (Waiting for scan results)
        </p>
      </div>
    );
  }

  // Export Screen
  if (currentScreen === "export") {
    if (!exportData.mode) {
      return (
        <div className="p-4">
          <p className="text-sm">⏳ Generiere Export-Daten...</p>
        </div>
      );
    }

    return (
      <ExportResultsView
        mode={exportData.mode}
        gitlabJsonSelected={exportData.gitlabJsonSelected}
        gitlabJsonAll={exportData.gitlabJsonAll}
        marketingCsv={exportData.marketingCsv}
        onBack={goBackToMain}
        onCopy={copyToClipboard}
      />
    );
  }

  // Main Screen
  return (
    <div className="flex flex-col h-screen db-bg-color-basic-level-1 overflow-hidden">
      <HeaderControls
        iconType={iconType}
        versionNumber={versionNumber}
        searchTerm={searchTerm}
        selectedIconsCount={selectedIcons.length}
        totalIconSets={iconSets.size}
        totalFilteredSets={totalFilteredSets}
        onVersionChange={handleVersionChange}
        onSearchChange={setSearchTerm}
        onSelectAll={selectAllIconSets}
        onSelectFromExportPage={selectFromExportPage}
        onClearSelection={clearSelection}
      />

      {versionError && (
        <div className="px-fix-md py-fix-sm bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">⚠️ {versionError}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto gap-fix-md px-fix-md">
        <DBStack>
          <IconSetList
            iconSetsByCategory={iconSetsByCategory}
            selectedCategories={selectedCategories}
            isIconSetSelected={isIconSetSelected}
            onSelectCategory={selectCategory}
            onToggleIconSet={toggleIconSet}
          />

          <SelectedIconsPanel
            selectedIcons={selectedIcons}
            selectAllStatus={selectAllStatus}
            getIconSetName={getIconSetName}
            onSetAllIconsToStatus={setAllIconsToStatus}
            onUpdateIconStatus={updateIconStatus}
          />
        </DBStack>
      </div>

      <ExportButtons
        selectedIconsCount={selectedIcons.length}
        hasVersion={versionNumber.trim().length > 0 && !versionError}
        onExportFull={handleExportFull}
        onExportInfoOnly={handleExportInfoOnly}
        onExportChangelogOnly={handleExportChangelogOnly}
      />
    </div>
  );
};

export default App;
