'use client'

import { useChain } from '@cosmos-kit/react'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useCorporationAttention } from '@/hooks/useCorporationAttention'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { getNavLinks } from '@/lib/navlinks'
import { usePendingTasksCtx } from '@/providers/api-rest-query-provider-context'
import { useCorporationContext } from '@/providers/corporation-provider'

export default function NavLinks() {
  const veranaChain = useVeranaChain()
  const { isWalletConnected } = useChain(veranaChain.chain_name)

  const pathname = usePathname()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleDropdown = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  const pendingTasksCtx = usePendingTasksCtx()
  const totalPendingTasks = pendingTasksCtx.pendingParticipants.reduce((total, item) => total + item.pending_tasks, 0)
  const { acting, memberships, requestSelection } = useCorporationContext()
  const attention = useCorporationAttention(acting ? [acting] : [])
  const pendingVotes = acting ? (attention[acting.corporation.id]?.pendingVotes ?? 0) : 0
  const links = getNavLinks(totalPendingTasks + pendingVotes)

  return (
    <nav className="mt-5 flex-1 px-2 space-y-1">
      {links.map((link, idx: number) => {
        const hasSubLinks = Array.isArray(link.links) && link.links.length > 0
        if (!isWalletConnected && !link.availableOffline) return null
        const needsCorporation = link.requiresCorporation === true && !acting
        if (needsCorporation && memberships.length === 0) return null
        return (
          <div key={link.name} className="relative w-full self-stretch justify-center items-center">
            <Link
              href={link.href}
              onClick={
                needsCorporation
                  ? (event) => {
                      event.preventDefault()
                      requestSelection()
                    }
                  : undefined
              }
              className={pathname === link.href ? 'nav-links-selected' : 'nav-links-link'}
            >
              <FontAwesomeIcon
                icon={link.icon}
                className={pathname === link.href ? 'nav-links-icon-selected' : 'nav-links-icon'}
              />
              {link.count ? (
                <span className="absolute top-0 left-4 min-w-4 h-4 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                  {link.count}
                </span>
              ) : null}
              {link.name && <span className="nav-links-label">{link.name}</span>}
              {hasSubLinks && (
                <FontAwesomeIcon
                  icon={faChevronDown}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleDropdown(idx)
                  }}
                  className={openIndex === idx ? 'rotate-180' : ''}
                />
              )}
            </Link>

            {/* SubLinks */}
            {hasSubLinks && openIndex === idx && (
              <div className="nav-links-sublinks-container">
                <div className="nav-links-sublinks-line" />
                <div className="nav-links-sublinks">
                  {link.links?.map((sublink) => (
                    <Link key={sublink.name} href={sublink.href}>
                      <span className="nav-links-sublinks-label">{sublink.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
