'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import VeranaLog from '@/ui/common/verana-logo';
import IconLabelButton from '@/ui/common/icon-label-button'; 
import ToggleTheme from '@/ui/common/toggle-theme'; 
import NavLinks from '@/ui/common/nav-links';
import { resolveTranslatable } from '../dataview/types'; 
import { translate } from '@/i18n/dataview';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faGear, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import AccountZone from './account-zone';
import { formatNetwork } from '@/util/util';


export default function NavBar() {
  const veranaChain = useVeranaChain();

  return (
    <Disclosure as="nav" className="navbar-container">
      {({ open }) => (
        <>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className='navbar-container-general'>
            {/* Left: Logo and App Name */}
            <VeranaLog />

            {/* Mobile menu button */}
            <DisclosureButton className='navbar-mobile-menu-container'>
              <span className="sr-only">Open main menu</span>
              {open
                ? <FontAwesomeIcon icon={faXmark} aria-hidden="true"/>
                : <FontAwesomeIcon icon={faBars} aria-hidden="true"/>
              }
            </DisclosureButton>

            {/* Right: Actions */}
            <div className="navbar-user-actions">
                {/* Network Status */}
                <div className="flex items-center space-x-2 px-3 py-1 bg-success-50 dark:bg-success-900/20 rounded-full"
                  dangerouslySetInnerHTML= {{__html: formatNetwork(veranaChain.chain_id)}}
                />

                {/* Settings 
                <IconLabelButton icon={faGear} title={resolveTranslatable({key: 'navbar.settings.title'}, translate)} className='navbar-icon' />
*/}
                {/* Theme Toggle 
                <ToggleTheme />
*/}
                {/* Account Zone */}
                <AccountZone />
            </div>

          </div>
        </div>

          {/* Mobile panel */}
          <DisclosurePanel className='navbar-mobile-panel'>
            {/* Logo */}
            {/* <div className='navbar-mobile-logo'>
              <VeranaLog />
            </div> */}
            {/* Links - Sublinks */}
            <NavLinks/>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

