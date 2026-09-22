'use client'

import { faBars, faGear, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import Link from 'next/link'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import NavLinks from '@/ui/common/nav-links'
import ToggleTheme from '@/ui/common/toggle-theme'
import VeranaLog from '@/ui/common/verana-logo'
import { resolveTranslatable } from '@/ui/dataview/types'
import { formatNetwork } from '@/util/util'
import AccountZone from './account-zone'
import { CorporationSelector } from './corporation-selector'

export default function NavBar() {
  const veranaChain = useVeranaChain()
  const settingsTitle = resolveTranslatable({ key: 'navbar.settings.title' }, translate)

  return (
    <Disclosure as="nav" className="navbar-container">
      {({ open }) => (
        <>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="navbar-container-general">
              {/* Left: Logo and App Name */}
              <VeranaLog />

              {/* Mobile menu button */}
              <DisclosureButton className="navbar-mobile-menu-container">
                <span className="sr-only">Open main menu</span>
                {open ? (
                  <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                ) : (
                  <FontAwesomeIcon icon={faBars} aria-hidden="true" />
                )}
              </DisclosureButton>

              {/* Right: Actions */}
              <div className="navbar-user-actions">
                {/* Network Status */}
                <div
                  className="flex items-center space-x-2 px-3 py-1 bg-success-50 dark:bg-success-900/20 rounded-full"
                  dangerouslySetInnerHTML={{ __html: formatNetwork(veranaChain.chain_id) }}
                />

                <CorporationSelector />
                <Link href="/settings" title={settingsTitle} aria-label={settingsTitle} className="navbar-icon">
                  <FontAwesomeIcon icon={faGear} />
                </Link>
                <ToggleTheme />

                {/* Account Zone */}
                <AccountZone />
              </div>
            </div>
          </div>

          {/* Mobile panel */}
          <DisclosurePanel className="navbar-mobile-panel">
            <div className="px-4 pt-3 flex items-center justify-between gap-3 lg:hidden">
              <CorporationSelector />
              <ToggleTheme />
            </div>
            {/* Logo */}
            {/* <div className='navbar-mobile-logo'>
              <VeranaLog />
            </div> */}
            {/* Links - Sublinks */}
            <NavLinks />
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}
