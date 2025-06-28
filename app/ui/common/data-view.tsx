import React, { useState, ReactNode } from 'react'
import { DataViewProps } from '@/app/types/DataViewTypes'
import ActionDID from '@/app/msg/diddiretory/ActionDID'
import ActionTrustRegistry from '@/app/msg/trustregistry/ActionTrustRegistry'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

function renderActionComponent(action: string, did: string): ReactNode {
  if ( action.endsWith("DID"))
    return <ActionDID action={action} didUpdate={did} />
  if ( action.endsWith("TrustRegistry"))
    return <ActionTrustRegistry action={action} didUpdate={undefined} />
  return null;
}

export default function DataView<T extends object>({ title, sections, data, id }: DataViewProps<T>) {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  return (
    <div className="min-w-full  p-8 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6">{title} {id ? id : ''}</h1>
      {sections.map((section, sectionIndex) => (
        section.fields.length > 0 && (
          <div key={sectionIndex} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{section.name}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  {section.fields.map((field, fieldIndex) => {
                    const value = data[field.name]
                    if (value == null) return null

                    const rowId = `${sectionIndex}-${fieldIndex}`
                    const isActive = activeActionId === rowId

                    if (field.type === 'data') {
                      return (
                        <tr key={rowId}>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                            {field.label}
                          </th>
                          <td className="px-6 py-3 text-left text-sm text-gray-900">
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
                                {renderActionComponent(String(value), id)}
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
  )
}
