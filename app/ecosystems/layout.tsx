import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getDictionary } from '@/i18n/dataview'

const dict = getDictionary()

export const metadata: Metadata = {
  title: dict['meta.ecosystem.list.title'] ?? 'Ecosystems',
  description:
    dict['meta.ecosystem.list.description'] ??
    'Explore Verana ecosystems, governance documents, and credential schema catalogs.',
}

export default function EcosystemLayout({ children }: { children: ReactNode }) {
  return children
}
