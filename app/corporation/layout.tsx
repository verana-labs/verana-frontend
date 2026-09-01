import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getDictionary } from '@/i18n/dataview'

const dict = getDictionary()

export const metadata: Metadata = {
  title: dict['meta.corporation.title'] ?? 'Corporation',
  description: dict['meta.corporation.description'] ?? 'Corporation.',
}

export default function CorporationLayout({ children }: { children: ReactNode }) {
  return children
}
