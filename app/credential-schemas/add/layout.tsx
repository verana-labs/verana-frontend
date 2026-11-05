import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getDictionary } from '@/i18n/dataview'

const dict = getDictionary()

export const metadata: Metadata = {
  title: dict['datatable.cs.add'] ?? 'Create New Credential Schema',
  description: dict['wizard.schema.desc'] ?? 'Create a credential schema in an ecosystem.',
}

export default function AddCredentialSchemaLayout({ children }: { children: ReactNode }) {
  return children
}
