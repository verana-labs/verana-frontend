'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, Cog8ToothIcon } from '@heroicons/react/24/outline';
import VeranaLog from '@/app/ui/common/verana-logo';
import Wallet from '@/app/wallet/wallet';
import IconLabelButton from '@/app/ui/common/icon-label-button';
import ToggleTheme from '@/app/ui/common/toggle-theme';
import NavLinks from '@/app/ui/common/nav-links';

export default function NavBar() {

  return (
    // <div data-property-1="1" className="w-[1440px] h-16 p-4 bg-White-900 border-b border-White-800 inline-flex justify-between items-center">
    <Disclosure as="nav" className="w-full bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border">
      {({ open }) => (
        <>
          <div className="h-16 p-4 flex justify-between items-center text-xs md:text-sm">
              <div className="flex items-center">
                {/* Logo */}
                <div className="hidden md:block">
                  <VeranaLog />
                </div>
                {/* Mobile menu button */}
                <div className="md:hidden ml-2">
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

              {/* User actions */}
              {/* <div class="inline-flex justify-start items-center gap-3"> */}
              <div className="inline-flex items-center justify-start gap-3">
                <ToggleTheme />
                {/* <div class="w-8 h-8 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-700 flex justify-center items-center gap-2"> */}
                <div className="rounded-lg flex justify-center items-center gap-2">
                  <IconLabelButton Icon={Cog8ToothIcon} title="Settings" />
                </div>
                <div className="rounded-lg flex justify-center items-center gap-2">
                  <Wallet />
                </div>
              </div>

          </div>

          {/* Mobile panel */}
          <DisclosurePanel className="md:hidden border border-light-border dark:border-dark-border px-6">
            {/* Logo */}
            <div className='py-4 border-b border-light-border dark:border-dark-border'>
              <VeranaLog />
            </div>
            {/* Links - Sublinks */}
            <NavLinks/>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

