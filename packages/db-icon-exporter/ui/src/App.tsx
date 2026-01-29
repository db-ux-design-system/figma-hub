// App.tsx
import { useState, useEffect } from "react";
import {
  DBButton,
  DBInput,
  DBTag,
  DBTextarea,
  DBStack,
} from "@db-ux/react-core-components";

// ====================================================================
// TYPES & INTERFACES
// ====================================================================
interface ParsedDescriptionFunctional {
  enDefault: string;
  enContextual: string;
  deDefault: string;
  deContextual: string;
  keywords: string;
}

interface ParsedDescriptionIllustrative {
  en: string;
  de: string;
  keywords: string;
}

type ParsedDescription =
  | ParsedDescriptionFunctional
  | ParsedDescriptionIllustrative;

interface IconEntry {
  name: string;
  id: string;
  category: string;
  description: string;
  parsedDescription: ParsedDescription;
}

interface CategoryInfo {
  name: string;
  count: number;
}

type ChangelogStatus =
  | "feat"
  | "fix"
  | "refactor"
  | "docs"
  | "chore"
  | "deprecated";

const statusConfig = {
  feat: { emoji: "⭐️", label: "feat" },
  fix: { emoji: "🪲", label: "fix" },
  refactor: { emoji: "🔁", label: "refactor" },
  docs: { emoji: "📝", label: "docs" },
  chore: { emoji: "🔧", label: "chore" },
  deprecated: { emoji: "⚠️", label: "deprecated" },
};

interface SelectedIcon {
  icon: IconEntry;
  status: ChangelogStatus;
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<"main" | "export">("main");
  const [selectAllStatus, setSelectAllStatus] =
    useState<ChangelogStatus | null>("feat");
  const [exportData, setExportData] = useState<{
    mode: "full" | "info-only" | null;
    gitlabJsonSelected: string;
    gitlabJsonAll: string;
    marketingCsv: string;
    iconType: string;
  }>({
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
        console.log(`   Icon Type: ${msg.iconType}`);
        console.log(
          `   GitLab Selected length: ${msg.gitlabJsonSelected?.length || 0}`,
        );
        console.log(`   GitLab All length: ${msg.gitlabJsonAll?.length || 0}`);
        console.log(
          `   Marketing CSV length: ${msg.marketingCsv?.length || 0}`,
        );

        setExportData({
          mode: msg.mode,
          gitlabJsonSelected: msg.gitlabJsonSelected,
          gitlabJsonAll: msg.gitlabJsonAll,
          marketingCsv: msg.marketingCsv,
          iconType: msg.iconType,
        });

        // Wechsle zum Export-Screen
        console.log("🔄 App.tsx: Wechsle zu Export-Screen");
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
    // Entferne alles nach "/" (Varianten) und nach "=" (Properties)
    // Dann entferne auch "size=" und "variant=" Teile falls vorhanden
    let baseName = iconName.split("/")[0].split("=")[0].trim();

    // Entferne auch ", size" oder ", variant" Teile (alternative Notation)
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
      // Filtere Property-Definitionen aus
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

        // Prüfe ob alle verbleibenden Icons den gleichen Status haben
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
        console.log(
          `➕ Icon-Set hinzugefügt. ${newSelection.length} Icons gesamt`,
        );

        // Prüfe ob alle Icons den gleichen Status haben
        const allSameStatus = newSelection.every(
          (si) => si.status === newSelection[0].status,
        );
        setSelectAllStatus(allSameStatus ? newSelection[0].status : null);

        return newSelection;
      }
    });
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

      // Prüfe ob alle Icons den gleichen Status haben
      const allSameStatus = updated.every(
        (si) => si.status === updated[0].status,
      );
      if (allSameStatus) {
        setSelectAllStatus(updated[0].status);
      } else {
        setSelectAllStatus(null as any); // Kein Status ausgewählt wenn unterschiedlich
      }

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

    const hasVersion = versionNumber.trim().length > 0;

    // Prüfe ob "feat" Icons dabei sind → Overview muss generiert werden
    const hasFeatIcons = selectedIcons.some((si) => si.status === "feat");

    console.log(
      `📋 Version: ${hasVersion ? versionNumber : "(keine - kein Changelog)"}`,
    );
    console.log(
      `📊 Overview generieren: ${hasFeatIcons ? "Ja (feat Icons vorhanden)" : "Nein (keine feat Icons)"}`,
    );

    // Sende nur die Icon-IDs und Status-Mapping
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
          version: hasVersion ? versionNumber : null,
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

    // Prüfe ob "feat" Icons dabei sind → Overview muss generiert werden
    const hasFeatIcons = selectedIcons.some((si) => si.status === "feat");

    console.log(
      `📋 Version: ${hasVersion ? versionNumber : "(keine - kein Changelog)"}`,
    );
    console.log(
      `📊 Overview generieren: ${hasFeatIcons ? "Ja (feat Icons vorhanden)" : "Nein (keine feat Icons)"}`,
    );

    // Sende nur die Icon-IDs
    const selectedIconIds = selectedIcons.map(({ icon }) => icon.id);

    console.log(
      `📤 Sende ${selectedIconIds.length} Icon-IDs zum Info-Only Export`,
    );

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
  };

  // Export: Nur Changelog
  const handleExportChangelogOnly = () => {
    console.log("🚀 App.tsx: Starte Changelog-Only Export...");

    if (selectedIcons.length === 0) {
      alert("Bitte wählen Sie mindestens ein Icon aus.");
      return;
    }

    const hasVersion = versionNumber.trim().length > 0;

    if (!hasVersion) {
      alert(
        "Bitte geben Sie eine Versionsnummer ein, um ein Changelog zu erstellen.",
      );
      return;
    }

    console.log(`📋 Version: ${versionNumber}`);

    // Sende nur die Icon-IDs und Status-Mapping
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
          version: versionNumber,
          iconStatuses: iconStatuses,
        },
      },
      "*",
    );

    alert(`Changelog Frame für v${versionNumber} wurde erstellt!`);
  };

  // ====================================================================
  // NEUE copyToClipboard Funktion für App.tsx
  // ====================================================================

  // ERSETZE die alte copyToClipboard Funktion mit dieser:

  const copyToClipboard = (text: string, label: string) => {
    // Erstelle ein temporäres Textarea-Element
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    try {
      // Selektiere den Text
      textarea.select();
      textarea.setSelectionRange(0, text.length);

      // Kopiere mit dem alten execCommand (funktioniert in Figma)
      const successful = document.execCommand("copy");

      if (successful) {
        console.log(`✅ ${label} in Zwischenablage kopiert`);
        alert(`${label} wurde in die Zwischenablage kopiert!`);
      } else {
        console.error(`❌ Kopieren fehlgeschlagen`);
        alert(`Fehler beim Kopieren. Bitte manuell kopieren.`);
      }
    } catch (err) {
      console.error(`❌ Fehler beim Kopieren von ${label}:`, err);
      alert(`Fehler beim Kopieren: ${err}`);
    } finally {
      // Entferne das temporäre Element
      document.body.removeChild(textarea);
    }
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

  // 3. Neuer Export Screen (ersetze den gesamten Export Screen Block):
  if (currentScreen === "export") {
    if (!exportData.mode) {
      return (
        <div className="p-4">
          <p className="text-sm">⏳ Generiere Export-Daten...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <header className="flex-shrink-0 p-4 gap-fix-md p-fix-md pb-0">
          <div className="flex items-center gap-fix-xl mb-fix-sm">
            <DBButton
              icon="arrow_left"
              showIcon
              noText
              variant="ghost"
              onClick={goBackToMain}
            >
              Back
            </DBButton>
            <h1 className="text-xl my-fix-sm">
              {exportData.mode === "full" ? "Full" : "Info Only"} Export done
            </h1>
          </div>
        </header>

        {/* Scrollbarer Content */}
        <div className="flex-1 p-4 space-y-6 gap-fix-md p-fix-md">
          {/* GitLab Descriptions - Selected Icons */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  📄 GitLab Descriptions (Selected Icons)
                </p>
              </div>
              <DBButton
                size="small"
                showIcon
                icon="copy"
                variant="filled"
                onClick={() =>
                  copyToClipboard(
                    exportData.gitlabJsonSelected,
                    "GitLab Descriptions (Selected)",
                  )
                }
              >
                Copy
              </DBButton>
            </div>
            <DBTextarea
              label="GitLab Descriptions (Selected)"
              showLabel={false}
              value={exportData.gitlabJsonSelected}
              readOnly
            ></DBTextarea>
          </div>

          {/* GitLab Descriptions - ALL Icons */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  📄 GitLab Descriptions (All Icons)
                </p>
              </div>
              <DBButton
                size="small"
                showIcon
                icon="copy"
                variant="filled"
                onClick={() =>
                  copyToClipboard(
                    exportData.gitlabJsonAll,
                    "GitLab Descriptions (All)",
                  )
                }
              >
                Copy
              </DBButton>
            </div>
            <DBTextarea
              label="GitLab Descriptions (All)"
              showLabel={false}
              value={exportData.gitlabJsonAll}
              readOnly
            ></DBTextarea>
          </div>

          {/* Marketing Portal CSV */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  📊 Marketing Portal Code (All Icons)
                </p>
              </div>
              <DBButton
                size="small"
                variant="filled"
                showIcon
                icon="copy"
                onClick={() =>
                  copyToClipboard(
                    exportData.marketingCsv,
                    "Marketing Portal CSV",
                  )
                }
              >
                Copy
              </DBButton>
            </div>
            <DBTextarea
              label="Marketing Portal CSV"
              showLabel={false}
              value={exportData.marketingCsv}
              readOnly
            ></DBTextarea>
          </div>
        </div>
      </div>
    );
  }

  // Main Screen
  return (
    <div className="flex flex-col h-screen db-bg-color-basic-level-1 overflow-hidden ">
      {/* Header mit Suche */}
      <header className="flex-shrink-0 border-b border-gray-100 gap-fix-md p-fix-md">
        <h1 className="text-xl my-fix-sm">
          DB Theme {iconType || "Unbekannt"} Icon Exporter
        </h1>

        <div className="flex gap-fix-sm mb-fix-sm">
          <DBInput
            label="Version (optional)"
            placeholder="z.B. 1.2.4"
            value={versionNumber}
            onInput={(e: any) => {
              setVersionNumber(e.target.value);
            }}
            className="w-32"
          />
          <DBInput
            label="Filter Icons"
            placeholder=""
            value={searchTerm}
            onInput={(e: any) => {
              setSearchTerm(e.target.value);
            }}
            className="flex-1"
          />
        </div>

        <div className="flex gap-fix-md">
          {selectedIcons.length === iconSets.size ? (
            <DBTag>
              <button onClick={clearSelection}>Clear selection</button>
            </DBTag>
          ) : selectedIcons.length > 0 ? (
            <>
              <DBTag>
                <button onClick={selectAllIconSets}>Select all</button>
              </DBTag>
              <DBTag>
                <button onClick={selectFromExportPage}>
                  Select Export-Page
                </button>
              </DBTag>
              <DBTag>
                <button onClick={clearSelection}>Clear selection</button>
              </DBTag>
            </>
          ) : (
            <>
              <DBTag>
                <button onClick={selectAllIconSets}>
                  Select all icon sets ({totalFilteredSets})
                </button>
              </DBTag>
              <DBTag>
                <button onClick={selectFromExportPage}>
                  Select Export-Page
                </button>
              </DBTag>
            </>
          )}
        </div>
      </header>

      {/* Scrollbarer Container für den gesamten Inhalt */}
      <div className="flex-1 overflow-y-auto gap-fix-md px-fix-md">
        <DBStack>
          {/* Icon-Sets Liste */}
          <div className="m-0 py-fix-md">
            {Array.from(iconSetsByCategory.entries()).map(
              ([category, sets], categoryIndex) => {
                const isCategorySelected =
                  selectedCategories.includes(category);

                return (
                  <div key={category}>
                    {/* Kategorie-Header als DBTag mit Checkbox */}
                    <div className="flex items-center gap-fix-sm mb-fix-sm">
                      <DBTag
                        emphasis="strong"
                        semantic="informational"
                        showCheckState={false}
                      >
                        <label
                          htmlFor={`category-${category.replace(/\s+/g, "-")}`}
                        >
                          <input
                            id={`category-${category.replace(/\s+/g, "-")}`}
                            type="checkbox"
                            checked={isCategorySelected}
                            onChange={() => selectCategory(category)}
                          />
                          <strong>{category}</strong> ({sets.length})
                        </label>
                      </DBTag>
                    </div>

                    {/* Icon-Sets dieser Kategorie als DBTag Checkboxes */}
                    <div className="flex flex-wrap gap-fix-sm mb-fix-sm">
                      {sets.map(([setName, icons]) => {
                        const isSelected = isIconSetSelected(setName);
                        const checkboxId = `icon-${setName.replace(/\s+/g, "-")}`;

                        return (
                          <DBTag
                            key={setName}
                            showCheckState={false}
                            data-color="pink"
                          >
                            <label
                              htmlFor={checkboxId}
                              title={`${icons.length} Variante${
                                icons.length > 1 ? "n" : ""
                              }`}
                            >
                              <input
                                id={checkboxId}
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleIconSet(setName, icons)}
                              />
                              {setName}
                            </label>
                          </DBTag>
                        );
                      })}
                    </div>

                    {/* Divider (außer bei letzter Kategorie) */}
                    {categoryIndex < iconSetsByCategory.size - 1 && (
                      <div className="border-t border-gray-200 my-fix-md"></div>
                    )}
                  </div>
                );
              },
            )}

            {totalFilteredSets === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">
                Keine Icon-Sets gefunden
              </p>
            )}
          </div>

          {/* Ausgewählte Icons mit Status-Auswahl */}
          {selectedIcons.length > 0 && (
            <div className="p-4 pb-32 border-t border-gray-200 pb-fix-sm">
              <h4 className="text-sm mb-0">
                Ausgewählt: {selectedIcons.length} Icon-Sets
              </h4>

              {/* Header mit "Select All" für jeden Status */}
              <div className="flex gap-fix-xs mb-fix-sm mt-fix-sm">
                <p className="text-sm my-fix-xs w-1/4 font-semibold">
                  Select all
                </p>
                <div className="flex w-3/4 gap-fix-sm items-center">
                  {(
                    [
                      "feat",
                      "fix",
                      "refactor",
                      "docs",
                      "chore",
                      "deprecated",
                    ] as ChangelogStatus[]
                  ).map((s) => (
                    <DBTag key={`select-all-${s}`} showCheckState={false}>
                      <label htmlFor={`select-all-${s}`}>
                        <input
                          type="radio"
                          name="select-all-status"
                          id={`select-all-${s}`}
                          value={s}
                          checked={selectAllStatus === s}
                          onChange={() => setAllIconsToStatus(s)}
                        />
                        {statusConfig[s].emoji} {statusConfig[s].label}
                      </label>
                    </DBTag>
                  ))}
                </div>
              </div>

              {/* Border unter Select All */}
              <div className="border-t border-gray-200 mb-fix-sm"></div>

              <div className="space-y-3 gap-fix-sm">
                {selectedIcons.map(({ icon, status }) => {
                  const setName = getIconSetName(icon.name);
                  return (
                    <div className="flex gap-fix-xs" key={icon.id}>
                      <p className="text-sm my-fix-xs w-1/4">{setName}</p>
                      <div className="flex w-3/4 gap-fix-sm items-center">
                        {(
                          [
                            "feat",
                            "fix",
                            "refactor",
                            "docs",
                            "chore",
                            "deprecated",
                          ] as ChangelogStatus[]
                        ).map((s) => (
                          <DBTag showCheckState={false} key={`${icon.id}-${s}`}>
                            <label htmlFor={`status-${icon.id}-${s}`}>
                              <input
                                type="radio"
                                name={`status-${icon.id}`}
                                id={`status-${icon.id}-${s}`}
                                value={s}
                                checked={status === s}
                                onChange={() => updateIconStatus(icon.id, s)}
                              />
                              {statusConfig[s].emoji} {statusConfig[s].label}
                            </label>
                          </DBTag>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DBStack>
      </div>

      {/* Export Buttons - Sticky am unteren Rand */}
      {selectedIcons.length > 0 && (
        <div className="flex-shrink-0 sticky bottom-0 border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-fix-sm p-fix-md">
            <DBButton onClick={handleExportFull} variant="primary">
              📦 Vollständig exportieren (Assets + Infos)
            </DBButton>
            <DBButton onClick={handleExportInfoOnly} variant="secondary">
              📋 Nur Infos exportieren
            </DBButton>
            {versionNumber.trim().length > 0 && (
              <DBButton onClick={handleExportChangelogOnly} variant="secondary">
                📝 Nur Changelog erstellen
              </DBButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
