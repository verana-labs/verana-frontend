'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ResolvedDataField, DataViewProps, isResolvedDataField, ResolvedField, visibleFieldsForMode, translateSections, resolveTranslatable } from '@/ui/dataview/types';
import { getCostMessage, msgTypeStyle } from '@/msg/constants/msgTypeConfig';
import { useCalculateFee } from '@/hooks/useCalculateFee';
import { useTrustDepositValue } from '@/hooks/useTrustDepositValue';
import { useTrustDepositAccountData } from '@/hooks/useTrustDepositAccountData';
import { useNotification } from '@/ui/common/notification-provider';
import { useRouter } from 'next/navigation';
import { getErrorMessage, isValidField } from '@/util/validations';
// import { useTrustDepositParams } from '@/providers/trust-deposit-params-context';
import { MessageType } from '@/msg/constants/types';
import { resolveMsgCopy } from '@/msg/constants/resolveMsgTypeConfig';
import clsx from "clsx"
import { translate } from '@/i18n/dataview';
import { isJson } from '@/util/util';
import JsonCodeBlock from './json-code-block';
import ActionCard, { ActionCardProps } from './action-card';

type EditableDataViewProps<T extends object> = Omit<DataViewProps<T>, 'data'> & {
  data: T;
  messageType: MessageType;
  onSave: (newData: T) => void | Promise<void>;
  onCancel?: () => void;
  noForm?: boolean;
  isModal?: boolean;
  actionCard?: ActionCardProps;
  withinView?: boolean;
};

type FieldValidationError = {
  key: string;
  errorMessage?: string;
};

export default function EditableDataView<T extends object>({
  sectionsI18n,
  data,
  messageType,
  id,
  onSave,
  onCancel,
  noForm = false,
  isModal,
  actionCard,
  withinView
}: EditableDataViewProps<T>) {
  const sections = translateSections(sectionsI18n);
  const [formData, setFormData] = useState<T>(data);
  const [errorFields, setErrorFields] = useState<FieldValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const uiMsgType = resolveMsgCopy(messageType);
  // const trustDepositReclaimBurnRate = useTrustDepositParams().trustDepositReclaimBurnRate;
  // const burnRate = (messageType == 'MsgReclaimTrustDeposit' ? Number(trustDepositReclaimBurnRate) : 0);
  const action = id? 'edit' : 'create';
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  // Enabled Action
  const [enabledAction, setEnabledAction] = useState(false);

  // Router, notification, and errorNotified
  const router = useRouter();
  const { notify } = useNotification();
  const [errorNotified, setErrorNotified] = useState(false);
  
  // Checks if the current field value is valid
  const validatedRequiredField = useCallback((field: ResolvedField<any>, value: unknown): boolean => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!field.required) return true;
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  }, []);

  // Get fee and amount in VNA
  const { amountVNA } = useCalculateFee();

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
        // router.push('/tr');
      })();
    }
    if (errorAccountData && !errorNotified) {
      (async () => {
        await notify(errorAccountData, 'error', 'Error fetching account balance');
        setErrorNotified(true);
        // router.push('/tr');
      })();
    }
  }, [errorAccountData, errorTrustDepositValue, router, errorNotified]);
  
  // Local state to store the total required value for action (deposit + fee)
  const [totalValue, setTotalValue] = useState<string>("0.00");

  const basicSection = sections.find( (section) => (!section.type || section.type === 'basic' ) && !section.noEdit);
  // if (!basicSection) {
  //   return null;
  // }
  const visibleFields = visibleFieldsForMode(basicSection?.fields, action).filter(isResolvedDataField);

  useEffect(() => {
    // Calculate deposit and total required value
    const deposit = (messageType == 'MsgReclaimTrustDeposit') ? 0 : Number(value || 0);
    const feeAmount = Number(amountVNA || 0);
    setTotalValue((deposit + feeAmount).toFixed(6));
    const availableBalance = accountData.balance ? Number(accountData.balance)/ 1_000_000 : 0;
    const availableReclaimable = (accountData.reclaimable) ? Number(accountData.reclaimable)/ 1_000_000 : 0;
    visibleFields.forEach(field => {
      if (!isResolvedDataField(field)) return;
      if (field.name !== 'claimedVNA') return;
      field.validation = {
        ...(field.validation ?? { type: 'Number' }),
        lessThanOrEqual: availableReclaimable,
      };
    });
    const hasEnoughBalance = 
      (availableBalance >= feeAmount) &&
      ( ( availableReclaimable + availableBalance - feeAmount) >= deposit );
    setEnabledAction(hasEnoughBalance);
  }, [value, amountVNA, messageType, accountData.balance, accountData.reclaimable, sections]);
  
  // Updates form state and manages error tracking on change
  function handleChange(fieldName: keyof T, value: unknown, field: ResolvedDataField<T>) {
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
    visibleFields
      .filter(isResolvedDataField)
      .forEach(field => {
        if (field.update === false) return;
        const value = formData[field.name as keyof T];
        if (!validatedRequiredField(field, value)) {
          missing.add({key: String(field.name)});
        }
      });
    return missing.size > 0;
  // }, [formData, errorFields]);
  }, [visibleFields, formData, errorFields, validatedRequiredField]);

  // Handles save action; disables buttons while saving and prevents double submission
  async function handleSave() {
    setHasTriedSubmit(true);
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
    for (const field of visibleFields) {
      if (field.update === false) continue;
      const typedField = field as ResolvedDataField<T>;
      const value = formData[field.name as keyof T];
      if (!isValidField(typedField, value)) {
        const key = String(field.name);
        const errorMessage = getErrorMessage(field);
        invalid.set(key, errorMessage);
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

  const normalInputs: React.ReactNode[] = [];
  const textareaInputs: React.ReactNode[] = [];

  visibleFields.forEach((field) => {
    const typedField = field as ResolvedDataField<T>;
    const value = formData[field.name as keyof T];
    const isDisabled = (action === 'edit' && field.update === false);
    const key = String(field.name);
    const fieldError = errorFields.find(err => err.key === key);
    const showError = hasTriedSubmit && (Boolean(fieldError)
      || (!validatedRequiredField(typedField, value)));
    const errorMessage = fieldError?.errorMessage ?? 'Required';

    // Build base input class for all fields
    const baseInputClass = 
      "input" +
      (showError ? " border-red-500" : "") +
      (isDisabled ? " bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed" : "");

    // Render different input types
    let inputEl: React.ReactNode;

    if (field.inputType === 'textarea') {
      const jsonValue = isJson(value);
      inputEl = (action == 'edit' && jsonValue) ?
        (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 h-64 overflow-y-auto border border-neutral-20 dark:border-neutral-70">
            <JsonCodeBlock value={jsonValue} className="data-view-label" />
          </div>
        ):(
        <textarea
          className={baseInputClass + " w-full"}
          value={String(value ?? '')}
          disabled={isDisabled}
          onChange={e =>
            handleChange(field.name as keyof T, e.target.value, field)
          }
          rows={8}
        />
      );
    }
    else if (field.inputType === 'select') {
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
          onChange={e => {
            const raw = e.target.value;
            const parsed = raw === '' ? '' : Number(raw);
            handleChange(field.name as keyof T, parsed, field);
          }}
        />
      );
    } else if (field.inputType === 'date') {
      inputEl = (
        <input
          type="datetime-local"
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
          placeholder={field.placeholder}
          onChange={e => handleChange(field.name as keyof T, e.target.value, field)}
        />
      );
    }

    const fieldBlock = (
      <div key={field.name as string}>
        {/* Label with asterisk if required */}
        <label className="data-edit-label">
          {field.label}
          {field.required && (
            <span className="data-edit-required">*</span>
          )}
        </label>
        {/* Input and error message */}
        {inputEl}
        {showError && (
            <div className="data-edit-error">{errorMessage}</div>
        )}
        {/* Description inputType */}
        { (field.description) && (
            <p className="data-edit-input-description"
                dangerouslySetInnerHTML={{ __html: field.description }}
            />
          )
        }
      </div>
    );

    if (field.inputType === 'textarea') {
      textareaInputs.push(
        <div key={field.name as string}>
          {fieldBlock}
        </div>
      );
    } else {
      normalInputs.push(fieldBlock);
    }

  });

  return (
    <div className={`bg-white dark:bg-surface ${withinView? "" : "rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 space-y-4"}`}>
      { (basicSection?.name || basicSection?.nameCreate) && action == 'create' && (
        <h2 className="data-edit-section-title">{basicSection?.nameCreate ?? basicSection?.name}</h2>
      )}
      {/* { basicSection?.name && action == 'edit' && withinView && (
        <h3 className="data-view-section-title text-lg mb-6">{basicSection?.name}</h3>
      )} */}

      {/* {uiMsgType.description && (
        <div className="form-copy">
        { (messageType === 'MsgReclaimTrustDeposit' )? 
            getDescriptionMessage(uiMsgType.description, (100 - burnRate), burnRate )
            : uiMsgType.description
          }
        </div>
      )} */}

      {actionCard && <ActionCard {...actionCard} />}

      {!noForm && normalInputs.length > 0 && (
        <div className={`space-y-2 ${(action=="create" && basicSection?.classFormCreate != undefined) ? basicSection?.classFormCreate : basicSection?.classFormEdit}`}>
            {normalInputs}
        </div>
      )}

      {/* Inputs Textarea */}
      {textareaInputs.length > 0 && 
          textareaInputs
      }

      {/* Cost Message */}
      {(!actionCard || actionCard.available) && totalValue && (
        <div className={clsx('bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4',
          actionCard && actionCard.available ? 'w-fit mx-auto text-center mb-6' : 'mb-4'
          )}
        >
          <p
            className="data-edit-form-description"
            dangerouslySetInnerHTML={{ __html: getCostMessage(uiMsgType.cost, totalValue) }}
          /> 
        </div>
      )}

      {/* Warning Message */}
      {uiMsgType.warning && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
            <div className="flex">
                <i className="text-red-600 dark:text-red-400 mt-0.5 mr-3" data-fa-i2svg=""><svg className="svg-inline--fa fa-triangle-exclamation" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="triangle-exclamation" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg></i>
                <div>
                    <h5 className="font-medium text-red-900 dark:text-red-100">{resolveTranslatable({key: 'messages.warning'}, translate)}</h5>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{uiMsgType.warning}</p>
                </div>
            </div>
        </div>
      )}

      {/* Action buttons: disabled if submitting or validation fails */}
      { (!actionCard || actionCard.available) && (
      <div className={clsx('actions-center',
        actionCard && actionCard.available ? 'w-fit mx-auto text-center mb-6' : ''
        )}
      >
        {onCancel && (
          <button
            className={clsx(
              "btn-action-cancel", // base
              isModal ? "flex-1" : ''
            )}
            onClick={handleCancel}
            disabled={submitting}
          >
            {resolveTranslatable({key: 'messages.cancel'}, translate)}
          </button>
        )}
        <button
          className={clsx(
            "btn-action-confirm", // base
            isModal ? "flex-1" : '',
            msgTypeStyle[messageType].button // specific
          )}
          onClick={handleSave}
          disabled={!enabledAction || hasInvalidRequired || submitting}
        >
          {uiMsgType.label}
        </button>
      </div>
      )}

    </div>
  );
}
