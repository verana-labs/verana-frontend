'use client';

import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { resolveTranslatable } from '../dataview/types';
import { translate } from '@/i18n/dataview';
import { communityLinks, configFooter } from '@/lib/dashlinks';
import Link from 'next/link';
import { useChainVersion } from '@/hooks/useChainVersion';
import { useIndexerVersion } from '@/hooks/useIndexerVersion';

export function Footer() {
  const networkVersion = useChainVersion();
  const indexerVersion = useIndexerVersion();
  const frontendVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  return (
    <div className="flex-shrink-0 px-2 py-4 border-t border-neutral-20 dark:border-neutral-70">
      {/* Logo & versions */}
      <div className="flex items-start">
        <Image
          src={configFooter.img}
          alt="Verana Logo"
          width={24}
          height={24}
          className="w-6 h-6 mr-2 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {resolveTranslatable({key: "footer.title"}, translate)}
          </p>
          <div className="text-xs text-neutral-70 dark:text-neutral-70 space-y-0">
            <p>network {networkVersion ?? '...'}</p>
            <p>indexer {indexerVersion ?? '...'}</p>
            <p>frontend {frontendVersion ? `v${frontendVersion}` : '...'}</p>
          </div>
        </div>
      </div>

      {/* Social Ícons */}
      <div className="mt-3 flex space-x-4">
        {communityLinks.map((link, idx) => {
            return (
                <Link key={`communityLink-${idx}`} href={link.href} target="_blank">
                <span className="text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300 cursor-pointer">
                    <FontAwesomeIcon icon={link.icon??'0'}/>
                    </span>
                </Link>
            );
        })}
      </div>

      {/* <div className="mt-3 flex space-x-2">
        <a
          href="https://github.com/verana-network"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300 cursor-pointer"
          aria-label="GitHub"
        >
          <FontAwesomeIcon icon={faGithub} className="text-sm h-[18px] w-[18px]" />
        </a>

        <a
          href="https://verana.io/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300 cursor-pointer"
          aria-label="Documentation"
        >
          <FontAwesomeIcon icon={faBook} className="text-sm h-[18px] w-[18px]" />
        </a>

        <a
          href="https://verana.io/help"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300 cursor-pointer"
          aria-label="Help"
        >
          <FontAwesomeIcon icon={faCircleQuestion} className="text-sm h-[18px] w-[18px]" />
        </a>
      </div> */}
    </div>
  );
}
