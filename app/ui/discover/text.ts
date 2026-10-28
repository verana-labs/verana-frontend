import { translate } from '@/i18n/dataview'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'

export function discoverText(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key, values }, translate) ?? key
}
