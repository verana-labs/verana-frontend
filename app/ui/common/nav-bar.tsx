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
    <Disclosure as="nav" className="navbar-container">
      {({ open }) => (
        <>
          <div className='navbar-container-general'>
              <div className='navbar-container-left'>
                {/* Logo */}
                <div className='hidden-md-block'>
                  <VeranaLog />
                </div>
                {/* Mobile menu button */}
                <div className='navbar-mobile-menu-btn'>
                  <DisclosureButton className='navbar-mobile-menu-container'>
                    <span className="sr-only">Open main menu</span>
                    {open
                      ? <XMarkIcon className="icon-sm" aria-hidden="true" />
                      : <Bars3Icon className="icon-sm" aria-hidden="true" />
                    }
                  </DisclosureButton>
                </div>
              </div>

              {/* User actions */}
              <div className="navbar-user-actions">
                <ToggleTheme />
                <div className="navbar-user-actions-btn-container">
                  <IconLabelButton Icon={Cog8ToothIcon} title="Settings" />
                </div>
                <div className="navbar-user-actions-btn-container">
                  <Wallet />
                </div>
              </div>

          </div>

          {/* Mobile panel */}
          <DisclosurePanel className='navbar-mobile-panel'>
            {/* Logo */}
            <div className='navbar-mobile-logo'>
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

