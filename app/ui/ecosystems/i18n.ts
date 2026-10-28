import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'

export function tr(key: string, fallback: string): string {
  return resolveTranslatable({ key }, translate) ?? fallback
}

export function statLabel(key: string, fallback: string): string {
  return tr(key, fallback).replace(/\s*[:：]\s*$/, '')
}
