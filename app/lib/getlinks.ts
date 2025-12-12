import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import { faCcMastercard, faGooglePay } from '@fortawesome/free-brands-svg-icons';
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

const getVNALinks : GetVNALink[] = [
  {
    name: resolveTranslatable({ key: 'getvna.veranatestnet.name' }, translate) ?? '',
    by: resolveTranslatable({ key: 'getvna.veranatestnet.by' }, translate) ?? '',
    hrefQr: `https://${urlGetVNA}/qr`,
    instructions: resolveTranslatable({ key: 'getvna.veranatestnet.instructions' }, translate) ?? '',
    href: `https://${urlGetVNA}/invitation`,
    goTo: resolveTranslatable({ key: 'getvna.veranatestnet.goto' }, translate) ?? '',
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