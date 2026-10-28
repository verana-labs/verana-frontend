'use client'

import clsx from 'clsx'
import { InfoIcon, TriangleAlertIcon } from 'lucide-react'
import React, { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { canonicalizeLanguageTag } from '@/lib/language'
import { getCostMessage, msgTypeStyle } from '@/msg/constants/msgTypeConfig'
import { resolveMsgCopy } from '@/msg/constants/resolveMsgTypeConfig'
import type { MessageType } from '@/msg/constants/types'
import JsonCodeBlock from '@/ui/common/json-code-block'
import { LanguageCombobox } from '@/ui/common/language-combobox'
import {
  DataViewProps,
  isResolvedDataField,
  ResolvedDataField,
  ResolvedField,
  resolveTranslatable,
  translateSections,
  visibleFieldsForMode,
} from '@/ui/dataview/types'
import { AlertDescription, AlertTitle } from '@/ui/shadcn/alert'
import { Field, FieldDescription, FieldError } from '@/ui/shadcn/field'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Spinner } from '@/ui/shadcn/spinner'
import { Textarea } from '@/ui/shadcn/textarea'
import { formatVNAFromUVNA, isJson } from '@/util/util'
import { getErrorMessage, isValidField } from '@/util/validations'

type EditableDataViewProps<T extends object> = Omit<DataViewProps<T>, 'data'> & {
  data: T
  messageType: MessageType
  onSave: (newData: T) => void | Promise<void>
  onCancel?: () => void
  noForm?: boolean
  noFormReady?: boolean
  isModal?: boolean
  withinView?: boolean
  setModalHidden?: () => void
  transactionCost?: string
  saveDisabled?: boolean
  children?: ReactNode
}

const NOTICE_CLASS =
  'group/alert grid w-full grid-cols-[auto_1fr] gap-x-2.5 gap-y-0.5 rounded-lg border px-4 py-3 text-left text-sm *:[svg]:row-span-2 *:[svg]:size-4 *:[svg]:translate-y-0.5'

type FieldValidationError = {
  key: string
  errorMessage?: string
}

export default function EditableDataView<T extends object>({
  sectionsI18n,
  data,
  messageType,
  id,
  onSave,
  onCancel,
  noForm = false,
  noFormReady = true,
  isModal,
  withinView,
  setModalHidden,
  transactionCost,
  saveDisabled = false,
  children,
}: EditableDataViewProps<T>) {
  const sections = useMemo(() => translateSections(sectionsI18n), [sectionsI18n])
  const [formData, setFormData] = useState<T>(data)
  const [errorFields, setErrorFields] = useState<FieldValidationError[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { loading: corporationLoading } = useUserCorporation()
  const uiMsgType = resolveMsgCopy(messageType)
  const action = id ? 'edit' : 'create'
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const formId = useId()
  const requiredLabel = resolveTranslatable({ key: 'messages.required' }, translate) ?? 'Required'
  const selectPlaceholder = resolveTranslatable({ key: 'messages.select' }, translate) ?? 'Select…'

  const validatedRequiredField = useCallback((field: ResolvedField<T>, value: unknown): boolean => {
    if (!field.required) return true
    if (value === undefined || value === null) return false
    if (typeof value === 'string' && value.trim() === '') return false
    return true
  }, [])

  const basicSection = useMemo(
    () => sections.find((section) => (!section.type || section.type === 'basic') && !section.noEdit),
    [sections]
  )
  const visibleFields = useMemo(
    () => visibleFieldsForMode(basicSection?.fields, action).filter(isResolvedDataField),
    [action, basicSection]
  )

  const autoSaveRan = useRef(false)

  function handleChange(fieldName: keyof T, value: unknown, field: ResolvedDataField<T>) {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
    setErrorFields((prev) => {
      const key = String(fieldName)
      const filtered = prev.filter((err) => err.key !== key)
      if (!validatedRequiredField(field, value)) {
        return [...filtered, { key }]
      }
      return filtered
    })
  }

  const hasInvalidRequiredFields = useCallback((): boolean => {
    const requiredErrors = new Map<string, FieldValidationError>()
    for (const field of visibleFields) {
      const typedField = field as ResolvedDataField<T>
      const value = formData[field.name as keyof T]
      if (!validatedRequiredField(typedField, value)) {
        const key = String(field.name)
        requiredErrors.set(key, {
          key,
          errorMessage: requiredLabel,
        })
      }
    }
    setErrorFields((prev) => {
      const nonRequiredErrors = prev.filter((err) => !requiredErrors.has(err.key))
      return [...nonRequiredErrors, ...Array.from(requiredErrors.values())]
    })
    return requiredErrors.size > 0
  }, [formData, requiredLabel, validatedRequiredField, visibleFields])

  const hasInvalidData = useCallback((): boolean => {
    const invalid = new Map<string, string>()
    for (const field of visibleFields) {
      const typedField = field as ResolvedDataField<T>
      const value = formData[field.name as keyof T]
      if (!isValidField(typedField, value)) {
        const key = String(field.name)
        const errorMessage = getErrorMessage(field)
        invalid.set(key, errorMessage)
      }
    }
    setErrorFields(Array.from(invalid.entries()).map(([key, errorMessage]) => ({ key, errorMessage })))
    return invalid.size > 0
  }, [formData, visibleFields])

  const handleSave = useCallback(async () => {
    setHasTriedSubmit(true)
    if (submitting || hasInvalidRequiredFields() || hasInvalidData()) return
    setSubmitting(true)
    try {
      await Promise.resolve(onSave(formData))
    } finally {
      setSubmitting(false)
    }
  }, [formData, hasInvalidData, hasInvalidRequiredFields, onSave, submitting])

  useEffect(() => {
    if (!noForm) {
      setModalHidden?.()
      return
    }
    if (corporationLoading || !noFormReady || autoSaveRan.current) return
    autoSaveRan.current = true
    void handleSave()
    onCancel?.()
  }, [corporationLoading, handleSave, noForm, noFormReady, onCancel, setModalHidden])

  function handleCancel() {
    if (submitting || !onCancel) return
    setSubmitting(true)
    try {
      onCancel()
    } finally {
      setSubmitting(false)
    }
  }

  const normalInputs: React.ReactNode[] = []
  const textareaInputs: React.ReactNode[] = []

  visibleFields.forEach((field) => {
    const typedField = field as ResolvedDataField<T>
    const value = formData[field.name as keyof T]
    const isDisabled = field.disabled || (action === 'edit' && field.update === false)
    const key = String(field.name)
    const fieldError = errorFields.find((err) => err.key === key)
    const showError = hasTriedSubmit && (Boolean(fieldError) || !validatedRequiredField(typedField, value))
    const errorMessage = fieldError?.errorMessage ?? requiredLabel
    const controlId = `${formId}-${key}`
    const errorId = `${controlId}-error`
    const descriptionId = `${controlId}-description`
    const describedBy =
      [showError ? errorId : null, field.description ? descriptionId : null].filter(Boolean).join(' ') || undefined
    const controlProps = {
      id: controlId,
      disabled: isDisabled,
      'aria-invalid': showError || undefined,
      'aria-describedby': describedBy,
      'aria-required': field.required || undefined,
    }

    let inputEl: React.ReactNode

    if (field.inputType === 'textarea') {
      const jsonValue = isJson(value)
      inputEl =
        action === 'edit' && jsonValue ? (
          <div className="h-64 overflow-y-auto rounded-lg border border-border bg-muted/50">
            <JsonCodeBlock value={jsonValue} />
          </div>
        ) : (
          <Textarea
            {...controlProps}
            className="field-sizing-fixed font-mono text-sm md:text-sm"
            value={String(value ?? '')}
            onChange={(e) => handleChange(field.name as keyof T, e.target.value, field)}
            rows={8}
          />
        )
    } else if (field.inputType === 'select') {
      inputEl = (
        <select
          {...controlProps}
          className="select"
          value={String(value ?? '')}
          onChange={(e) => handleChange(field.name as keyof T, e.target.value, field)}
        >
          <option value="" disabled>
            {selectPlaceholder}
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    } else if (field.inputType === 'languageSelector') {
      inputEl = (
        <LanguageCombobox
          value={String(value ?? '')}
          onChange={(val) => handleChange(field.name as keyof T, canonicalizeLanguageTag(val), field)}
          disabled={isDisabled}
          className={showError ? 'border-destructive' : ''}
        />
      )
    } else if (field.inputType === 'number') {
      inputEl = (
        <Input
          {...controlProps}
          type="number"
          className="h-9 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={String(value ?? '')}
          onChange={(e) => {
            const raw = e.target.value
            const parsed = raw === '' ? '' : Number(raw)
            handleChange(field.name as keyof T, parsed, field)
          }}
        />
      )
    } else if (field.inputType === 'date') {
      inputEl = (
        <Input
          {...controlProps}
          type="datetime-local"
          className="h-9"
          value={String(value ?? '')}
          onChange={(e) => handleChange(field.name as keyof T, e.target.value, field)}
        />
      )
    } else {
      inputEl = (
        <Input
          {...controlProps}
          type="text"
          className="h-9"
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => handleChange(field.name as keyof T, e.target.value, field)}
        />
      )
    }

    const fieldBlock = (
      <Field key={key} data-invalid={showError || undefined} data-disabled={isDisabled || undefined}>
        <Label htmlFor={controlId} className="data-edit-label block">
          {field.label}
          {field.required && (
            <span className="data-edit-required" aria-hidden="true">
              *
            </span>
          )}
        </Label>
        {inputEl}
        {showError && (
          <FieldError id={errorId} className="data-edit-error">
            {errorMessage}
          </FieldError>
        )}
        {field.description && (
          <FieldDescription id={descriptionId} className="data-edit-input-description">
            {field.description}
          </FieldDescription>
        )}
      </Field>
    )

    if (field.inputType === 'textarea') {
      textareaInputs.push(fieldBlock)
    } else {
      normalInputs.push(fieldBlock)
    }
  })

  return (
    <div
      className={clsx(
        'flex flex-col gap-5 text-card-foreground',
        !withinView && !isModal && 'rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-6'
      )}
    >
      {(basicSection?.name || basicSection?.nameCreate) && action === 'create' && (
        <h2 className="data-edit-section-title">{basicSection?.nameCreate ?? basicSection?.name}</h2>
      )}
      {!noForm && normalInputs.length > 0 && (
        <div
          className={
            (action === 'create' && basicSection?.classFormCreate !== undefined
              ? basicSection.classFormCreate
              : basicSection?.classFormEdit) ?? 'flex flex-col gap-5'
          }
        >
          {normalInputs}
        </div>
      )}

      {textareaInputs.length > 0 && <div className="flex flex-col gap-5">{textareaInputs}</div>}

      {children}

      {transactionCost && (
        <div className={clsx(NOTICE_CLASS, 'border-info/30 bg-info/10 dark:border-info/40 *:[svg]:text-info')}>
          <InfoIcon aria-hidden="true" />
          <AlertDescription className="data-edit-form-description text-foreground">
            {getCostMessage(uiMsgType.cost, formatVNAFromUVNA(transactionCost))}
          </AlertDescription>
        </div>
      )}

      {uiMsgType.warning && (
        <div
          className={clsx(
            NOTICE_CLASS,
            'border-destructive/30 bg-destructive/10 dark:border-destructive/40 *:[svg]:text-destructive'
          )}
        >
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle className="text-destructive">
            {resolveTranslatable({ key: 'messages.warning' }, translate)}
          </AlertTitle>
          <AlertDescription className="text-foreground">{uiMsgType.warning}</AlertDescription>
        </div>
      )}

      <div className="actions-center pt-1">
        {onCancel && (
          <button
            type="button"
            className={clsx('btn-action-cancel', isModal ? 'flex-1' : '')}
            onClick={handleCancel}
            disabled={submitting || corporationLoading}
          >
            {resolveTranslatable({ key: 'messages.cancel' }, translate)}
          </button>
        )}
        <button
          type="button"
          className={clsx('btn-action-confirm', isModal ? 'flex-1' : '', msgTypeStyle[messageType].button)}
          onClick={handleSave}
          disabled={submitting || corporationLoading || !noFormReady || saveDisabled}
          aria-busy={submitting || undefined}
        >
          {submitting ? <Spinner aria-hidden="true" /> : null}
          {uiMsgType.label}
        </button>
      </div>
    </div>
  )
}
