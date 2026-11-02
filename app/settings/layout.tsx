import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getDictionary } from '@/i18n/dataview'

const dict = getDictionary()

export const metadata: Metadata = {
  title: dict['meta.settings.title'] ?? 'Settings',
  description:
    dict['meta.settings.description'] ?? 'Choose your language and theme, and review the connected Verana network.',
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children
}
