'use client'

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faCertificate, faCircleExclamation, faCircleQuestion } from '@fortawesome/free-solid-svg-icons'
import { translate } from '@/i18n/dataview'
import { DidTrustState } from '@/lib/resolverClient'
import { resolveTranslatable } from '@/ui/dataview/types'

type TrustStateBadge = {
  label: string
  icon: IconDefinition
  iconColorClass: string
}

function badge(labelKey: string, fallbackLabel: string, icon: IconDefinition, iconColorClass: string): TrustStateBadge {
  return {
    label: resolveTranslatable({ key: labelKey }, translate) ?? fallbackLabel,
    icon,
    iconColorClass,
  }
}

export function trustStateBadge(state: DidTrustState | undefined | null): TrustStateBadge {
  switch (state) {
    case 'TRUSTED':
      return badge('participant.labelTrustState.trusted', 'Trusted', faCertificate, 'text-success')
    case 'UNTRUSTED':
      return badge('participant.labelTrustState.untrusted', 'Untrusted', faCircleExclamation, 'text-destructive')
    default:
      return badge('participant.labelTrustState.unresolved', 'Unresolved', faCircleQuestion, 'text-muted-foreground')
  }
}
