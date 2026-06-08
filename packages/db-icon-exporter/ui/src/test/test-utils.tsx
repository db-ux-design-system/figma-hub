import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import {
  IconEntry,
  ChangelogStatus,
  ParsedDescriptionFunctional,
} from "../types";

// Custom render function that can be extended with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { ...options });
}

// Mock icon data factory
export function createMockIcon(overrides?: Partial<IconEntry>): IconEntry {
  return {
    name: "test-icon",
    id: "123",
    category: "Test Category",
    description: "Test description | Testbeschreibung | test, icon",
    parsedDescription: {
      enDefault: "Test description",
      enContextual: "",
      deDefault: "Testbeschreibung",
      deContextual: "",
      keywords: "test, icon",
    } as ParsedDescriptionFunctional,
    ...overrides,
  };
}

// Mock selected icon factory
export function createMockSelectedIcon(
  icon?: Partial<IconEntry>,
  status: ChangelogStatus = "feat",
) {
  return {
    icon: createMockIcon(icon),
    status,
  };
}

// Mock multiple icons
export function createMockIcons(
  count: number,
  categoryPrefix = "Category",
): IconEntry[] {
  return Array.from({ length: count }, (_, i) =>
    createMockIcon({
      name: `icon-${i}`,
      id: `id-${i}`,
      category: `${categoryPrefix} ${Math.floor(i / 3) + 1}`,
    }),
  );
}

// Re-export everything from testing library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
