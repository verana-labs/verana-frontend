'use client';

import React, { useState, ReactNode } from 'react';
import { DataViewProps, isResolvedActionField, isResolvedDataField, ResolvedActionField, visibleFieldsForMode } from '@/ui/dataview/types';
import { isJson } from '@/util/util';
import JsonCodeBlock from '@/ui/common/json-code-block';
import { translateSections } from '@/ui/dataview/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faEdit, faSitemap } from '@fortawesome/free-solid-svg-icons';
import clsx from "clsx"
import IconLabelButton from './icon-label-button';
import { renderActionComponent } from './data-view-typed';
import CardView from './card-view';

export default function DataView<T extends object>({
  sectionsI18n,
  data,
  onEdit,
  onRefresh,
  onBack,
  // showSectionTitle,
  otherButton
}: DataViewProps<T>) {

  const sections = translateSections(sectionsI18n);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  let jsonField: { label: string; value: unknown } | null = null;

  // Helper to render the type action field
  function renderActionField(
    rowId: string,
    isActive: boolean,
    field: ResolvedActionField<T>,
    value: string,
    data: object,
    // id?: string,
  ): ReactNode {
    return (
      <div key={rowId} className={clsx("bg-white dark:bg-surface rounded-xl border", field.isWarning? "border-red-200 dark:border-red-700" : "border-neutral-20 dark:border-neutral-70")}> 
        <button
          onClick={() => setActiveActionId(isActive ? null : rowId)}
          className={clsx("w-full px-6 py-4 text-left flex items-center justify-between transition-colors", field.isWarning? "hover:bg-red-50 dark:hover:bg-red-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/50")}
        >
          <div className="flex items-center">
            { field.icon && (
            <div className= {clsx("w-10 h-10 rounded-lg flex items-center justify-center mr-3", field.iconClass)}>
              <FontAwesomeIcon icon={field.icon} className={field.iconColorClass ?? field.iconClass ?? ""}/>
            </div>
            )}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{field.label}</h4>
              <p className="text-sm text-neutral-70 dark:text-neutral-70">{field.description}</p>
            </div>
          </div>
          <FontAwesomeIcon icon={isActive ? faChevronUp: faChevronDown}/>
        </button>
        {isActive && (
        <div className="px-6 pb-6">
          {renderActionComponent(String(value), () => setActiveActionId(null), data, onRefresh?? undefined, onBack?? undefined )}
        </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => (
        // <div key={sectionIndex} className="data-view-section">
        <div key={sectionIndex}>
          {/* Help Section */}
          {section.type === "help" && Array.isArray(section.help) && (
            <ul className="data-view-list-help">
              {section.help.map((h, idx) => (
                <li
                  key={idx}
                  className="form-copy"
                >
                  {h}
                </li>
              ))}
            </ul>
          )}

          {/* Basic Section */}
          {(!section.type || section.type === "basic") && section.fields && section.fields.length > 0 && (
            <>
            <div className="mb-8">
              <div className={`${ section.cardView ? "": "bg-white dark:bg-surface bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6"}`}> 
                {/* Header is always the same for any section type */}
                {/* { showSectionTitle && section.name?.trim() && ( */}
                { section.name?.trim() && (
                <div className="flex items-center justify-between mb-6">
                    <h3 className="data-view-section-title text-lg">{section.name}</h3>
                    { (onEdit || otherButton) && (
                    <div className="actions-right gap-3">
                      {otherButton ? otherButton : null}
                      { onEdit && (
                      <IconLabelButton
                        icon={faEdit}
                        label={"Edit"}
                        onClick={() => onEdit?.()}
                        className="btn-link px-3 py-1.5"
                      />
                      )}
                    </div>
                    )}
                </div>
                )}
                <div className={section.classForm ?? "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                  { visibleFieldsForMode(section.fields, 'view')
                    .map((field, fieldIndex) => ({
                      field,
                      value: data[field.name],
                      fieldIndex,
                    }))
                    .filter(f => isResolvedDataField(f.field) && f.value != null)
                    .map(({ field, value, fieldIndex }) => {
                      const jsonValue = isJson(value); // helper: returns object if valid JSON, otherwise null
                      if (jsonValue){
                        jsonField = { label: field.label, value: jsonValue };
                        return null;
                      }
                      if (section.cardView && isResolvedDataField(field)){
                        return (
                          <CardView key={section.name.concat(String(field.name))} field={field} data={data} largeTexts={section.largeTexts} />
                        );
                      }
                      return (
                        <div key={`${sectionIndex}-${fieldIndex}`}>
                          <label className="data-view-label">{field.label}</label>
                          {
                            isResolvedDataField(field) && field.isHtml ?
                            (<p className={field.classField?? "data-view-value"} dangerouslySetInnerHTML={{ __html: field.format? String(field.format(value)) : String(value)}}/>) :
                            (<p className="data-view-value">{String(value)}</p>)
                          }
                        </div>
                      );
                      }
                    )
                  }
                </div>
                {/* Extra row: full width JSON pretty-printed */}
                {jsonField && (
                  <div className='py-4'>
                    {/* span across both columns */}
                    <label className="data-view-label">{jsonField.label}</label>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 h-64 overflow-y-auto border border-neutral-20 dark:border-neutral-70">
                    <JsonCodeBlock value={jsonField.value} className="data-view-label" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            </>
          )}

          {/* Actions Section */}
          {section.type === "actions" && section.fields && section.fields.length > 0 && (
            <div className="space-y-4">
              {section.name?.trim() && (<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{section.name}</h2>) }
              {/* Render action fields as a full-width */}
              {visibleFieldsForMode(section.fields, 'view')
              .map((field, fieldIndex) => {
                const value = data[field.name];
                if (!isResolvedActionField(field) || value == undefined ) return null;
                const rowId = `${sectionIndex}-${fieldIndex}`;
                const isActive = activeActionId === rowId;
                return renderActionField(rowId, isActive, field, String(value), data);// id);
              })}
            </div>
          )}

        </div>
      ))}
    </div>
  );

}
