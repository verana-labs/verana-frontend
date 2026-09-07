import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { formatDictionaryValue, getDictionary } from '@/i18n/dataview'

type Params = { id: string }
type Props = { params: Promise<Params> }
const TITLE_FALLBACK = 'Join Ecosystem {id}'
const DESCRIPTION_FALLBACK = 'Join Ecosystem {id}.'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const ecosystemId = decodeURIComponent(id)
  const dict = getDictionary()
  return {
    title: formatDictionaryValue(dict['meta.join.title'] ?? TITLE_FALLBACK, { id: ecosystemId }),
    description: formatDictionaryValue(dict['meta.join.description'] ?? DESCRIPTION_FALLBACK, { id: ecosystemId }),
  }
}

export default function JoinLayout({ children }: { children: ReactNode }) {
  return children
}
