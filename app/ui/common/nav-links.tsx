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
              'hidden md:flex items-center gap-2 h-12 rounded-md px-3 transition-all ' +
              'text-sidenav-light-text dark:text-sidenav-dark-text ' + 
              'hover:text-light-selected-text hover:bg-light-selected-bg ' + 
              'dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg',
              {
                'bg-light-selected-bg text-light-selected-text dark:bg-dark-selected-bg dark:text-dark-selected-text' : 
                pathname === link.href
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