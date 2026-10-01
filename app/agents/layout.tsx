import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getDictionary } from '@/i18n/dataview'

const dict = getDictionary()

export const metadata: Metadata = {
  title: dict['meta.agents.title'] ?? 'Agents',
  description:
    dict['meta.agents.description'] ?? 'VS Agents operating Verifiable Services on behalf of your corporation.',
}

export default function AgentsLayout({ children }: { children: ReactNode }) {
  return children
}
