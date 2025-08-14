'use client';

import React, { useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { DataViewProps, Field } from '@/app/types/dataViewTypes';
import ActionDID from '@/app/msg/did-directory/actionDID';
import { MsgTypeDID, MsgTypeTD, MsgTypeTR } from '@/app/constants/notificationMsgForMsgType';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import useIsSmallScreen from '@/app/util/small-screen';
import ActionTD from '@/app/msg/trust-deposit/actionTD';
import GfdPage from '@/app/tr/[id]/gfd';

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
  data: object
): ReactNode {
  if (validDIDAction(action)) {
    return <ActionDID action={action} id={id} data={data? data : undefined} />;
  }
  if (validTDAction(action)) {
    return <ActionTD action={action} setActiveActionId={setActiveActionId} data={data}/>;
  }
  if (validTRAction(action)) {
    return <GfdPage action={action} setActiveActionId={setActiveActionId} data={data}/>;
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
  sections,
  data,
  id,
  columnsCount = 3,
  columnsCountMd = 1,
  onEdit
}: DataViewProps<T>) {

  const isSmallScreen = useIsSmallScreen(); // default: 640px
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  
  // Helper to render the type data field
  function renderDataField(
    groupIdx: number,
    group: { field: Field<T>;
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
              {renderActionComponent(String(value), id ?? '', setActiveActionId, data)}
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
            <div className="data-view-scroll">
              <table className="data-view-table">
                <tbody>
                  {/* Group data fields into rows of 3 columns */}
                  {chunk(
                    section.fields
                      .filter(
                        field =>
                          (field.show === 'view' || field.show === 'all' || field.show === undefined))
                      .map((field, fieldIndex) => ({
                        field,
                        value: data[field.name],
                        fieldIndex,
                      }))
                      .filter(f => f.field.type === 'data' && f.value != null),
                    isSmallScreen ? columnsCountMd : columnsCount // Each row will have up to X columns
                  ).map((group, groupIdx) => (
                    renderDataField(groupIdx, group)
                  ))}
                  {/* Render action fields as a full-width row */}
                  {section.fields.map((field, fieldIndex) => {
                    const value = data[field.name];
                    if (field.type !== 'action' || value == null) return null;
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
                    section.fields
                      .filter(
                        field =>
                          (field.show === 'view' || field.show === 'all' || field.show === undefined))
                      .map((field, fieldIndex) => ({
                        field,
                        value: data[field.name],
                        fieldIndex,
                      }))
                      .filter(f => f.field.type === 'data' && f.value != null),
                    isSmallScreen ? columnsCountMd : columnsCount // Each row will have up to X columns
                  ).map((group, groupIdx) => (
                    renderDataField(groupIdx, group)
                  ))}
                  {/* Render action fields as a full-width row */}
                  {section.fields.map((field, fieldIndex) => {
                    const value = data[field.name];
                    if (field.type === 'action' && value !== null){
                      return renderActionField(`${sectionIndex}-${fieldIndex}`, (activeActionId === `${sectionIndex}-${fieldIndex}`), field.label, String(value), data, id);
                    }
                    if (field.type === 'list' && value !== null && Array.isArray(value)){
                      const rowKey = `${sectionIndex}-${fieldIndex}-list`;
                      return (
                        <tr key={rowKey}>
                          <td colSpan={isSmallScreen ? columnsCountMd : columnsCount} className="py-1">
                            <ul className="data-view-list-help pb-4">
                              {value.map((h, idx) => (
                                <li
                                  key={idx}
                                  className="form-copy"
                                  dangerouslySetInnerHTML={{ __html: h.replace('<strong>', '<strong class="font-semibold">') }}
                                />
                              ))}
                            </ul>
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
