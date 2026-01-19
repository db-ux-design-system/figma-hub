/**
 * ValidationResults Component
 * Displays validation results with semantic styling
 */

import { DBInfotext } from "@db-ui/react-components";
import type { ValidationResult, NameValidationResult } from "../types";

interface ValidationResultsProps {
  result: ValidationResult | NameValidationResult | null;
  type?: "vector" | "name";
}

export function ValidationResults({
  result,
  type = "vector",
}: ValidationResultsProps) {
  if (!result) return null;

  if (result.isValid) {
    return (
      <DBInfotext semantic="successful" icon="check">
        {type === "vector"
          ? "All vectors meet the requirements."
          : "Icon name follows naming conventions."}
      </DBInfotext>
    );
  }

  // Handle name validation results
  if ("suggestion" in result) {
    return (
      <DBInfotext semantic="critical" icon="error">
        <strong>Name Validation Failed</strong>
        <ul>
          {result.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
        {result.suggestion && (
          <p>
            <strong>Suggested name:</strong> {result.suggestion}
          </p>
        )}
      </DBInfotext>
    );
  }

  // Handle vector validation results
  return (
    <DBInfotext semantic="critical" icon="error">
      <strong>Validation Failed</strong>
      <ul>
        {(result as ValidationResult).errors.map((error, index) => (
          <li key={index}>
            <strong>{error.rule}:</strong> {error.message}
            <br />
            <small>Node: {error.nodeName}</small>
          </li>
        ))}
      </ul>
    </DBInfotext>
  );
}
