'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { links } from '@/lib/navlinks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';

export default function NavLinks() {
  const veranaChain = useVeranaChain();
  const { isWalletConnected } = useChain(veranaChain.chain_name);
  
  const pathname = usePathname();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleDropdown = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <nav className="mt-5 flex-1 px-2 space-y-1">
      {links.map((link, idx: number) => {
        const hasSubLinks = Array.isArray(link.links) && link.links.length > 0;
        if (!isWalletConnected && !link.availableOffline ) return;
        return (
          <div key={link.name} className="relative w-full self-stretch justify-center items-center">

              <Link
                href={link.href}
                className={(pathname === link.href) ? 'nav-links-selected' : 'nav-links-link'}
              >
                <FontAwesomeIcon 
                  icon={link.icon} 
                  className={(pathname === link.href) ? 'nav-links-icon-selected' : 'nav-links-icon'}
                />
                {link.name && (<span className="nav-links-label">{link.name}</span>)}
                {hasSubLinks && (
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    onClick={(e) => {
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      toggleDropdown(idx);
                    }}
                    className={openIndex === idx ? "rotate-180" : ""}
                  />
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
    </nav>
  );
}


