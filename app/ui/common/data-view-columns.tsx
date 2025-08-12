'use client';

import React, { useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { DataViewProps } from '@/app/types/dataViewTypes';
import ActionDID from '@/app/msg/did-directory/actionDID';
import { MsgTypeDID, MsgTypeTD } from '@/app/constants/notificationMsgForMsgType';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import useIsSmallScreen from '@/app/util/small-screen';
import ActionTD from '@/app/msg/trust-deposit/actionTD';

// Define the valid actions for DID
const validDIDAction = (action: string): action is MsgTypeDID => 
  action === 'MsgAddDID' || action === 'MsgRenewDID' || action === 'MsgTouchDID' || action === 'MsgRemoveDID';

// Define the valid actions for TD
const validTDAction = (action: string): action is MsgTypeTD => 
  action === 'MsgReclaimTrustDeposit' || action === 'MsgReclaimTrustDepositYield';

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
  columnsCountMd = 1
}: DataViewProps<T>) {
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const isSmallScreen = useIsSmallScreen(); // default: 640px

  return (
    <div className="data-edit-container">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="data-edit-section">
          {/* Header is always the same for any section type */}
          <h2 className="data-edit-section-title">
            {section.icon && (
            <span className={
              "data-view-section-icon-bg" +
              (section.type === "help"
                ? " data-view-section-icon-info"
                : " data-view-section-icon-default")
            }>
              <section.icon className={
                "data-view-section-icon" + " text-" +
                (section.type === "help" ? "blue" : "pink") + "-500"
              } />
            </span>
            )}
            {section.name}
          </h2>

          {/* Help Section (if present) */}
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

          {/* Data Section */}
          {(!section.type || section.type === "data") && section.fields && section.fields.length > 0 && (
            <div className="data-edit-scroll">
              <table className="data-edit-table">
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
                    isSmallScreen ? columnsCountMd : columnsCount // Each row will have up to 3 columns
                  ).map((group, groupIdx) => (
                    <tr key={`data-row-${groupIdx}`}>
                      {group.map(({ field, value }, idx) => (
                        <td key={idx} className="data-view-field-cell">
                          <div className="data-view-field">
                            <span className="data-edit-label">
                              {String(value)}
                            </span>
                            <span className="data-view-label">
                              {field.label}
                            </span>
                          </div>
                        </td>
                      ))}
                      {/* Fill empty columns if less than 3 in this row */}
                      {Array.from({ length: 3 - group.length }).map((_, i) => (
                        <td key={`empty-${i}`} />
                      ))}
                    </tr>
                  ))}
                  {/* Render action fields as a full-width row */}
                  {section.fields.map((field, fieldIndex) => {
                    const value = data[field.name];
                    if (field.type !== 'action' || value == null) return null;

                    const rowId = `${sectionIndex}-${fieldIndex}`;
                    const isActive = activeActionId === rowId;

                    return (
                      <tr key={rowId}>
                        <td colSpan={3} className="py-1">
                          <button
                            onClick={() => setActiveActionId(isActive ? null : rowId)}
                            className="btn-link"
                          >
                            {isActive ? (
                              <ChevronUpIcon aria-hidden="true" className="data-view-section-icon" />
                            ) : (
                              <ChevronDownIcon aria-hidden="true" className="data-view-section-icon" />
                            )}
                            <span>{field.label}</span>
                          </button>
                          {isActive && (
                            <div className="mt-4">
                              {renderActionComponent(String(value), id ?? '', setActiveActionId, data)}
                            </div>
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
    </div>
  );
}
