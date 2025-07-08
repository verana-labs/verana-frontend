'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, Cog8ToothIcon } from '@heroicons/react/24/outline'
import VeranaLog from '@/app/ui/common/verana-logo'
import { links } from '@/app/lib/navlinks';
import { usePathname } from 'next/navigation';
import Wallet from '@/app/wallet/Wallet';
import IconLabelButton from '@/app/ui/common/icon-label-button';
import ToggleTheme from '@/app/ui/common/toggle-theme';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function NavBar() {

    const pathname = usePathname();
    return (
    <Disclosure as="nav">
      {/* <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8"> */}
        <div className="flex h-[68px] justify-between opacity-100 border-b p-4">
        {/* <div className="relative flex h-16 items-center justify-between"> */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>
          <VeranaLog/>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 space-x-4">
            <IconLabelButton
              Icon={Cog8ToothIcon}
              title='Settings'
            />
            <ToggleTheme/>
            <Wallet/>
          </div>
        </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {links.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
              className={classNames(
                pathname === item.href ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium',
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}