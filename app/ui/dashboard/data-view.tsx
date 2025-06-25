import React from 'react'
import { DataViewProps } from '@/app/types/DataViewTypes'

export default function DataView<T extends object>({ title, sections, data }: DataViewProps<T>) {
  return (
    <div className="max-w-xl p-8 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      {sections.map((section, i) => (
        section.fields.length > 0 && (
          <div key={i}>
            <h2 className="text-xl font-semibold mt-4 mb-2">{section.name}</h2>
            {section.fields.map((field, j) => {
              const value = data[field.name]
              return value != null ? (
                <p key={j}>
                  <span className="font-medium">{field.label}:</span> {String(value)}
                </p>
              ) : null
            })}
          </div>
        )
      ))}
    </div>
  )
}

