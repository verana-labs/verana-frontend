import { WalletIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function VeranaLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <WalletIcon className="h-6 w-6 md:h-12 md:w-12 rotate-[0deg]" />
      <p className="hidden sm:block text-[30px]">Verana</p>
    </div>
  );
}
