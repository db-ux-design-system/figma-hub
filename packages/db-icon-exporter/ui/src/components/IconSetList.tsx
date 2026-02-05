// components/IconSetList.tsx
import { DBTag } from "@db-ux/react-core-components";
import { IconEntry } from "../types";

interface IconSetListProps {
  iconSetsByCategory: Map<string, [string, IconEntry[]][]>;
  selectedCategories: string[];
  isIconSetSelected: (setName: string) => boolean;
  onSelectCategory: (categoryName: string) => void;
  onToggleIconSet: (setName: string, icons: IconEntry[]) => void;
}

export const IconSetList = ({
  iconSetsByCategory,
  selectedCategories,
  isIconSetSelected,
  onSelectCategory,
  onToggleIconSet,
}: IconSetListProps) => {
  if (iconSetsByCategory.size === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        Keine Icon-Sets gefunden
      </p>
    );
  }

  return (
    <div className="m-0 py-fix-md">
      {Array.from(iconSetsByCategory.entries()).map(
        ([category, sets], categoryIndex) => {
          const isCategorySelected = selectedCategories.includes(category);

          return (
            <div key={category}>
              {/* Kategorie-Header als DBTag mit Checkbox */}
              <div className="flex items-center gap-fix-sm mb-fix-sm">
                <DBTag
                  emphasis="strong"
                  semantic="informational"
                  showCheckState={false}
                >
                  <label htmlFor={`category-${category.replace(/\s+/g, "-")}`}>
                    <input
                      id={`category-${category.replace(/\s+/g, "-")}`}
                      type="checkbox"
                      checked={isCategorySelected}
                      onChange={() => onSelectCategory(category)}
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
                          onChange={() => onToggleIconSet(setName, icons)}
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
    </div>
  );
};
