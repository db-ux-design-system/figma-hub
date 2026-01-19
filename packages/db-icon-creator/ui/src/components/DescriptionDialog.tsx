/**
 * DescriptionDialog Component
 * Dialog for editing icon description metadata
 */

import { useState, useEffect } from "react";
import { DBButton, DBInput } from "@db-ui/react-components";
import type { DescriptionData } from "../types";

interface DescriptionDialogProps {
  isOpen: boolean;
  initialData?: DescriptionData;
  onSave: (data: DescriptionData) => void;
  onCancel: () => void;
}

export function DescriptionDialog({
  isOpen,
  initialData,
  onSave,
  onCancel,
}: DescriptionDialogProps) {
  const [formData, setFormData] = useState<DescriptionData>(
    initialData || {
      enDefault: "",
      enContextual: "",
      deDefault: "",
      deContextual: "",
      keywords: "",
    },
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>Edit Icon Description</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>EN:</h4>
            <div className="form-group">
              <DBInput
                label="Default"
                value={formData.enDefault}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, enDefault: e.target.value })
                }
                required
                placeholder="e.g., Bell disabled"
              />
            </div>

            <div className="form-group">
              <DBInput
                label="Contextual"
                value={formData.enContextual}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, enContextual: e.target.value })
                }
                required
                placeholder="e.g., Notification off, Alert off"
              />
            </div>
          </div>

          <div className="form-section">
            <h4>DE:</h4>
            <div className="form-group">
              <DBInput
                label="Default"
                value={formData.deDefault}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, deDefault: e.target.value })
                }
                required
                placeholder="e.g., Alarmglocke inaktiv"
              />
            </div>

            <div className="form-group">
              <DBInput
                label="Contextual"
                value={formData.deContextual}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, deContextual: e.target.value })
                }
                required
                placeholder="e.g., Benachrichtigung aus, Alarm aus"
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <DBInput
                label="Keywords"
                value={formData.keywords}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                required
                placeholder="e.g., durchgestrichen"
              />
            </div>
          </div>

          <div className="dialog-actions">
            <DBButton type="button" onClick={onCancel} variant="secondary">
              Cancel
            </DBButton>
            <DBButton type="submit" variant="primary">
              Save
            </DBButton>
          </div>
        </form>
      </div>
    </div>
  );
}
