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
                className={clsx(
                  'flex items-center gap-2 h-12 rounded-md  transition-all text-base font-medium ' +
                  'hover:text-light-selected-text hover:bg-light-selected-bg ' + 
                  'dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg',
                  {
                    'bg-light-selected-bg text-light-selected-text dark:bg-dark-selected-bg dark:text-dark-selected-text' : 
                    pathname === link.href
                  },
                )}
                onClick={hasSubLinks ? (e) => {
                  e.preventDefault();
                  toggleDropdown(idx);
                } : undefined}
              >
                <Icon className="w-6 h-6 flex-shrink-0"/>
                {link.name && (<span className="flex-1 leading-tight">{link.name}</span>)}
                {hasSubLinks && (
                  <ChevronDownIcon className={clsx(
                    "w-6 h-6 transition-transform duration-200 relative text-zinc-400",
                    openIndex === idx ? "rotate-180" : ""
                  )} />
                )}
              </Link>

              {/* SubLinks */}
              {hasSubLinks && openIndex === idx && (
                <div className="relative flex flex-col ml-8 mt-1 space-y-1 text-base font-medium ">
                  <div
                    className="
                      absolute left-0 top-0 w-px h-full
                      bg-line-light-bg dark:line-dark-bg
                      pointer-events-none
                    "
                  />
                  <div className="flex flex-col">
                    {link.links?.map((sublink) => (
                      <Link
                        key={sublink.name}
                        href={sublink.href}
                        className={clsx(
                          "flex items-center gap-2 h-10 rounded-md px-3 transition-all",
                          "hover:text-light-selected-text hover:bg-light-selected-bg",
                          "dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg",
                          {
                            "bg-light-selected-bg text-light-selected-text dark:bg-dark-selected-bg dark:text-dark-selected-text": pathname === sublink.href,
                          }
                        )}
                      >
                        <span className="flex-1 leading-tight opacity-60">{sublink.name}</span>
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


