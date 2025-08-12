'use client';

import { LinkSlashIcon, LinkIcon } from '@heroicons/react/24/outline';
import Wallet from "@/app/wallet/wallet";
import Image from 'next/image';

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
          {isConnected ? "Connected" : "Not Connected"}
        </div>
        <div className="dash-desc">
          {isConnected
            ? "Your crypto wallet is connected to Verana allowing you to proceed with all features."
            : "Please connect your preferred crypto wallet to Verana before you proceed"}
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
