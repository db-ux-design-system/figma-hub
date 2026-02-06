/**
 * Optimized category section component using Accordion for better performance.
 *
 * Uses DBAccordion to render categories on-demand, significantly improving
 * performance with large icon sets by only rendering visible content.
 */

import { memo, useCallback } from "react";
import {
  DBAccordion,
  DBAccordionItem,
  DBTag,
} from "@db-ux/react-core-components";
import { IconEntry } from "../types";

interface OptimizedCategorySectionProps {
  category: string;
  iconSets: [string, IconEntry[]][];
  isCategorySelected: boolean;
  isIconSetSelected: (setName: string) => boolean;
  onCategoryToggle: (category: string) => void;
  onIconSetToggle: (setName: string, icons: IconEntry[]) => void;
  showDivider: boolean;
}

export const OptimizedCategorySection = memo(function OptimizedCategorySection({
  category,
  iconSets,
  isCategorySelected,
  isIconSetSelected,
  onCategoryToggle,
  onIconSetToggle,
  showDivider,
}: OptimizedCategorySectionProps) {
  const handleCategoryToggle = useCallback(() => {
    onCategoryToggle(category);
  }, [category, onCategoryToggle]);

  return (
    <div data-density="functional">
      <DBAccordion variant="card">
        <DBAccordionItem
          className="mb-fix-sm"
          headline={
            <div className="flex items-center gap-fix-sm">
              {category}
              <DBTag
                emphasis="strong"
                semantic={isCategorySelected ? "successful" : "neutral"}
                showCheckState={false}
                className="ml-fix-xl"
              >
                <label
                  htmlFor={`category-${category.replace(/\s+/g, "-")}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    id={`category-${category.replace(/\s+/g, "-")}`}
                    type="checkbox"
                    checked={isCategorySelected}
                    onChange={handleCategoryToggle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  Select all ({iconSets.length})
                </label>
              </DBTag>
            </div>
          }
        >
          {/* Icon sets using DBTag components */}
          <div className="flex flex-wrap gap-fix-sm mb-fix-sm pt-fix-sm">
            {iconSets.map(([setName, icons]) => {
              const isSelected = isIconSetSelected(setName);

              return (
                <DBTag
                  key={setName}
                  emphasis="weak"
                  semantic={isSelected ? "successful" : "neutral"}
                  showCheckState={false}
                >
                  <label htmlFor={`icon-${setName.replace(/\s+/g, "-")}`}>
                    <input
                      id={`icon-${setName.replace(/\s+/g, "-")}`}
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
        </DBAccordionItem>
      </DBAccordion>
    </div>
  );
});
