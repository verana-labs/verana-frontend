'use client';

import { LinkSlashIcon, LinkIcon } from '@heroicons/react/24/outline';
import Wallet from "@/wallet/wallet";
import Image from 'next/image';
import { resolveTranslatable } from '../dataview/types';
import { translate } from '@/i18n/dataview';

interface WalletInfo {
    logo?: string | {
        major: string;
        minor: string;
    };
    prettyName?: string;
}

interface ConnectedProps {
  isConnected: boolean;
  wallet?: WalletInfo;
}


export default function Connected({ isConnected, wallet }: ConnectedProps) {
  return (
    <div className="dash-card">
      <div className="dash-icon-wrap">
        <div className="dash-icon">
            {isConnected ? <LinkIcon className="dash-icon-svg" /> : <LinkSlashIcon className="dash-icon-svg" />}
        </div>
      </div>
      <div className="dash-copy">
        <div className="dash-title">
          {isConnected ? resolveTranslatable({key: 'connected.title'}, translate) : resolveTranslatable({key: 'notconnected.title'}, translate)}
        </div>
        <div className="dash-desc">
          {isConnected ? resolveTranslatable({key: 'connected.msg'}, translate) : resolveTranslatable({key: 'notconnected.msg'}, translate)}
        </div>
      {isConnected ? (
        <Image
            src={wallet && wallet.logo ? wallet.logo.toString() : ''}
            alt={wallet && wallet.prettyName ? wallet.prettyName : ''}
            width={80}
            height={80}
            className="dash-wallet-logo"
        />
      ) : (
        <div className="wallet-cta">
          <Wallet isNavBar={false}/>
        </div>
      )
    }
      </div>
    </div>
  );
}
