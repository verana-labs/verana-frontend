'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DataField, DataViewProps, isDataField, visibleFieldsForMode } from '@/app/types/dataViewTypes';
import { getCostMessage, getDescriptionMessage, MessageType, msgTypeConfig } from '@/app/constants/msgTypeConfig';
import { useCalculateFee } from '@/app/hooks/useCalculateFee';
import { useTrustDepositValue } from '@/app/hooks/useTrustDepositValue';
import { useTrustDepositAccountData } from '@/app/hooks/useTrustDepositAccountData';
import { useNotification } from '@/app/ui/common/notification-provider';
import { useRouter } from 'next/navigation';
import { getErrorMessage, isValidField } from '@/app/util/validations';
import { useTrustDepositParams } from '@/app/providers/trust-deposit-params-context';

type EditableDataViewProps<T extends object> = Omit<DataViewProps<T>, 'data'> & {
  data: T;
  messageType: MessageType;
  onSave: (newData: T) => void | Promise<void>;
  onCancel?: () => void;
  noForm?: boolean;
};

type FieldValidationError = {
  key: string;
  errorMessage?: string;
};

export default function EditableDataView<T extends object>({
  sections,
  data,
  messageType,
  id,
  onSave,
  onCancel,
  noForm = false
}: EditableDataViewProps<T>) {
  const [formData, setFormData] = useState<T>(data);
  const [errorFields, setErrorFields] = useState<FieldValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { description, label } = msgTypeConfig[messageType];
  const trustDepositReclaimBurnRate = useTrustDepositParams().trustDepositReclaimBurnRate;
  const burnRate = (messageType == 'MsgReclaimTrustDeposit' ? Number(trustDepositReclaimBurnRate) : 0);
  const action = id? 'edit' : 'create';
  
  // Checks if the current field value is valid
  const validatedRequiredField = useCallback((field: DataField<any>, value: unknown): boolean => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!field.required) return true;
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  }, []);

  // Enabled Action
  const [enabledAction, setEnabledAction] = useState(false);

  // Router, notification, and errorNotified
  const router = useRouter();
  const { notify } = useNotification();
  const [errorNotified, setErrorNotified] = useState(false);
  
  // Get fee and amount in VNA
  const { amountVNA } = useCalculateFee(messageType);

  // Get the trust deposit value for the message type
  const { value, errorTrustDepositValue } = useTrustDepositValue(messageType);

  // Custom hook to fetch user's account/trust deposit data
  const { accountData, errorAccountData } = useTrustDepositAccountData();

  // Show notification if there is an error fetching trust deposit value or account data
  useEffect(() => {
    if (errorTrustDepositValue && !errorNotified) {
      (async () => {
        await notify(errorTrustDepositValue, 'error', 'Error fetching trust deposit cost');
        setErrorNotified(true);
        router.push('/tr');
      })();
    }
    if (errorAccountData && !errorNotified) {
      (async () => {
        await notify(errorAccountData, 'error', 'Error fetching account balance');
        setErrorNotified(true);
        router.push('/tr');
      })();
    }
  }, [errorAccountData, errorTrustDepositValue, router, errorNotified]);
  
  // Local state to store the total required value for action (deposit + fee)
  const [totalValue, setTotalValue] = useState<string>("0.00");

  useEffect(() => {
    // Calculate deposit and total required value
    const deposit = (messageType == 'MsgReclaimTrustDeposit') ? 0 : Number(value || 0);
    const feeAmount = Number(amountVNA || 0);
    setTotalValue((deposit + feeAmount).toFixed(6));
    const availableBalance = accountData.balance ? Number(accountData.balance)/ 1_000_000 : 0;
    const availableReclaimable = (accountData.reclaimable) ? Number(accountData.reclaimable)/ 1_000_000 : 0;
    sections.forEach(section => {
      (section.fields ?? []).forEach(field => {
        if (!isDataField(field)) return;
        if (field.name !== 'claimedVNA') return;
        field.validation = {
          ...(field.validation ?? { type: 'Number' }),
          lessThanOrEqual: availableReclaimable,
        };
      });
    });
    const hasEnoughBalance = 
      (availableBalance >= feeAmount) &&
      ( ( availableReclaimable + availableBalance - feeAmount) >= deposit );
    setEnabledAction(hasEnoughBalance);
  }, [value, amountVNA, messageType, accountData.balance, accountData.reclaimable, sections]);
  
  // Updates form state and manages error tracking on change
  function handleChange(fieldName: keyof T, value: unknown, field: DataField<T>) {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setErrorFields(prev => {
      const key = String(fieldName);
      const filtered = prev.filter(err => err.key !== key);
      if (!validatedRequiredField(field, value)) {
        return [...filtered, { key }];
      }
      return filtered;
    });
  }

  // Computes if any required fields are currently invalid
  const hasInvalidRequired = useMemo(() => {
    const missing = new Set(errorFields);
    sections.forEach(section => {
      visibleFieldsForMode(section.fields, action)
        .filter(isDataField)
        .forEach(field => {
          if (field.update === false) return;
          const value = formData[field.name as keyof T];
          if (!validatedRequiredField(field, value)) {
            missing.add({key: String(field.name)});
          }
        });
    });
    return missing.size > 0;
  }, [formData, errorFields]);

  // Handles save action; disables buttons while saving and prevents double submission
  async function handleSave() {
    if (hasInvalidRequired || submitting) return;
    if (hasInvalidData()) return;
    setSubmitting(true);
    try {
      await Promise.resolve(onSave(formData));
    } finally {
      setSubmitting(false);
    }
  }

  // Future helper: checks full form validity using extended field rules
  function hasInvalidData(): boolean {
    const invalid = new Map<string, string>();
    for (const section of sections) {
      const fields = visibleFieldsForMode(section.fields, action).filter(isDataField);
      for (const field of fields) {
        if (field.update === false) continue;
        const typedField = field as DataField<T>;
        const value = formData[field.name as keyof T];
        if (!isValidField(typedField, value)) {
          const key = String(field.name);
          const errorMessage = getErrorMessage(field);
          invalid.set(key, errorMessage);
        }
      }
    }
    setErrorFields(Array.from(invalid.entries()).map(([key, errorMessage]) => ({ key, errorMessage })));
    return invalid.size > 0;
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
    <div className="data-edit-container">
      {sections.map((section, sectionIndex) => 
        section.type && section.type !== "basic" ? null : (
        <div key={sectionIndex} className="data-edit-section">
          {section.name && action == 'create' && (
            <h2 className="data-edit-section-title">{section.name}</h2>
          )}
          {description && (
            <div className="form-copy">
            { (messageType === 'MsgReclaimTrustDeposit' )? 
                getDescriptionMessage( msgTypeConfig[messageType].description, (100 - burnRate), burnRate )
                : description
              }
            </div>
          )}
          {!noForm && visibleFieldsForMode(section.fields, action)
            .length > 0 && (
            <div className="data-edit-scroll">
              <table className="data-edit-table">
                <tbody>
                  {visibleFieldsForMode(section.fields, action)
                    .filter(isDataField)
                    .map((field, fieldIndex) => {
                      const typedField = field as DataField<T>;
                      const value = formData[field.name as keyof T];
                      const isDisabled = field.update === false;
                      const key = String(field.name);
                      const fieldError = errorFields.find(err => err.key === key);
                      const showError = Boolean(fieldError)
                        || (!validatedRequiredField(typedField, value));
                      const errorMessage = fieldError?.errorMessage ?? 'Required';

                      // Build base input class for all fields
                      const baseInputClass = 
                        "input" +
                        (showError ? " border-red-500" : "") +
                        (isDisabled ? " opacity-70" : "");

                      const rows: React.ReactNode[] = [];

                      // --- Special case: textarea -> label and input in separate rows ---
                      if (field.inputType === 'textarea') {
                        rows.push(
                          // Row with label only
                          <tr key={`label-${fieldIndex}`}>
                            <td className="data-edit-label-cell">
                              <span className="data-edit-label">
                                {field.label}
                                {field.required && (
                                  <span className="data-edit-required">*</span>
                                )}
                              </span>
                            </td>
                            <td></td>
                          </tr>
                        );
                        rows.push(
                          // Row with textarea input spanning across 2 columns
                          <tr key={`input-${fieldIndex}`}>
                            <td colSpan={2} className="data-edit-input-cell">
                              <textarea
                                className={baseInputClass + " w-full"}
                                value={String(value ?? '')}
                                disabled={isDisabled}
                                onChange={e =>
                                  handleChange(field.name as keyof T, e.target.value, field)
                                }
                                rows={20}
                              />
                              {/* Error message under textarea */}
                              {showError && (
                                <div className="data-edit-error">{errorMessage}</div>
                              )}
                            </td>
                          </tr>
                        );
                        // return <React.Fragment key={fieldIndex}>{rows}</React.Fragment>;
                      }

                      else{
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
                            { (field.options ?? []).map(opt => (
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
                            onChange={e => {
                              const raw = e.target.value;
                              const parsed = raw === '' ? '' : Number(raw);
                              handleChange(field.name as keyof T, parsed, field);
                            }}
                          />
                        );
                      } else {
                        inputEl = (
                          <input
                            type="text"
                            className={baseInputClass}
                            value={String(value ?? '')}
                            disabled={isDisabled}
                            placeholder={field.placeholder}
                            onChange={e => handleChange(field.name as keyof T, e.target.value, field)}
                          />
                        );
                      }

                      rows.push(
                          <tr key={`row-${fieldIndex}`}>
                          {/* Label with asterisk if required */}
                          <td className="data-edit-label-cell">
                            <span className="data-edit-label">
                              {field.label}
                              {field.required && (
                                <span className="data-edit-required">*</span>
                              )}
                            </span>
                          </td>
                          {/* Input and error message */}
                          <td className="data-edit-input-cell">
                            {inputEl}
                            {showError && (
                              <div className="data-edit-error">{errorMessage}</div>
                            )}
                          </td>
                        </tr>
                      );
                      }

                      // Description row inputType
                      if (field.description) {
                        rows.push(
                          <tr key={`desc-${fieldIndex}`}>
                            <td colSpan={2} className="data-edit-input-cell">
                              <span
                                className="data-edit-input-description"
                                dangerouslySetInnerHTML={{ __html: field.description }}
                              /> 
                            </td>
                          </tr>
                        );
                      }

                      return <React.Fragment key={fieldIndex}>{rows}</React.Fragment>;

                    })
                                        
                  }
                </tbody>
              </table>
            </div>
          )}
          {/* Action buttons: disabled if submitting or validation fails */}
          {totalValue && (
            <div className="text-center py-2">
              <span
                className="data-edit-input-description"
                dangerouslySetInnerHTML={{ __html: getCostMessage(msgTypeConfig[messageType].cost, totalValue) }}
              /> 
            </div>
          )}
          <div className="actions-center">
            {onCancel && (
              <button
                className="btn-action"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              className="btn-action"
              onClick={handleSave}
              disabled={!enabledAction || hasInvalidRequired || submitting}
            >
              {label}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
