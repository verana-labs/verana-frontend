'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ChevronDownIcon, PencilIcon } from 'lucide-react'
import React, { useId, useState } from 'react'
import { useActionSigning } from '@/hooks/useSigningMode'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import ActionFieldButton, { ActionLabel } from '@/ui/common/action-field-button'
import ActionFieldButtonModal from '@/ui/common/action-field-button-modal'
import CardView from '@/ui/common/card-view'
import { ActionFieldProps, renderActionComponent } from '@/ui/common/data-view-typed'
import JsonCodeBlock from '@/ui/common/json-code-block'
import TitleAndButton from '@/ui/common/title-and-button'
import {
  DataViewProps,
  isResolvedActionField,
  isResolvedDataField,
  ResolvedActionField,
  ResolvedField,
  resolveTranslatable,
  translateSections,
  visibleFieldsForMode,
} from '@/ui/dataview/types'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { isJson } from '@/util/util'
import DataViewSkeleton from './data-view-skeleton'

function InlineActionField<T extends object>({
  field,
  value,
  data,
  isActive,
  onToggle,
  onClose,
  onRefresh,
  onBack,
}: {
  field: ResolvedActionField<T>
  value: string
  data: object
  isActive: boolean
  onToggle: () => void
  onClose: () => void
  onRefresh?: (id?: string, txHeight?: number) => void
  onBack?: () => void
}) {
  const { mode, disabled, reason } = useActionSigning(value)
  const panelId = useId()
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-card text-card-foreground ring-1',
        field.isWarning ? 'ring-destructive/30 dark:ring-destructive/40' : 'ring-foreground/10'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        title={reason}
        aria-expanded={isActive}
        aria-controls={isActive ? panelId : undefined}
        className={cn(
          'flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors outline-none sm:px-6',
          'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50',
          field.isWarning ? 'not-disabled:hover:bg-destructive/5' : 'not-disabled:hover:bg-muted/50'
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {field.icon && (
            <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', field.iconClass)}>
              <FontAwesomeIcon icon={field.icon} className={field.iconColorClass ?? field.iconClass ?? ''} />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-base leading-snug font-medium text-foreground">
              <ActionLabel label={field.label} mode={mode} />
            </h4>
            <p className="text-sm text-muted-foreground">{reason ?? field.description}</p>
          </div>
        </div>
        <ChevronDownIcon
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) ease-standard',
            isActive && 'rotate-180'
          )}
        />
      </button>
      {isActive && (
        <div id={panelId} className="border-t border-border px-4 pb-6 sm:px-6">
          {renderActionComponent(value, onClose, data, onRefresh, onBack)}
        </div>
      )}
    </div>
  )
}

export default function ColumnsDataView<T extends object>({
  sectionsI18n,
  data,
  viewEditButton = true,
  onEdit,
  onRefresh,
  onBack,
  showViewTitle,
  viewTitleButton,
  generalBorder,
  activeActionField,
  loading,
}: DataViewProps<T>) {
  const archived = 'archived' in data && Boolean(data.archived)
  const sections = translateSections(sectionsI18n)
  let jsonField: { label: string; value: unknown } | null = null
  type ViewTitle = { title?: string; description?: string }
  const viewTitle = data as ViewTitle
  const [showView, setShowView] = useState<boolean>(true)

  const [activeActionId, setActiveActionId] = useState<string | null>(() => {
    if (!activeActionField) return null
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex]
      if (!section.fields?.length) continue
      const fields = visibleFieldsForMode(section.fields, 'view')
      const fieldIndex = fields.findIndex((f) => isResolvedActionField(f) && (f.name as string) === activeActionField)
      if (fieldIndex >= 0) return `${sectionIndex}-${fieldIndex}`
    }
    return null
  })
  if (loading) return <DataViewSkeleton sections={sections} />

  const hasAvailableAction = (fields?: ResolvedField<T>[]) =>
    visibleFieldsForMode(fields, 'view').some((field) => isResolvedActionField(field) && data[field.name] != null)

  const editLabel = resolveTranslatable({ key: 'messages.edit' }, translate) ?? 'Edit'
  const archivedLabel = resolveTranslatable({ key: 'dataview.archived.label' }, translate)

  return (
    <div
      className={cn(
        'mb-6',
        generalBorder && 'rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 sm:p-6'
      )}
    >
      {showViewTitle && viewTitle.title ? (
        <div className="mb-6 border-b border-border">
          <TitleAndButton
            title={viewTitle.title}
            description={[`${viewTitle.description}`]}
            type="view"
            buttonLabel={viewTitleButton?.buttonLabel}
            icon={viewTitleButton?.icon}
            onClick={viewTitleButton?.onClick}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.type === 'help' && Array.isArray(section.help) ? (
              <ul className="data-view-list-help">
                {section.help.map((h, idx) => (
                  <li key={idx} className="form-copy">
                    {h}
                  </li>
                ))}
              </ul>
            ) : null}

            {(!section.type || section.type === 'basic') && section.fields && section.fields.length > 0
              ? (() => {
                  const actionRenders: React.ReactNode[] = []
                  const FieldList = section.cardView ? 'div' : 'dl'
                  return (
                    <section
                      className={cn(
                        section.sectionBorder
                          ? 'rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 sm:p-6'
                          : !section.cardView && sectionIndex !== 0
                            ? 'border-t border-border pt-6'
                            : 'pt-6'
                      )}
                    >
                      {section.name?.trim() && (
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                          <h3 className="data-view-section-title">{section.name}</h3>
                          <div className="flex items-center gap-2">
                            {section.noEdit && archived ? <Badge variant="secondary">{archivedLabel}</Badge> : null}
                            {viewEditButton && onEdit && (
                              <Button variant="outline" size="sm" onClick={() => onEdit?.()}>
                                <PencilIcon aria-hidden="true" />
                                {editLabel}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      <FieldList
                        className={cn(
                          section.classFormEdit ?? 'grid grid-cols-1 gap-4 md:grid-cols-2',
                          !(showView || section.noEdit) && 'hidden'
                        )}
                      >
                        {visibleFieldsForMode(section.fields, 'view').map((field, fieldIndex) => {
                          const value = data[field.name]
                          if (isResolvedDataField(field) && value != null) {
                            const jsonValue = isJson(value)
                            if (jsonValue) {
                              jsonField = { label: field.label, value: jsonValue }
                              return null
                            }
                            if (section.cardView && isResolvedDataField(field)) {
                              return (
                                <CardView
                                  key={section.name.concat(String(field.name))}
                                  field={field}
                                  data={data}
                                  largeTexts={section.largeTexts}
                                />
                              )
                            }
                            return (
                              <div key={`${sectionIndex}-${fieldIndex}`} className="min-w-0">
                                <dt className="data-view-label">{field.label}</dt>
                                <dd className={field.classField ?? 'data-view-value'}>
                                  {field.format ? field.format(value) : String(value)}
                                </dd>
                              </div>
                            )
                          }

                          if (isResolvedActionField(field) && value != null) {
                            const rowId = `${sectionIndex}-${fieldIndex}`
                            const isActive = activeActionId === rowId
                            const obj = { ...field, value: String(value) }
                            actionRenders.push(
                              field.isEditButton ? (
                                <ActionFieldButton
                                  type="button"
                                  data={data}
                                  field={obj as ActionFieldProps}
                                  key={rowId}
                                  onRefresh={onRefresh}
                                  onClickButton={() => setShowView(false)}
                                  onClose={() => setShowView(true)}
                                />
                              ) : (
                                <ActionFieldButtonModal
                                  isActive={isActive}
                                  data={data}
                                  field={obj as ActionFieldProps}
                                  key={rowId}
                                  onRefresh={onRefresh}
                                  onClickButton={() => setActiveActionId(rowId)}
                                  onClose={() => setActiveActionId(null)}
                                />
                              )
                            )
                          }

                          return null
                        })}
                      </FieldList>
                      {jsonField && (
                        <div className="mt-6">
                          <p className="data-view-label">{jsonField.label}</p>
                          <div className="rounded-lg border border-border bg-muted/50">
                            <JsonCodeBlock value={jsonField.value} />
                          </div>
                        </div>
                      )}

                      {actionRenders.length ? <div className="mt-6 flex flex-col gap-4">{actionRenders}</div> : null}
                    </section>
                  )
                })()
              : null}

            {section.type === 'actions' && hasAvailableAction(section.fields) && (
              <div className="flex flex-col gap-4">
                {section.name?.trim() && (
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">{section.name}</h2>
                )}
                {visibleFieldsForMode(section.fields, 'view').map((field, fieldIndex) => {
                  const value = data[field.name]
                  if (!isResolvedActionField(field) || value == null) return null
                  const rowId = `${sectionIndex}-${fieldIndex}`
                  const isActive = activeActionId === rowId
                  return (
                    <InlineActionField
                      key={rowId}
                      field={field}
                      value={String(value)}
                      data={data}
                      isActive={isActive}
                      onToggle={() => setActiveActionId(isActive ? null : rowId)}
                      onClose={() => setActiveActionId(null)}
                      onRefresh={onRefresh ?? undefined}
                      onBack={onBack ?? undefined}
                    />
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
