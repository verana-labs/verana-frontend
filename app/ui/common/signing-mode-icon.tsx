'use client'

import { faBolt, faGavel } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { translate } from '@/i18n/dataview'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { resolveTranslatable } from '@/ui/dataview/types'

export function SigningModeIcon({ mode }: { mode: CorporationSigningMode | null }) {
  if (!mode) return null
  const label =
    resolveTranslatable({ key: `corporation.signingmode.${mode}` }, translate) ??
    (mode === 'operator' ? 'Executes directly as operator' : 'Opens a governance proposal')
  return (
    <FontAwesomeIcon
      icon={mode === 'operator' ? faBolt : faGavel}
      title={label}
      aria-label={label}
      className={mode === 'operator' ? 'text-amber-500' : 'text-primary-500'}
    />
  )
}
