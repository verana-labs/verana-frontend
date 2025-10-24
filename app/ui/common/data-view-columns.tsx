'use client';

import React, { useState, ReactNode, Dispatch, SetStateAction, useId } from 'react';
import { DataViewProps, isResolvedActionField, isResolvedDataField, isResolvedListField, isResolvedObjectListField, isResolvedStringListField, ResolvedField, Section, TypeToken, visibleFieldsForMode } from '@/ui/dataview/types';
import { MsgTypeDID, MsgTypeTD, MsgTypeTR } from '@/msg/constants/notificationMsgForMsgType';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import useIsSmallScreen from '@/util/small-screen';
import { isJson } from '@/util/util';
import EditableDataView from '@/ui/common/data-edit';
import { DataType, getMsgTypeFor } from '@/msg/constants/msgTypeForDataType';
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject';
import JsonCodeBlock from '@/ui/common/json-code-block';
import GfdPage from '@/tr/[id]/gfd';
import DidActionPage from '@/did/[id]/action';
import TdActionPage from '@/account/action';
import { translateSections } from '@/ui/dataview/types';

// Wrapper for DataView that lets you pass the generic parameter explicitly
function DataViewTyped<I extends object>(props: {
  objectData: TypeToken<I>;
  sections: Section<I> | ReadonlyArray<Section<I>>;
  data: I;
  id?: string;
  columnsCount?: number;
  columnsCountMd?: number;
  edit?: boolean;
  oneColumn?: boolean;
  getTitle?: (item: I) => React.ReactNode;
  setActiveActionId?: React.Dispatch<React.SetStateAction<string | null>>;
  setRefresh?: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const { objectData, sections, data, id, columnsCount, columnsCountMd, edit, oneColumn, getTitle, setRefresh } = props;
  const normalized = Array.isArray(sections) ? sections : [sections];
  const title = getTitle?.(data);
  // Local expand/collapse state per instance (default: collapsed)
  const [expanded, setExpanded] = useState(() => {
    const idUpdated = sessionStorage.getItem('id_updated');
    if (id && idUpdated === id ){
      // Remove id_updated from session
      if (idUpdated) sessionStorage.removeItem('id_updated');
      return true;
    }
    return false;
  });
  // Build a stable content id for aria-controls
  const reactId = useId();
  const contentId = id ? `${id}-dv-content` : `dv-content-${reactId}`;
  const [editing, setEditing] = useState(id? false: true);
  const msgType = getMsgTypeFor(objectData.typeName as DataType, id? "update" : "create");
  const { submitTx } = useSubmitTxMsgTypeFromObject( id ? () => setEditing(false) : () => setExpanded(false), setRefresh );

  /**
   * Generic save handler:
   * - Receives msgType and a generic data object
   * - Directly forwards both to submitTx
   */
  async function onSave(data: object) {
    await submitTx(msgType, data);
  }

  return (
    <div>
      {title ? (
        // Title rendered as a link-like button that toggles the content
      <button
        onClick={() => setExpanded((v) => !v)}
        className="btn-link mb-2 gap-2"
      >
        {expanded ? (
          <ChevronUpIcon aria-hidden="true" className="data-view-section-icon" />
        ) : (
          <ChevronDownIcon aria-hidden="true" className="data-view-section-icon" />
        )}
        <span >{title}</span>
      </button>
      ) : null}

      {/* Only render DataView when expanded; if you prefer to keep it mounted, wrap in a div and use hidden={!expanded} */}
      {expanded && (
      <div id={contentId}>
      {editing ? (
        <EditableDataView<I>
          sectionsI18n={normalized}
          data={data}
          messageType={msgType}
          id={id? id : undefined}
          onSave={ onSave }
          onCancel={id? () => setEditing(false) : () => setExpanded(false)}  />
      ) : (
        <DataView<I>
          sectionsI18n={normalized}
          data={data}
          id={id}
          columnsCount={columnsCount}
          columnsCountMd={columnsCountMd}
          // onEdit={ () => setEditing(true)}
          onEdit={ edit? () => setEditing(true) : undefined }
          oneColumn={oneColumn}
        />
      )}

      </div>
      )}
    </div>
  );
}

// Helper that binds the generic type I from the token
function renderObjectList<I extends object>(args: {
  objectData: TypeToken<I>;
  sections: Section<I> | ReadonlyArray<Section<I>>;
  items: readonly I[];
  columnsCount?: number;
  edit?: boolean;
  getId?: (item: I, idx: number) => string | number | undefined;
  setRefresh?: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const { objectData, sections, items, columnsCount, edit, getId, setRefresh } = args;
  return items.map((item, idx) => (
    <DataViewTyped<I>
      key={(getId?.(item, idx) || idx) as React.Key}
      objectData={objectData}
      sections={sections}
      data={item}
      id={String(getId?.(item, idx) ?? idx)}
      columnsCount={columnsCount ?? 2}
      edit={edit}
      oneColumn={true}
      getTitle={(d) => (d as any).title ?? ""}  // eslint-disable-line @typescript-eslint/no-explicit-any
      setRefresh={setRefresh}
    />
  ));
}

// Define the valid actions for DID
const validDIDAction = (action: string): action is MsgTypeDID => 
  action === 'MsgAddDID' || action === 'MsgRenewDID' || action === 'MsgTouchDID' || action === 'MsgRemoveDID';

// Define the valid actions for TD
const validTDAction = (action: string): action is MsgTypeTD => 
  action === 'MsgReclaimTrustDeposit' || action === 'MsgReclaimTrustDepositYield';

// Define the valid actions for TR
const validTRAction = (action: string): action is MsgTypeTR => 
  action === 'MsgAddGovernanceFrameworkDocument' || action === 'MsgIncreaseActiveGovernanceFrameworkVersion';

// Helper to render the correct action component
function renderActionComponent(
  action: string,
  id: string,
  setActiveActionId: Dispatch<SetStateAction<string | null>>,
  data: object,
  setRefresh?: Dispatch<SetStateAction<string | null>>
): ReactNode {
  if (validDIDAction(action)) {
    return <DidActionPage action={action} data={data} setActiveActionId={setActiveActionId} setRefresh={setRefresh}/>;
  }
  if (validTDAction(action)) {
    return <TdActionPage action={action} data={data} setActiveActionId={setActiveActionId} setRefresh={setRefresh}/>;
  }
  if (validTRAction(action)) {
    return <GfdPage action={action} data={data} setActiveActionId={setActiveActionId} setRefresh={setRefresh}/>;
  }
  return null;
}

// Chunk array into groups of desired size (for 3-column rows)
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default function DataView<T extends object>({
  sectionsI18n,
  data,
  id,
  columnsCount = 3,
  columnsCountMd = 1,
  onEdit,
  setRefresh,
  oneColumn = false
}: DataViewProps<T>) {

  const sections = translateSections(sectionsI18n);
  const isSmallScreen = useIsSmallScreen(); // default: 640px
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Helper to render the type data field
  function renderDataField(
    groupIdx: number,
    group: { field: ResolvedField<T>;
             value: T[keyof T];
             fieldIndex: number;
            }[],
  ): ReactNode {
    return (
      <tr key={`data-row-${groupIdx}`}>
        {group.map(({ field, value }, idx) => (
          <td key={idx} className="data-view-field-cell">
            <div className="data-view-field">
              <span className="data-view-value">
                {String(value)}
              </span>
              <span className="data-view-label">
                {field.label}
              </span>
            </div>
          </td>
        ))}
        {/* Fill empty columns if less than X in this row */}
        {Array.from({ length: 3 - group.length }).map((_, i) => (
          <td key={`empty-${i}`} />
        ))}
      </tr>
    );
  }

   // Helper to render the type data field
  function renderDataFieldOneColumn(
    groupIdx: number,
    group: { field: ResolvedField<T>;
             value: T[keyof T];
             fieldIndex: number;
            }[],
  ): ReactNode {
    return (
      <>
        {group.map(({ field, value }, idx) => {
          const jsonValue = isJson(value); // helper: returns object if valid JSON, otherwise null

          return (
            <React.Fragment key={`data-row-${groupIdx}-${idx}`}>
              {/* Main row: label + value (or empty cell if JSON will be shown below) */}
              <tr>
                <td className="data-view-label-cell">
                  <span className="data-view-value">{field.label}</span>
                </td>

                {jsonValue ? (
                  // If it's JSON, we leave this cell empty (or you could show a hint like "see below")
                  <td className="data-view-input-cell" />
                ) : (
                  // Otherwise, show the value with line breaks preserved
                  <td className="data-view-input-cell">
                    <span
                      className="data-view-label"
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {String(value ?? "")}
                    </span>
                  </td>
                )}
              </tr>

              {/* Extra row: full width JSON pretty-printed */}
              {jsonValue && (
                <tr>
                  {/* span across both columns */}
                  <td className="data-view-input-cell" colSpan={2}>
                    <JsonCodeBlock value={jsonValue} className="data-view-label" />
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </>
    );
  } 

  // Helper to render the type action field
  function renderActionField(
    rowId: string,
    isActive: boolean,
    label: string,
    value: string,
    data: object,
    id?: string
  ): ReactNode {
    return (
      <tr key={rowId}>
        <td colSpan={isSmallScreen ? columnsCountMd : columnsCount} className="py-1">
          <button
            onClick={() => setActiveActionId(isActive ? null : rowId)}
            className="btn-link"
          >
            {isActive ? (
              <ChevronUpIcon aria-hidden="true" className="data-view-section-icon" />
            ) : (
              <ChevronDownIcon aria-hidden="true" className="data-view-section-icon" />
            )}
            <span>{label}</span>
          </button>
          {isActive && (
            <div className="mt-4">
              {renderActionComponent(String(value), id ?? '', setActiveActionId, data, setRefresh? setRefresh : undefined )}
            </div>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="data-view-container">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="data-view-section">
          {/* Header is always the same for any section type */}
          { section.name?.trim() && (
          <h2 className="data-view-section-title">
            {section.icon && (
            <span className={
              "data-view-section-icon-bg" +
              (section.type === "help"
                ? " data-view-section-icon-info"
                : " data-view-section-icon-default")
            }>
              <section.icon className={ 
                "data-view-section-icon " + 
                (section.type === "help" ? "text-blue-500" : "text-pink-500")
              } />
            </span>
            )}
            {section.name}
          </h2>
          )}
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
          {(!section.type || section.type === "basic" || section.type === "actions") && section.fields && section.fields.length > 0 && (
            <>
            <div className="data-view-scroll">
              <table className="data-view-table">
                <tbody>
                  {/* Group data fields into rows of 3 columns */}
                  {chunk(
                    visibleFieldsForMode(section.fields, 'view')
                      .map((field, fieldIndex) => ({
                        field,
                        value: data[field.name],
                        fieldIndex,
                      }))
                      .filter(f => isResolvedDataField(f.field) && f.value != null),
                    isSmallScreen ? columnsCountMd : columnsCount // Each row will have up to X columns
                  ).map((group, groupIdx) => (
                      (oneColumn) ? renderDataFieldOneColumn(groupIdx, group)
                      : renderDataField(groupIdx, group)
                  ))}
                  {/* Render action fields as a full-width row */}
                  {visibleFieldsForMode(section.fields, 'view')
                  .map((field, fieldIndex) => {
                    const value = data[field.name];
                    if (!isResolvedActionField(field) || value == undefined ) return null;
                    const rowId = `${sectionIndex}-${fieldIndex}`;
                    const isActive = activeActionId === rowId;
                    return renderActionField(rowId, isActive,field.label, String(value), data, id);
                  })}
                </tbody>
              </table>
            </div>
            { onEdit && (
              <div className="actions-right">
                <button
                  className="btn-action theme-surface-content"
                  onClick={() => onEdit?.()}
                >
                  Edit
                </button>
            </div>
            )}
            </>
          )}

          {/* Advanced Section */}
          {(section.type && section.type === "advanced") && section.fields && section.fields.length > 0 && (
            <div className="data-view-scroll">
              <table className="data-view-table">
                <tbody>
                  {/* Group data fields into rows of X columns */}
                  {chunk(
                    visibleFieldsForMode(section.fields, 'view')
                      .map((field, fieldIndex) => ({
                        field,
                        value: data[field.name],
                        fieldIndex,
                      }))
                      .filter(f => isResolvedDataField(f.field) && f.value != null),
                    isSmallScreen ? columnsCountMd : columnsCount // Each row will have up to X columns
                  ).map((group, groupIdx) => (
                    renderDataField(groupIdx, group)
                  ))}
                  {/* Render action fields as a full-width row */}
                  {visibleFieldsForMode(section.fields, 'view')
                  .map((field, fieldIndex) => {
                    const value = data[field.name];
                    if (isResolvedActionField(field) && value !== undefined){
                      return renderActionField(`${sectionIndex}-${fieldIndex}`, (activeActionId === `${sectionIndex}-${fieldIndex}`), field.label, String(value), data, id);
                    }
                    if (isResolvedListField(field) && value !== null && Array.isArray(value)){
                      const rowKey = `${sectionIndex}-${fieldIndex}-list`;
                      return (
                        <tr key={rowKey}>
                          <td colSpan={isSmallScreen ? columnsCountMd : columnsCount} className="py-1">
                            {isResolvedStringListField(field) && (
                              <ul className="data-view-list-help pb-4">
                                {(value as string[]).map((h, idx) => (
                                  <li
                                    key={idx}
                                    className="form-copy"
                                    dangerouslySetInnerHTML={{ __html: h.toString().replace('<strong>', '<strong class="font-semibold">') }}
                                  />
                                ))}
                              </ul>
                            )}
                            {isResolvedObjectListField(field) && (
                              <>
                                {renderObjectList({
                                  objectData: field.objectData, // binds the type I
                                  sections: field.objectSections!, // Section<I> | Section<I>[]
                                  items: value as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
                                  columnsCount: 1,
                                  edit: onEdit? true : false,
                                  getId: (item: any, i) => item?.id ?? i, // eslint-disable-line @typescript-eslint/no-explicit-any
                                  setRefresh
                                })}
                              </>
                            )}                            
                          </td>
                        </tr>
                      )
                    } 
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      ))}
    </div>
  );
}
