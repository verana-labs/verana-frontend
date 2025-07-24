import React, { useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { DataViewProps } from '@/app/types/dataViewTypes';
import ActionDID from '@/app/msg/did-diretory/actionDID';
import ActionTrustDeposit from '@/app/msg/trust-deposit/actionTrustDeposit';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import useIsSmallScreen from '@/app/util/small-screen';

// Helper to render the correct action component
function renderActionComponent(
  action: string,
  id: string,
  setActiveActionId: Dispatch<SetStateAction<string | null>>
): ReactNode {
  if (action.endsWith("DID")) {
    return <ActionDID action={action} id={id} />;
  }
  if (action.endsWith("TrustDeposit")) {
    return <ActionTrustDeposit action={action} setActiveActionId={setActiveActionId} />;
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
    <div className="min-w-full">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-2 p-4 rounded-2xl bg-light-bg dark:bg-dark-bg">
          {/* Header is always the same for any section type */}
          <h2 className="text-lg font-medium mb-2 flex items-center gap-2">
            {section.icon && (
            <span className={
              "w-6 h-6 rounded-full flex justify-center items-center bg-gradient-to-b " +
              (section.type === "help"
                ? "from-blue-100 to-blue-200"
                : "from-pink-100 to-pink-200")
            }>
              <section.icon className={
                "h-4 w-4 flex-shrink-0 " +
                (section.type === "help" ? "text-blue-500" : "text-pink-500")
              } />
            </span>
            )}
            {section.name}
          </h2>

          {/* Help Section (if present) */}
          {section.type === "help" && Array.isArray(section.help) && (
            <ul className="list-disc pl-6 ">
              {section.help.map((h, idx) => (
                <li
                  key={idx}
                  className="text-sm font-normal leading-normal mb-2"
                >
                  {h}
                </li>
              ))}
            </ul>
          )}

          {/* Data Section */}
          {(!section.type || section.type === "data") && section.fields && section.fields.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <tbody>
                  {/* Group data fields into rows of 3 columns */}
                  {chunk(
                    section.fields
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
                        <td key={idx} className="align-top py-4 min-w-[180px]">
                          <div className="flex flex-col items-start">
                            <span className="text-base font-semibold leading-none mb-1 break-all">
                              {String(value)}
                            </span>
                            <span className="text-sm font-normal leading-none">
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
                            className="flex items-center space-x-1 bg-[#F1F5FC] text-[#1A5ED5] dark:bg-blue-700/20 dark:text-blue-300 rounded-md px-2 py-1"
                          >
                            {isActive ? (
                              <ChevronUpIcon aria-hidden="true" className="w-4 h-4" />
                            ) : (
                              <ChevronDownIcon aria-hidden="true" className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium leading-none">{field.label}</span>
                          </button>
                          {isActive && (
                            <div className="mt-4">
                              {renderActionComponent(String(value), id, setActiveActionId)}
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
