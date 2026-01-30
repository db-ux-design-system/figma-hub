/**
 * ValidationResults Component
 * Displays validation errors for name and size together
 */

import { DBNotification } from "@db-ux/react-core-components";
import type { NameValidationResult, ValidationResult } from "../types";

interface ValidationResultsProps {
  nameValidation: NameValidationResult | null;
  sizeValidation: ValidationResult | null;
  componentReadinessResult?: ValidationResult | null;
  isMasterIconFrame?: boolean;
}

export function ValidationResults({
  nameValidation,
  sizeValidation,
  componentReadinessResult = null,
  isMasterIconFrame = false,
}: ValidationResultsProps) {
  const hasNameErrors = nameValidation && !nameValidation.isValid;
  const hasSizeErrors = sizeValidation && !sizeValidation.isValid;
  const hasSizeWarnings =
    sizeValidation &&
    sizeValidation.warnings &&
    sizeValidation.warnings.length > 0;
  const hasSizeInformation =
    sizeValidation &&
    sizeValidation.information &&
    sizeValidation.information.length > 0;
  const hasReadinessErrors =
    componentReadinessResult && !componentReadinessResult.isValid;
  const hasReadinessWarnings =
    componentReadinessResult &&
    componentReadinessResult.warnings &&
    componentReadinessResult.warnings.length > 0;

  // Show success message for master icon frames without errors (warnings are OK)
  const showSuccessMessage =
    isMasterIconFrame && !hasNameErrors && !hasSizeErrors;

  if (showSuccessMessage) {
    return (
      <div className="space-y-4">
        <DBNotification
          headline="Master icon template validated successfully"
          semantic="successful"
          variant="standalone"
          className="mb-fix-md"
        >
          <div className="space-y-2">
            <p>
              Your master icon is ready! You can now fill your icon component
              set.
            </p>
            <div className="mt-fix-sm text-md">
              <strong>Next steps:</strong>
              <ol className="list-decimal list-inline pl-fix-md mt-2 space-y-1">
                <li>
                  <strong>Copy vectors</strong> to icon component set container
                </li>
                <li>
                  <strong>Outline stroke</strong> (⇧ Shift + ⌘ Cmd + O)
                </li>
                <li>
                  <strong>Union</strong> overlapping shapes (⇧ Shift + ⌥ Opt +
                  U)
                </li>
                <li>
                  <strong>Flatten</strong> paths (⇧ Shift + ⌥ Opt + F)
                </li>
              </ol>
            </div>
          </div>
        </DBNotification>

        {/* Show warnings below success message if any */}
        {hasSizeWarnings && sizeValidation && sizeValidation.warnings && (
          <DBNotification
            headline="Validation warnings"
            semantic="warning"
            variant="standalone"
            className="mb-fix-md"
          >
            <ul className="list-disc pl-fix-md space-y-fix-xs">
              {sizeValidation.warnings.map((warning, index) => (
                <li
                  key={index}
                  dangerouslySetInnerHTML={{
                    __html: warning.message,
                  }}
                />
              ))}
            </ul>
          </DBNotification>
        )}

        {/* Show information below success message if any */}
        {hasSizeInformation && sizeValidation && sizeValidation.information && (
          <DBNotification
            headline="Information"
            semantic="informational"
            variant="standalone"
            className="mb-fix-md"
          >
            <p className="mb-fix-sm">
              Try to adjust the icon to get even pixel dimensions:
            </p>
            <ul className="list-disc pl-fix-md space-y-fix-xs">
              {sizeValidation.information.map((info, index) => (
                <li
                  key={index}
                  dangerouslySetInnerHTML={{
                    __html: info.message,
                  }}
                />
              ))}
            </ul>
          </DBNotification>
        )}
      </div>
    );
  }

  if (
    !hasNameErrors &&
    !hasSizeErrors &&
    !hasSizeWarnings &&
    !hasSizeInformation &&
    !hasReadinessErrors &&
    !hasReadinessWarnings
  ) {
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
      {(hasNameErrors || hasSizeErrors || hasReadinessErrors) && (
        <h4 className="text-lg">
          Please remove the following bugs to continue.
        </h4>
      )}
      {hasNameErrors && nameValidation && (
        <DBNotification
          headline="Name validation failed"
          semantic="critical"
          variant="standalone"
          className="mb-fix-md"
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
          headline={(() => {
            const hasPositionErrors = sizeValidation.errors.some((error) =>
              error.message.includes("Check position"),
            );
            const hasSizeOnlyErrors = sizeValidation.errors.some(
              (error) =>
                !error.message.includes("Check position") &&
                !error.message.includes("stroke width") &&
                (error.message.includes("Frame size") ||
                  error.message.includes("Frame must be square") ||
                  error.message.includes("Container size") ||
                  error.message.includes("Icon content too large")),
            );
            const hasStrokeWidthErrors = sizeValidation.errors.some((error) =>
              error.message.includes("stroke width"),
            );

            // Build headline based on error types
            const errorTypes = [];
            if (hasPositionErrors) errorTypes.push("Position");
            if (hasStrokeWidthErrors) errorTypes.push("stroke width");
            if (hasSizeOnlyErrors) errorTypes.push("size");

            if (errorTypes.length === 0) {
              return "Validation failed";
            } else if (errorTypes.length === 1) {
              return `${errorTypes[0].charAt(0).toUpperCase() + errorTypes[0].slice(1)} validation failed`;
            } else if (errorTypes.length === 2) {
              return `${errorTypes[0].charAt(0).toUpperCase() + errorTypes[0].slice(1)} and ${errorTypes[1]} validation failed`;
            } else {
              return `${errorTypes[0].charAt(0).toUpperCase() + errorTypes[0].slice(1)}, ${errorTypes[1]} and ${errorTypes[2]} validation failed`;
            }
          })()}
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

      {hasReadinessErrors && componentReadinessResult && (
        <DBNotification
          headline="Icon preparation required"
          semantic="critical"
          variant="standalone"
          className="mb-fix-md"
        >
          {componentReadinessResult.errors.map((error, index) => {
            // Check if this is the preparation steps hint (first error without bullet)
            const isPreparationSteps = error.message.includes(
              "Please prepare your icon manually",
            );

            if (isPreparationSteps) {
              return (
                <div
                  key={index}
                  className="mb-fix-md"
                  dangerouslySetInnerHTML={{
                    __html: error.message,
                  }}
                />
              );
            }

            // Regular error with bullet point
            return null;
          })}
          <ul className="list-disc pl-fix-md space-y-fix-xs">
            {componentReadinessResult.errors.map((error, index) => {
              // Skip preparation steps in the bullet list
              const isPreparationSteps = error.message.includes(
                "Please prepare your icon manually",
              );
              if (isPreparationSteps) return null;

              return (
                <li
                  key={index}
                  dangerouslySetInnerHTML={{
                    __html: error.message,
                  }}
                />
              );
            })}
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
          <ul className="list-disc pl-fix-md space-y-fix-xs">
            {sizeValidation.warnings.map((warning, index) => (
              <li
                key={index}
                dangerouslySetInnerHTML={{
                  __html: warning.message,
                }}
              />
            ))}
          </ul>
        </DBNotification>
      )}

      {hasReadinessWarnings &&
        componentReadinessResult &&
        componentReadinessResult.warnings && (
          <DBNotification
            headline="Icon preparation warnings"
            semantic="warning"
            variant="standalone"
            className="mb-fix-md"
          >
            <ul className="list-disc pl-fix-md space-y-fix-xs">
              {componentReadinessResult.warnings.map((warning, index) => (
                <li
                  key={index}
                  dangerouslySetInnerHTML={{
                    __html: warning.message,
                  }}
                />
              ))}
            </ul>
          </DBNotification>
        )}

      {hasSizeInformation && sizeValidation && sizeValidation.information && (
        <DBNotification
          headline="Information"
          semantic="informational"
          variant="standalone"
          className="mb-fix-md"
        >
          <p className="mb-fix-sm">
            Try to adjust the icon to get even pixel dimensions.
          </p>
          <ul className="list-disc pl-fix-md space-y-fix-xs">
            {sizeValidation.information.map((info, index) => (
              <li
                key={index}
                dangerouslySetInnerHTML={{
                  __html: info.message,
                }}
              />
            ))}
          </ul>
        </DBNotification>
      )}
    </div>
  );
}
