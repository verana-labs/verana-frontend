'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { links } from '@/app/lib/navlinks';

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'hidden md:flex items-center gap-2 h-12 rounded-md bg-gray-50 px-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600',
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
              },
            )}
          >
            <Icon className="w-6 h-6 flex-shrink-0" />
            {link.name? (<span>{link.name}</span>) : null}
          </Link>
        );
      })}
    </>
  );
}