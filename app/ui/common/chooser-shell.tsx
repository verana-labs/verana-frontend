'use client'

import type { ReactNode } from 'react'

export function ChooserShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
        {children}
      </div>
    </div>
  )
}
