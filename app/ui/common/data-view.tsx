import React, { useState, ReactNode, Dispatch, SetStateAction } from 'react'
import { DataViewProps } from '@/app/types/DataViewTypes'
import ActionDID from '@/app/msg/diddiretory/ActionDID'
import ActionTrustDeposit from '@/app/msg/trustdeposit/ActionTrustDeposit'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

function renderActionComponent(action: string, id: string, setActiveActionId: Dispatch<SetStateAction<string | null>>): ReactNode {
  if ( action.endsWith("DID"))
    return <ActionDID action={action} id={id} />
  if ( action.endsWith("TrustDeposit"))
    return <ActionTrustDeposit action={action} setActiveActionId={setActiveActionId} />
  return null;
}

export default function DataView<T extends object>({ title, sections, data, id }: DataViewProps<T>) {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  return (
    <>
    {title && (<h1 className="text-title-light-color dark:text-title-dark-color text-xl font-medium mb-6">{title} {id ? id : ''}</h1>)}
    <div className="min-w-full p-8 rounded-2xl shadow-lg bg-light-bg dark:bg-dark-bg">
      {sections.map((section, sectionIndex) => (
        section.fields.length > 0 && (
          <div key={sectionIndex} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">{section.name}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {section.fields.map((field, fieldIndex) => {
                    const value = data[field.name]
                    if (value == null) return null

                    const rowId = `${sectionIndex}-${fieldIndex}`
                    const isActive = activeActionId === rowId

                    if (field.type === 'data') {
                      return (
                        <tr key={rowId} className='px-6 py-3 text-justify text-base font-medium'>
                          <th className="font-medium text-gray-700 dark:text-gray-200">
                            {field.label}
                          </th>
                          <td className="text-gray-900 dark:text-gray-100">
                            {String(value)}
                          </td>
                        </tr>
                      )
                    }

                    if (field.type === 'action') {
                      return (
                        <tr key={rowId}>
                          <td colSpan={2} className="px-6 py-3">
                            <button
                              onClick={() => setActiveActionId(isActive ? null : rowId)}
                              className="flex items-center text-blue-500 hover:underline space-x-1"
                            >
                              {isActive?  (
                                <ChevronUpIcon aria-hidden="true" className="size-6" />
                              ) : (
                                <ChevronDownIcon aria-hidden="true" className="size-6" />
                              )}
                              <span>{field.label}</span>
                            </button>
                            {isActive && (
                              <div className="mt-4">
                                {renderActionComponent(String(value), id, setActiveActionId)}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    }

                    return null
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ))}
    </div>
    </>
  )
}
