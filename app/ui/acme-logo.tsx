import { GlobeAltIcon, GlobeAmericasIcon, WalletIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <p className="text-[44px]">Verana</p>
      <WalletIcon className="h-12 w-12 rotate-[0deg]" />
    </div>
  );
}
