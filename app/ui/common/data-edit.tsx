import React, { useState, useMemo, useCallback } from 'react';
import { DataViewProps, Field } from '@/app/types/dataViewTypes';

type EditableDataViewProps<T extends object> = Omit<DataViewProps<T>, 'data'> & {
  data: T;
  onSave: (newData: T) => void | Promise<void>;
  onCancel?: () => void;
};

export default function EditableDataView<T extends object>({
  sections,
  data,
  id,
  onSave,
  onCancel,
}: EditableDataViewProps<T>) {
  const [formData, setFormData] = useState<T>(data);
  const [errorFields, setErrorFields] = useState<Array<string>>([]);
  const [submitting, setSubmitting] = useState(false);

  // Decides if a field should be visible in the current context (create/edit/view)
  const shouldShowField = useCallback((field: Field<T>) => {
    const showByShowField =
      field.show === 'edit' || field.show === 'all' || field.show === undefined ||
      (field.show === 'create' && id===undefined);
    return ( showByShowField  && field.type === 'data');
  }, [id]);

  // Checks if the current field value is valid
  const validateField = useCallback(<T,>(field: Field<T>, value: unknown): boolean => {
    if (!field.required) return true;
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  }, []);

  // Updates form state and manages error tracking on change
  function handleChange(fieldName: keyof T, value: unknown, field: Field<T>) {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setErrorFields(prev => {
      const filtered = prev.filter(name => name !== fieldName);
      if (!validateField(field, value)) {
        return [...filtered, String(fieldName)];
      }
      return filtered;
    });
  }

  // Computes if any required fields are currently invalid
  const hasInvalidRequired = useMemo(() => {
    const missing = new Set(errorFields);
    sections.forEach(section => {
      (section.fields ?? [])
        .filter(field =>
          shouldShowField(field) &&
          field.type === 'data' &&
          field.required &&
          field.update !== false
        )
        .forEach(field => {
          const value = formData[field.name as keyof T];
          if (!validateField(field, value)) {
            missing.add(String(field.name));
          }
        });
    });
    return missing.size > 0;
  }, [shouldShowField, sections, formData, errorFields, validateField]);

  // Handles save action; disables buttons while saving and prevents double submission
  async function handleSave() {
    if (hasInvalidRequired || submitting) return;
    setSubmitting(true);
    try {
      await Promise.resolve(onSave(formData));
    } finally {
      setSubmitting(false);
    }
  }

  // Handles cancel action; disables button while submitting
  function handleCancel() {
    if (submitting || !onCancel) return;
    setSubmitting(true);
    try {
      onCancel();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-w-full">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-2 p-4 rounded-2xl bg-light-bg dark:bg-dark-bg">
          <h2 className="text-lg font-medium mb-2">{section.name}</h2>
          {(section.fields ?? []).filter(
            field => shouldShowField(field) && field.type === 'data'
          ).length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <tbody>
                  {(section.fields ?? [])
                    .filter(field => shouldShowField(field) && field.type === 'data')
                    .map((field, fieldIndex) => {
                      const value = formData[field.name as keyof T];
                      const isDisabled = field.update === false;
                      const showError = errorFields.includes(String(field.name))
                        || (field.required && !validateField(field, value));

                      // Build base input class for all fields
                      const baseInputClass =
                        "border rounded px-2 py-1 w-full bg-white dark:bg-black text-sm font-normal leading-none" +
                        (showError ? " border-red-500" : "") +
                        (isDisabled ? " opacity-70" : "");

                      // Render different input types
                      let inputEl: React.ReactNode;
                      if (field.inputType === 'select') {
                        inputEl = (
                          <select
                            className={baseInputClass}
                            value={String(value ?? '')}
                            disabled={isDisabled}
                            onChange={e => handleChange(field.name as keyof T, e.target.value, field)}
                          >
                            <option value="" disabled>
                              Select…
                            </option>
                            {(field.options ?? []).map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        );
                      } else if (field.inputType === 'number') {
                        inputEl = (
                          <input
                            type="number"
                            className={baseInputClass}
                            value={String(value ?? '')}
                            disabled={isDisabled}
                            onChange={e => handleChange(field.name as keyof T, Number(e.target.value), field)}
                          />
                        );
                      } else if (field.inputType === 'textarea') {
                        inputEl = (
                          <textarea
                            className={baseInputClass}
                            value={String(value ?? '')}
                            disabled={isDisabled}
                            onChange={e => handleChange(field.name as keyof T, e.target.value, field)}
                          />
                        );
                      } else {
                        inputEl = (
                          <input
                            type="text"
                            className={baseInputClass}
                            value={String(value ?? '')}
                            disabled={isDisabled}
                            onChange={e => handleChange(field.name as keyof T, e.target.value, field)}
                          />
                        );
                      }

                      return (
                        <tr key={fieldIndex}>
                          {/* Label with asterisk if required */}
                          <td className="py-2 pr-4 text-right align-middle w-1/3">
                            <span className="text-base font-semibold leading-none">
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </span>
                          </td>
                          {/* Input and error message */}
                          <td className="py-2 pl-2 align-middle w-2/3">
                            {inputEl}
                            {showError && (
                              <div className="text-xs text-red-500 mt-1">Required</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      {/* Action buttons: disabled if submitting or validation fails */}
      <div className="flex gap-2 mt-4">
        <button
          className="px-3 py-1 rounded-md disabled:opacity-40 bg-light-bg dark:bg-dark-bg hover:text-light-selected-text hover:bg-light-selected-bg dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg"
          onClick={handleSave}
          disabled={hasInvalidRequired || submitting}
        >
          {submitting ? "Saving..." : "Confirm"}
        </button>
        {onCancel && (
          <button
            className="px-3 py-1 rounded-md disabled:opacity-40 bg-light-bg dark:bg-dark-bg hover:text-light-selected-text hover:bg-light-selected-bg dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
