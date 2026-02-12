/**
 * Optimized category section component using Accordion for better performance.
 *
 * Uses DBAccordion with conditional rendering - only renders icons when accordion is open.
 * This significantly improves performance by reducing DOM nodes.
 */

import { memo, useCallback, useEffect } from "react";
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
  isOpen: boolean;
  onAccordionToggle: (category: string, isOpen: boolean) => void;
}

export const OptimizedCategorySection = memo(function OptimizedCategorySection({
  category,
  iconSets,
  isCategorySelected,
  isIconSetSelected,
  onCategoryToggle,
  onIconSetToggle,
  isOpen,
  onAccordionToggle,
}: OptimizedCategorySectionProps) {
  const handleCategoryToggle = useCallback(() => {
    onCategoryToggle(category);
  }, [category, onCategoryToggle]);

  // Calculate selection state for visual feedback
  const selectedCount = iconSets.filter(([setName]) =>
    isIconSetSelected(setName),
  ).length;
  const hasSelection = selectedCount > 0;
  const allSelected = selectedCount === iconSets.length;

  // Listen to accordion toggle events
  useEffect(() => {
    const handleToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.open !== undefined) {
        onAccordionToggle(category, customEvent.detail.open);
      }
    };

    const accordionElement = document.querySelector(
      `[data-category="${category}"]`,
    );
    if (accordionElement) {
      accordionElement.addEventListener("toggle", handleToggle);
      return () => {
        accordionElement.removeEventListener("toggle", handleToggle);
      };
    }
  }, [category, onAccordionToggle]);

  return (
    <div data-density="functional" data-category={category}>
      <DBAccordion variant="card">
        <DBAccordionItem
          className="mb-fix-sm"
          headline={
            <div className="flex items-center gap-fix-sm">
              {category}
              {hasSelection && (
                <span
                  data-icon="check"
                  data-icon-weight="24"
                  data-icon-variant="outlined"
                ></span>
              )}
              <DBTag
                emphasis="strong"
                semantic={allSelected ? "successful" : "informational"}
                showCheckState={false}
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
          {/* Only render icons when accordion is open - PERFORMANCE OPTIMIZATION */}
          {isOpen && (
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
          )}
        </DBAccordionItem>
      </DBAccordion>
    </div>
  );
});
