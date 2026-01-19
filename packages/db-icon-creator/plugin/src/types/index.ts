/**
 * Shared types between plugin and UI workspaces
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
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  rule: string;
  message: string;
  nodeName: string;
  nodeId: string;
}

export interface NameValidationResult {
  isValid: boolean;
  errors: string[];
  suggestion?: string;
}

// Description Types
export interface DescriptionData {
  enDefault: string;
  enContextual: string;
  deDefault: string;
  deContextual: string;
  keywords: string;
}

// Color Variable Configuration
export interface ColorVariableConfig {
  functional: string;
  illustrative: string;
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
  | { type: "run-all" };

// Message Types - Plugin to UI
export type PluginMessage =
  | { type: "selection-info"; data: SelectionInfo }
  | { type: "validation-result"; data: ValidationResult }
  | { type: "name-validation-result"; data: NameValidationResult }
  | { type: "progress"; data: string }
  | { type: "success"; data?: any }
  | { type: "error"; error: string };

// Workflow Types
export interface WorkflowResult {
  success: boolean;
  completedSteps: string[];
  failedStep?: string;
  error?: string;
}
