import Image from 'next/image'

export default function VeranaLogo() {
  return (
    <div className="flex items-center mr-4 min-w-0">
      <Image
        src="/verana.io.svg"
        alt="Logo Verana"
        width={34}
        height={34}
        className="flex-none mr-2"
      />
      <span className="flex-auto truncate overflow-hidden font-semibold">
        VERANA
      </span>
    </div>
  );
}
