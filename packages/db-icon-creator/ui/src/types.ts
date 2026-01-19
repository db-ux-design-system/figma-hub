/**
 * Shared types for UI workspace
 * These mirror the types from the plugin workspace
 */

// Selection Information
export interface SelectionInfo {
  isComponentSet: boolean;
  iconType: "functional" | "illustrative" | null;
  componentSet: {
    name: string;
    id: string;
  } | null;
  variantCount: number;
  isComplete: boolean; // True if all 7 sizes exist for Outlined variant
  hasOutlined: boolean; // True if Outlined variants exist
  hasFilled: boolean; // True if Filled variants exist
  uniqueSizes: number; // Number of unique sizes (e.g., 3 for 32, 24, 20)
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  message: string;
  node?: string;
}

export interface NameValidationResult {
  isValid: boolean;
  errors: string[];
  suggestion?: string;
}

// Description Types
export interface DescriptionData {
  enDefault: string;
  enContextual?: string;
  deDefault: string;
  deContextual?: string;
  keywords?: string;
}

// Message Types - UI to Plugin
export type UIMessage =
  | { type: "get-selection" }
  | { type: "validate" }
  | { type: "convert-outline" }
  | { type: "flatten" }
  | { type: "apply-colors" }
  | { type: "scale" }
  | { type: "edit-description"; payload: DescriptionData }
  | { type: "validate-name" }
  | { type: "validate-size" }
  | { type: "update-name"; payload: string }
  | { type: "create-icon-set" }
  | { type: "run-all" };

// Message Types - Plugin to UI
export type PluginMessage =
  | { type: "selection-info"; data: SelectionInfo }
  | { type: "validation-result"; data: ValidationResult }
  | { type: "name-validation-result"; data: NameValidationResult }
  | { type: "size-validation-result"; data: ValidationResult }
  | { type: "progress"; data: string }
  | { type: "success"; data?: any }
  | { type: "open-description-dialog"; data: null }
  | { type: "error"; error: string };
