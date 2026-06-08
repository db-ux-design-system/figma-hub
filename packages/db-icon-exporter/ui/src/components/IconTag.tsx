/**
 * Optimized icon tag component for better performance.
 *
 * Memoized to prevent re-renders when other tags change.
 * Uses native checkbox for better performance than DBTag in large lists.
 */

import { memo, useCallback } from "react";
import { IconEntry } from "../types";

interface IconTagProps {
  setName: string;
  icons: IconEntry[];
  isSelected: boolean;
  onToggle: (setName: string, icons: IconEntry[]) => void;
}

export const IconTag = memo(function IconTag({
  setName,
  icons,
  isSelected,
  onToggle,
}: IconTagProps) {
  const checkboxId = `icon-${setName.replace(/\s+/g, "-")}`;

  const handleChange = useCallback(() => {
    onToggle(setName, icons);
  }, [setName, icons, onToggle]);

  return (
    <label
      htmlFor={checkboxId}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded
        border cursor-pointer transition-colors
        ${
          isSelected
            ? "bg-pink-100 border-pink-300 text-pink-900"
            : "bg-white border-gray-300 hover:border-gray-400"
        }
      `}
      title={`${icons.length} variant${icons.length > 1 ? "s" : ""}`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={isSelected}
        onChange={handleChange}
        className="w-4 h-4"
      />
      <span className="text-sm">{setName}</span>
    </label>
  );
});
