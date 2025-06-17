'use client';

// import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, Cog8ToothIcon } from '@heroicons/react/24/outline'
import VeranaLog from '../verana-logo'
import { links } from '@/app/lib/navlinks';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion } from "framer-motion";
// import CosmosHub from '@/app/wallet/CosmosHub';
// import KeplrConnection from '@/app/basic/KeplrConnection';
import { SigningStargateClient } from '@cosmjs/stargate';
import VeranaChain from '@/app/wallet/VeranaChain';


function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function NavBar() {

  const [client, setClient] = useState<SigningStargateClient | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleClientCreated = (newClient: SigningStargateClient, newAddress: string) => {
    setClient(newClient);
    setAddress(newAddress);
  };

    const pathname = usePathname();
    const [toggle, setToggle] = useState<boolean>(false);
    return (
    <Disclosure as="nav" className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 sm:items-left">
            <VeranaLog/>
            </div>
            <div className="hidden sm:ml-6 sm:block">
              {/* <div className="flex space-x-4">
                {links.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    className={classNames(
                      item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'rounded-md px-3 py-2 text-sm font-medium',
                    )}
                  >
                    {item.name}
                  </a>
                ))}
              </div> */}
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <button
              type="button"
              className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden "
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">Settings</span>
              <Cog8ToothIcon aria-hidden="true" className="size-6" />
            </button>
            <div 
                onClick={()=>setToggle(!toggle)}
                className={classNames(
                    'flex h-6 w-12 cursor-pointer rounded-full border border-black',
                    toggle ? 'justify-start bg-white' : 'justify-end bg-black',
                    'p-[1px]'
                )}>
                <motion.div
                    className={classNames(
                        'h-5 w-5 rounded-full',
                        toggle ? 'bg-black' : 'bg-white',
                    )}
                    layout
                    transition={{type: 'spring', stiffness: 700, damping: 30}}
                />
            </div>
            <button className="rounded-md flex items-center border border-transparent py-2 px-4 text-center text-sm transition-all text-slate-600 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none" type="button">
              <VeranaChain/>
            </button>
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {links.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
            //   aria-current={item.current ? 'page' : undefined}
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