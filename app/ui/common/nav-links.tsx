'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { links } from '@/app/lib/navlinks';

export default function NavLinks() {
  const pathname = usePathname();
const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleDropdown = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <>
      {links.map((link, idx: number) => {
        const Icon = link.icon;
        const hasSubLinks = Array.isArray(link.links) && link.links.length > 0;

        return (
          // <div class="self-stretch p-3.5 rounded-lg shadow-[0px_2px_2px_0px_rgba(5,5,5,0.08)] outline outline-1 outline-offset-[-1px] inline-flex justify-start items-center gap-2">
          <div key={link.name} className="relative w-full self-stretch justify-center items-center">

              <Link
                href={link.href}
                className={clsx( 'nav-links-link',
                  { 'nav-links-selected' : pathname === link.href }
                )}
                onClick={hasSubLinks ? (e) => {
                  e.preventDefault();
                  toggleDropdown(idx);
                } : undefined}
              >
                <Icon className="nav-links-icon"/>
                {link.name && (<span className="nav-links-label">{link.name}</span>)}
                {hasSubLinks && (
                  <ChevronDownIcon className={clsx(
                    "nav-links-down-icon",
                    openIndex === idx ? "rotate-180" : ""
                  )} />
                )}
              </Link>

              {/* SubLinks */}
              {hasSubLinks && openIndex === idx && (
                <div className="nav-links-sublinks-container">
                  <div className='nav-links-sublinks-line'/>
                  <div className='nav-links-sublinks'>
                    {link.links?.map((sublink) => (
                      <Link
                        key={sublink.name}
                        href={sublink.href}
                        className={clsx('nav-links-sublinks-link',
                          { 'nav-links-selected' : pathname === sublink.href }
                        )}
                      >
                        <span className="nav-links-sublinks-label">{sublink.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

          </div>
        );
      })}
    </>
  );
}


