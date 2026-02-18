import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import { faCcMastercard, faGooglePay } from '@fortawesome/free-brands-svg-icons'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { faDroplet, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { env } from 'next-runtime-env';

interface GetVNALink {
  name: string;
  by: string;
  hrefQr: string;
  instructions: string;
  href: string;
  goTo: string;
  iconsPay: { 
              icon: IconDefinition; 
              iconClass: string;
            }[];
  className?: string;
}

const TOPUP_VS =
    env('NEXT_PUBLIC_VERANA_TOPUP_VS') ||
    process.env.NEXT_PUBLIC_VERANA_TOPUP_VS;

const urlGetVNA = (TOPUP_VS ? TOPUP_VS.split(':')[2] : '');

// Extract network name (e.g. "Testnet", "Devnet") from did:web:faucet-vs.{network}.verana.network
const networkName = urlGetVNA.split('.')[1] ?? '';
const networkLabel = networkName.charAt(0).toUpperCase() + networkName.slice(1);

const getVNALinks : GetVNALink[] = [
  {
    name: resolveTranslatable({ key: 'getvna.faucet.name', values: { network: networkLabel } }, translate) ?? '',
    by: resolveTranslatable({ key: 'getvna.faucet.by' }, translate) ?? '',
    hrefQr: `https://${urlGetVNA}/qr`,
    instructions: resolveTranslatable({ key: 'getvna.faucet.instructions' }, translate) ?? '',
    href: `https://${urlGetVNA}/invitation`,
    goTo: resolveTranslatable({ key: 'getvna.faucet.goto' }, translate) ?? '',
    iconsPay: [
      { icon: faDroplet, iconClass: 'text-blue-600' }
    ]
  }, 
  /*
  {
    name: resolveTranslatable({ key: 'getvna.ramp.name' }, translate) ?? '',
    by: resolveTranslatable({ key: 'getvna.ramp.by' }, translate) ?? '',
    hrefQr: `https://${urlGetVNA}/qr`,
    instructions: resolveTranslatable({ key: 'getvna.ramp.instructions' }, translate) ?? '',
    href: `https://${urlGetVNA}/invitation`,
    goTo: resolveTranslatable({ key: 'getvna.ramp.goto' }, translate) ?? '',    
    iconsPay: [
      { icon: faCcMastercard, iconClass: 'text-red-500' },
      { icon: faGooglePay, iconClass: 'text-green-600' },
    ]
  },  
 */
];

export {getVNALinks};