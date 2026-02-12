/**
 * Category section component showing category header and icon sets.
 * Memoized to prevent unnecessary re-renders when other categories change.
 */

import { memo } from "react";
import { DBTag } from "@db-ux/react-core-components";
import { IconEntry } from "../types";

interface CategorySectionProps {
  category: string;
  iconSets: [string, IconEntry[]][];
  isCategorySelected: boolean;
  isIconSetSelected: (setName: string) => boolean;
  onCategoryToggle: (category: string) => void;
  onIconSetToggle: (setName: string, icons: IconEntry[]) => void;
  showDivider: boolean;
}

export const CategorySection = memo(function CategorySection({
  category,
  iconSets,
  isCategorySelected,
  isIconSetSelected,
  onCategoryToggle,
  onIconSetToggle,
  showDivider,
}: CategorySectionProps) {
  return (
    <div>
      {/* Category header as DBTag with Checkbox */}
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
              onChange={() => onCategoryToggle(category)}
            />
            <strong>{category}</strong> ({iconSets.length})
          </label>
        </DBTag>
      </div>

      {/* Icon sets of this category as DBTag Checkboxes */}
      <div className="flex flex-wrap gap-fix-sm mb-fix-sm">
        {iconSets.map(([setName, icons]) => {
          const isSelected = isIconSetSelected(setName);
          const checkboxId = `icon-${setName.replace(/\s+/g, "-")}`;

          return (
            <DBTag key={setName} showCheckState={false} data-color="pink">
              <label
                htmlFor={checkboxId}
                title={`${icons.length} variant${icons.length > 1 ? "s" : ""}`}
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onIconSetToggle(setName, icons)}
                />
                {setName}
              </label>
            </DBTag>
          );
        })}
      </div>

      {/* Divider (except for last category) */}
      {showDivider && (
        <div className="border-t border-gray-200 my-fix-md"></div>
      )}
    </div>
  );
});
