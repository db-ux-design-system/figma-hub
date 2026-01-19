/**
 * SelectionStatus Component
 * Displays the current selection status and information including icon type
 */

import { DBInfotext, DBNotification } from "@db-ux/react-core-components";
import type {
  SelectionInfo,
  NameValidationResult,
  ValidationResult,
} from "../types";

interface SelectionStatusProps {
  info: SelectionInfo | null;
  nameValidation?: NameValidationResult | null;
  sizeValidation?: ValidationResult | null;
}

export function SelectionStatus({
  info,
  nameValidation,
  sizeValidation,
}: SelectionStatusProps) {
  if (!info) {
    return (
      <DBInfotext semantic="informational" icon="information">
        Loading selection...
      </DBInfotext>
    );
  }

  if (!info.isComponentSet) {
    return (
      <DBNotification
        variant="standalone"
        semantic="informational"
        className="mt-fix-lg"
        headline={"No Component Set selected"}
      >
        Please select a Component Set.
      </DBNotification>
    );
  }

  const hasErrors =
    (nameValidation && !nameValidation.isValid) ||
    (sizeValidation && !sizeValidation.isValid);

  // Check for specific error types
  const hasNameError = nameValidation && !nameValidation.isValid;
  const hasVariantError =
    sizeValidation &&
    !sizeValidation.isValid &&
    sizeValidation.errors.some(
      (e) =>
        e.message.includes("Outlined") ||
        e.message.includes("Filled") ||
        e.message.includes("variant"),
    );
  const hasSizeError = sizeValidation && !sizeValidation.isValid;

  return (
    <div className="grid grid-cols-2 gap-x-fix-lg gap-y-fix-2xs">
      {/* Icon Type */}
      {info.iconType && (
        <DBInfotext showIcon={false} semantic="neutral">
          <strong>Icon Type:&nbsp;</strong>
          {info.iconType === "functional" ? "Functional" : "Illustrative"}
        </DBInfotext>
      )}

      {/* Variants */}
      <DBInfotext
        showIcon={false}
        semantic={hasVariantError ? "critical" : "neutral"}
      >
        <strong>Variants:&nbsp;</strong>
        {info.hasOutlined && "Outlined"}
        {info.hasOutlined && info.hasFilled && " + "}
        {info.hasFilled && "Filled"}
      </DBInfotext>

      {/* Component Set Name */}
      <DBInfotext
        showIcon={false}
        semantic={hasNameError ? "critical" : "neutral"}
      >
        <strong>Icon Name:&nbsp;</strong>
        {info.componentSet?.name}
      </DBInfotext>

      {/* Sizes */}
      <DBInfotext
        showIcon={false}
        semantic={hasSizeError ? "critical" : "neutral"}
      >
        <strong>Sizes:&nbsp;</strong>
        {info.uniqueSizes}
      </DBInfotext>
    </div>
  );
}
