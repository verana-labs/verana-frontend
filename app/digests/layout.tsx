import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Digest Registry',
  description: 'Look up and store V4 Verana digest entries.',
}

export default function DigestsLayout({ children }: { children: ReactNode }) {
  return children
}
