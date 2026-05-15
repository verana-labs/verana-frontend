import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/i18n/dataview'

const dict = getDictionary()

export const metadata: Metadata = {
  title: dict['meta.home.title'] ?? 'Verana Dashboard',
  description:
    dict['meta.home.description'] ?? 'Entry point to Verana where you can access network dashboards and tools.',
}

export default function Page() {
  redirect('/dashboard')
}
