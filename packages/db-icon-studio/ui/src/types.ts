/**
 * Shared types for UI workspace
 * These mirror the types from the plugin workspace
 */

// Selection Information
export interface SelectionInfo {
  isComponentSet: boolean;
  isComponent: boolean;
  iconType: "functional" | "illustrative" | null;
  componentSet: {
    name: string;
    id: string;
  } | null;
  component: {
    name: string;
    id: string;
  } | null;
  variantCount: number;
  isComplete: boolean; // True if all 7 sizes exist for Outlined variant (functional) or icon is ready (illustrative)
  hasOutlined: boolean; // True if Outlined variants exist (functional only)
  hasFilled: boolean; // True if Filled variants exist (functional only)
  uniqueSizes: number; // Number of unique sizes (functional) or 1 (illustrative)
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  message: string;
  node?: string;
}

export interface ValidationWarning {
  message: string;
  node?: string;
  canProceed: boolean; // If true, user can choose to proceed despite warning
}

export interface NameValidationResult {
  isValid: boolean;
  errors: string[];
  suggestion?: string;
}

// Description Types
export interface DescriptionData {
  // Icon name (if template name not changed)
  iconName?: string;

  // Functional icons (detailed)
  enDefault?: string;
  enContextual?: string;
  deDefault?: string;
  deContextual?: string;
  keywords?: string;

  // Illustrative icons (simplified)
  en?: string;
  de?: string;
  illustrativeKeywords?: string;
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
  | { type: "create-illustrative-icon" }
  | { type: "run-all" };

// Message Types - Plugin to UI
export type PluginMessage =
  | { type: "selection-info"; data: SelectionInfo }
  | { type: "validation-result"; data: ValidationResult }
  | { type: "name-validation-result"; data: NameValidationResult }
  | { type: "size-validation-result"; data: ValidationResult }
  | { type: "existing-description"; data: DescriptionData }
  | { type: "progress"; data: string }
  | { type: "success"; data?: any }
  | { type: "open-description-dialog"; data: null }
  | { type: "error"; error: string };
