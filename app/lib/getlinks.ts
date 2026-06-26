// biome-ignore lint/correctness/noUnusedImports: kept for commented-out future use
import { faCcMastercard, faGooglePay } from '@fortawesome/free-brands-svg-icons'
import { faDroplet, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { VERANA_TOPUP_VS_HOST } from '@/config/env'
import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'

interface GetVNALink {
  name: string
  by: string
  hrefQr: string
  instructions: string
  href: string
  goTo: string
  iconsPay: {
    icon: IconDefinition
    iconClass: string
  }[]
  className?: string
}

// Extract network name (e.g. "Testnet", "Devnet") from did:web:faucet-vs.{network}.verana.network
const networkName = VERANA_TOPUP_VS_HOST.split('.')[1] ?? ''
const networkLabel = networkName.charAt(0).toUpperCase() + networkName.slice(1)

const getVNALinks: GetVNALink[] = [
  {
    name: resolveTranslatable({ key: 'getvna.faucet.name', values: { network: networkLabel } }, translate) ?? '',
    by: resolveTranslatable({ key: 'getvna.faucet.by' }, translate) ?? '',
    hrefQr: `https://${VERANA_TOPUP_VS_HOST}/qr`,
    instructions: resolveTranslatable({ key: 'getvna.faucet.instructions' }, translate) ?? '',
    href: `https://${VERANA_TOPUP_VS_HOST}/invitation`,
    goTo: resolveTranslatable({ key: 'getvna.faucet.goto' }, translate) ?? '',
    iconsPay: [{ icon: faDroplet, iconClass: 'text-blue-600' }],
  },
  /*
  {
    name: resolveTranslatable({ key: 'getvna.ramp.name' }, translate) ?? '',
    by: resolveTranslatable({ key: 'getvna.ramp.by' }, translate) ?? '',
    hrefQr: `https://${VERANA_TOPUP_VS_HOST}/qr`,
    instructions: resolveTranslatable({ key: 'getvna.ramp.instructions' }, translate) ?? '',
    href: `https://${VERANA_TOPUP_VS_HOST}/invitation`,
    goTo: resolveTranslatable({ key: 'getvna.ramp.goto' }, translate) ?? '',    
    iconsPay: [
      { icon: faCcMastercard, iconClass: 'text-red-500' },
      { icon: faGooglePay, iconClass: 'text-green-600' },
    ]
  },  
 */
]

export { getVNALinks }
