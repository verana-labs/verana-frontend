'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, Cog8ToothIcon } from '@heroicons/react/24/outline';
import VeranaLog from '@/app/ui/common/verana-logo';
import { links } from '@/app/lib/navlinks';
import { usePathname } from 'next/navigation';
import Wallet from '@/app/wallet/Wallet';
import IconLabelButton from '@/app/ui/common/icon-label-button';
import ToggleTheme from '@/app/ui/common/toggle-theme';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <Disclosure as="nav" className="w-full bg-light-bg dark:bg-dark-bg border-b-[0.5px] border-light-border dark:border-dark-border">
      {({ open }) => (
        <>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-[68px] items-center justify-between">
              
              <div className="flex items-center">
                {/* Logo */}
                <div className="hidden sm:block">
                  <VeranaLog />
                </div>
                {/* Mobile menu button */}
                <div className="sm:hidden ml-2">
                  <DisclosureButton className="inline-flex items-center justify-center p-2 rounded-md 
                                      hover:text-light-selected-text hover:bg-light-selected-bg
                                      dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg
                                    ">
                    <span className="sr-only">Open main menu</span>
                    {open
                      ? <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      : <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    }
                  </DisclosureButton>
                </div>
              </div>

              {/* Icons */}
              <div className="flex items-center space-x-2">
                <IconLabelButton Icon={Cog8ToothIcon} title="Settings" />
                <ToggleTheme />
                <Wallet />
              </div>

            </div>
          </div>

          {/* Mobile panel */}
          <DisclosurePanel className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {links.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    pathname === item.href
                      ? 'bg-light-selected-bg text-light-selected-text dark:bg-dark-selected-bg dark:text-dark-selected-text'
                      : '',
                    'block px-3 py-2 rounded-md text-base font-medium',
                    'hover:text-light-selected-text hover:bg-light-selected-bg',
                    'dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg'
                  )}
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

