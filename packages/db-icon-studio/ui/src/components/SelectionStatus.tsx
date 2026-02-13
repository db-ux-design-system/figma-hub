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

  if (
    !info.isComponentSet &&
    !info.isComponent &&
    !info.isMasterIconFrame &&
    !info.isHandoverFrame
  ) {
    return (
      <DBNotification
        variant="standalone"
        semantic="informational"
        className="mt-fix-lg"
        headline={"No Master icon frame, component or component Set selected"}
      >
        Please select a master icon frame, a single component (illustrative
        icons) or a component set (functional icons).
      </DBNotification>
    );
  }

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

  // Get the name to display
  const displayName =
    info.componentSet?.name ||
    info.component?.name ||
    info.masterIconFrame?.name ||
    "";

  return (
    <div className="grid grid-cols-2 gap-x-fix-lg gap-y-fix-2xs">
      {/* Icon Type */}
      {info.iconType && (
        <DBInfotext showIcon={false} semantic="neutral">
          <strong>Icon Type:&nbsp;</strong>
          {info.iconType === "functional" ? "Functional" : "Illustrative"}
        </DBInfotext>
      )}

      {/* Master Icon Frame Size */}
      {(info.isMasterIconFrame || info.isHandoverFrame) &&
        info.masterIconFrame && (
          <DBInfotext showIcon={false} semantic="neutral">
            <strong>Frame Size:&nbsp;</strong>
            {info.masterIconFrame.size}px
          </DBInfotext>
        )}

      {/* Variants - only for functional icons */}
      {info.isComponentSet && (
        <DBInfotext
          showIcon={false}
          semantic={hasVariantError ? "critical" : "neutral"}
        >
          <strong>Variants:&nbsp;</strong>
          {info.hasOutlined && "Outlined"}
          {info.hasOutlined && info.hasFilled && " + "}
          {info.hasFilled && "Filled"}
        </DBInfotext>
      )}

      {/* Icon Name */}
      {!info.isMasterIconFrame && !info.isHandoverFrame && (
        <DBInfotext
          showIcon={false}
          semantic={hasNameError ? "critical" : "neutral"}
        >
          <strong>Icon Name:&nbsp;</strong>
          {displayName}
        </DBInfotext>
      )}

      {/* Frame Name - for master icon frames and handover frames */}
      {(info.isMasterIconFrame || info.isHandoverFrame) && (
        <DBInfotext showIcon={false} semantic="neutral">
          <strong>Frame Name:&nbsp;</strong>
          {displayName}
        </DBInfotext>
      )}

      {/* Sizes - only for functional icons */}
      {info.isComponentSet && (
        <DBInfotext
          showIcon={false}
          semantic={hasSizeError ? "critical" : "neutral"}
        >
          <strong>Sizes:&nbsp;</strong>
          {info.uniqueSizes}
        </DBInfotext>
      )}

      {/* Size - for illustrative icons */}
      {info.isComponent && (
        <DBInfotext showIcon={false} semantic="neutral">
          <strong>Size:&nbsp;</strong>
          64px
        </DBInfotext>
      )}
    </div>
  );
}
