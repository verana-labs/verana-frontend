import Image from 'next/image'

export default function VeranaLogo() {
  return (
<div className="flex items-center mr-4 min-w-0">
  <div className="flex-none mr-2 w-6 h-6 sm:w-[34px] sm:h-[34px]">
    <Image 
      src="/verana.io.svg"
      alt="Logo Verana"
      width={34}
      height={34}
      style={{ width: '100%', height: '100%' }}
    />
  </div>
  <span className="font-semibold text-base sm:text-xl flex-shrink min-w-0">
    VERANA
  </span>
</div>
  );
}
