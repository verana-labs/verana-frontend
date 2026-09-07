import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { formatDictionaryValue, getDictionary } from '@/i18n/dataview'

type Params = { id: string }
type Props = { params: Promise<Params> }
const TITLE_FALLBACK = 'Ecosystem {id}'
const DESCRIPTION_FALLBACK = 'Manage governance, deposits, and schemas for ecosystem {id}.'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const ecosystemId = decodeURIComponent(id)
  const dict = getDictionary()
  return {
    title: formatDictionaryValue(dict['meta.ecosystem.detail.title'] ?? TITLE_FALLBACK, { id: ecosystemId }),
    description: formatDictionaryValue(dict['meta.ecosystem.detail.description'] ?? DESCRIPTION_FALLBACK, {
      id: ecosystemId,
    }),
  }
}

export default function EcosystemDetailLayout({ children }: { children: ReactNode }) {
  return children
}
