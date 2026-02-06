/**
 * Virtualized icon list component for optimal performance with large datasets.
 *
 * Uses react-virtuoso to render only visible items, dramatically improving
 * scrolling performance and reducing initial render time.
 */

import { memo, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import { IconEntry } from "../types";
import { OptimizedCategorySection } from "./OptimizedCategorySection";

interface VirtualizedIconListProps {
  iconSetsByCategory: Map<string, [string, IconEntry[]][]>;
  selectedCategories: string[];
  isIconSetSelected: (setName: string) => boolean;
  onCategoryToggle: (category: string) => void;
  onIconSetToggle: (setName: string, icons: IconEntry[]) => void;
}

export const VirtualizedIconList = memo(function VirtualizedIconList({
  iconSetsByCategory,
  selectedCategories,
  isIconSetSelected,
  onCategoryToggle,
  onIconSetToggle,
}: VirtualizedIconListProps) {
  // Convert Map to array for virtualization
  const categories = useMemo(
    () => Array.from(iconSetsByCategory.entries()),
    [iconSetsByCategory],
  );

  if (categories.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No icon sets found
      </p>
    );
  }

  return (
    <Virtuoso
      style={{ height: "100%" }}
      totalCount={categories.length}
      itemContent={(index) => {
        const [category, sets] = categories[index];
        const isCategorySelected = selectedCategories.includes(category);

        return (
          <div style={{ paddingBottom: "16px" }}>
            <OptimizedCategorySection
              category={category}
              iconSets={sets}
              isCategorySelected={isCategorySelected}
              isIconSetSelected={isIconSetSelected}
              onCategoryToggle={onCategoryToggle}
              onIconSetToggle={onIconSetToggle}
              showDivider={index < categories.length - 1}
            />
          </div>
        );
      }}
    />
  );
});
