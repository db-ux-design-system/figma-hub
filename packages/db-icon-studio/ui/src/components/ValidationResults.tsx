/**
 * ValidationResults Component
 * Displays validation errors for name and size together
 */

import { DBNotification } from "@db-ux/react-core-components";
import type { NameValidationResult, ValidationResult } from "../types";

interface ValidationResultsProps {
  nameValidation: NameValidationResult | null;
  sizeValidation: ValidationResult | null;
}

export function ValidationResults({
  nameValidation,
  sizeValidation,
}: ValidationResultsProps) {
  const hasNameErrors = nameValidation && !nameValidation.isValid;
  const hasSizeErrors = sizeValidation && !sizeValidation.isValid;
  const hasSizeWarnings =
    sizeValidation &&
    sizeValidation.warnings &&
    sizeValidation.warnings.length > 0;

  if (!hasNameErrors && !hasSizeErrors && !hasSizeWarnings) {
    return null;
  }

  // Helper function to format error messages with bold variant names
  const formatErrorMessage = (message: string) => {
    // Match patterns like "(Def) Outlined, 24px" or "Filled, 32px"
    const variantPattern = /(\(Def\) Outlined|Filled),\s*(\d+px)/g;

    // Replace with bold formatting
    const formatted = message.replace(
      variantPattern,
      "<strong>$1, $2</strong>",
    );

    return formatted;
  };

  return (
    <div className="space-y-4 flex flex-col gap-fix-sm">
      {(hasNameErrors || hasSizeErrors) && (
        <h4 className="text-lg">
          Please remove the following bugs to continue.
        </h4>
      )}
      {hasNameErrors && nameValidation && (
        <DBNotification
          headline="Name validation failed"
          semantic="critical"
          variant="standalone"
        >
          <ul className="list-disc pl-fix-md space-y-fix-xs">
            {nameValidation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </DBNotification>
      )}

      {hasSizeErrors && sizeValidation && (
        <DBNotification
          headline="Size validation failed"
          semantic="critical"
          variant="standalone"
        >
          <ul className="list-disc pl-fix-md space-y-fix-xs">
            {sizeValidation.errors.map((error, index) => (
              <li
                key={index}
                dangerouslySetInnerHTML={{
                  __html: formatErrorMessage(error.message),
                }}
              />
            ))}
          </ul>
        </DBNotification>
      )}

      {hasSizeWarnings && sizeValidation && sizeValidation.warnings && (
        <DBNotification
          headline="Validation warnings"
          semantic="warning"
          variant="standalone"
          className="mb-fix-md"
        >
          <ul className="list-disc list-inside pl-fix-md space-y-fix-xs">
            {sizeValidation.warnings.map((warning, index) => (
              <li key={index}>{warning.message}</li>
            ))}
          </ul>
        </DBNotification>
      )}
    </div>
  );
}
