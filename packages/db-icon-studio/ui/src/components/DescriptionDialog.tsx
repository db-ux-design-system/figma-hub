/**
 * DescriptionDialog Component
 * Dialog for editing icon description metadata
 */

import { useState, useEffect } from "react";
import { DBButton, DBInput } from "@db-ux/react-core-components";
import type { DescriptionData } from "../types";

interface DescriptionDialogProps {
  isOpen: boolean;
  iconType: "functional" | "illustrative" | null;
  iconName: string; // Current icon name to check if it's still template
  initialData?: DescriptionData;
  onSave: (data: DescriptionData) => void;
  onCancel: () => void;
}

export function DescriptionDialog({
  isOpen,
  iconType,
  iconName,
  initialData,
  onSave,
  onCancel,
}: DescriptionDialogProps) {
  const [formData, setFormData] = useState<DescriptionData>(
    initialData || {
      iconName: "",
      enDefault: "",
      enContextual: "",
      deDefault: "",
      deContextual: "",
      keywords: "",
      en: "",
      de: "",
      illustrativeKeywords: "",
    },
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  if (!isOpen) return null;

  // Check if icon name is still the template name
  const isTemplateName = iconName === "icon-name" || iconName === "icon_name";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Render functional icon form
  if (iconType === "functional") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 mb-fix-md">
          <h3 className="text-lg mb-0">Edit Icon Set</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-fix-xs -m-fix-xs">
          <form
            onSubmit={handleSubmit}
            id="description-form"
            className="space-y-4"
          >
            {/* Icon Name field - only show if template name not changed */}
            {isTemplateName && (
              <div className="form-section">
                <div className="form-group my-fix-sm">
                  <DBInput
                    label="Icon Name"
                    variant="floating"
                    value={formData.iconName || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, iconName: e.target.value })
                    }
                    required
                    placeholder="e.g., bell-disabled"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-row gap-fix-sm">
              <div className="form-section w-1/2">
                <h4 className="text-sm mb-fix-sm">EN:</h4>
                <div className="form-group mb-fix-sm">
                  <DBInput
                    label="Default"
                    variant="floating"
                    value={formData.enDefault}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, enDefault: e.target.value })
                    }
                    required
                    placeholder="e.g., Bell disabled"
                  />
                </div>

                <div className="form-group mb-fix-sm">
                  <DBInput
                    label="Contextual"
                    variant="floating"
                    value={formData.enContextual}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, enContextual: e.target.value })
                    }
                    placeholder="e.g., Notification off, Alert off"
                  />
                </div>
              </div>

              <div className="form-section w-1/2">
                <h4 className="text-sm mb-fix-sm">DE:</h4>
                <div className="form-group mb-fix-sm">
                  <DBInput
                    label="Default"
                    variant="floating"
                    value={formData.deDefault}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, deDefault: e.target.value })
                    }
                    required
                    placeholder="e.g., Alarmglocke inaktiv"
                  />
                </div>

                <div className="form-group mb-fix-sm">
                  <DBInput
                    label="Contextual"
                    variant="floating"
                    value={formData.deContextual}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, deContextual: e.target.value })
                    }
                    placeholder="e.g., Benachrichtigung aus, Alarm aus"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <h4 className="text-sm mb-fix-sm">General:</h4>
                <DBInput
                  label="Keywords"
                  variant="floating"
                  value={formData.keywords}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, keywords: e.target.value })
                  }
                  placeholder="e.g., durchgestrichen"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 pt-fix-md mt-fix-md">
          <div className="flex flex-row gap-fix-sm">
            <DBButton
              type="button"
              onClick={onCancel}
              variant="ghost"
              width="full"
            >
              Cancel
            </DBButton>
            <DBButton
              type="submit"
              form="description-form"
              variant="brand"
              width="full"
            >
              Save
            </DBButton>
          </div>
        </div>
      </div>
    );
  }

  // Render illustrative icon form
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-fix-md">
        <h3 className="text-lg mb-0">Edit Icon Description</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-fix-xs">
        <form onSubmit={handleSubmit} id="description-form">
          {/* Icon Name field - only show if template name not changed */}
          {isTemplateName && (
            <div className="form-section mb-fix-md">
              <h4 className="text-sm mb-fix-sm">Icon Name:</h4>
              <div className="form-group mb-fix-sm">
                <DBInput
                  label="Icon Name"
                  variant="floating"
                  value={formData.iconName || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, iconName: e.target.value })
                  }
                  required
                  placeholder="e.g., train_station"
                />
              </div>
            </div>
          )}

          <div className="flex flex-row gap-fix-sm mb-fix-md">
            <div className="form-section w-1/2">
              <h4 className="text-sm mb-fix-sm">EN:</h4>
              <div className="form-group mb-fix-sm">
                <DBInput
                  label="Description"
                  variant="floating"
                  value={formData.en}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, en: e.target.value })
                  }
                  required
                  placeholder="e.g., Train station"
                />
              </div>
            </div>

            <div className="form-section w-1/2">
              <h4 className="text-sm mb-fix-sm">DE:</h4>
              <div className="form-group mb-fix-sm">
                <DBInput
                  label="Description"
                  variant="floating"
                  value={formData.de}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, de: e.target.value })
                  }
                  required
                  placeholder="e.g., Bahnhof"
                />
              </div>
            </div>
          </div>

          <div className="form-section mt-fix-lg">
            <div className="form-group">
              <h4 className="text-sm mb-fix-sm">General:</h4>
              <DBInput
                label="Keywords"
                variant="floating"
                value={formData.illustrativeKeywords}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    illustrativeKeywords: e.target.value,
                  })
                }
                placeholder="e.g., station, railway"
              />
            </div>
          </div>
        </form>
      </div>

      <div className="flex-shrink-0 pt-fix-md mt-fix-md">
        <div className="flex flex-row gap-fix-sm">
          <DBButton
            type="button"
            onClick={onCancel}
            variant="ghost"
            width="full"
          >
            Cancel
          </DBButton>
          <DBButton
            type="submit"
            form="description-form"
            variant="brand"
            width="full"
          >
            Save
          </DBButton>
        </div>
      </div>
    </div>
  );
}
