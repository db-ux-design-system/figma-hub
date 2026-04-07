/**
 * Custom hook for debouncing values.
 *
 * Delays updating the debounced value until after the specified delay
 * has elapsed since the last change. Useful for expensive operations
 * like search filtering or API calls.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * // debouncedSearch only updates 300ms after user stops typing
 * useEffect(() => {
 *   performExpensiveSearch(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
