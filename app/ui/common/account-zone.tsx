'use client';

import { useChain } from "@cosmos-kit/react";
import {
  ButtonConnect,
  ButtonConnected,
  ButtonConnecting,
  ButtonDisconnected,
  // ButtonError,
  ButtonNotExist,
  ButtonRejected,
} from "@/wallet/connect";
import { useRouter } from "next/navigation";
import { shortenMiddle } from "@/util/util";
import IconLabelButton from "@/ui/common/icon-label-button";
import { JSX, useEffect, useState } from "react";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "@/ui/dataview/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faQrcode, faRightFromBracket, faUpRightFromSquare, faWallet } from "@fortawesome/free-solid-svg-icons";

export default function AccountZone() {
  
  const veranaChain = useVeranaChain();

  const {
    status,
    address,
    connect,
    openView,
  } = useChain(veranaChain.chain_name);

  type WalletStatus =
    | "Disconnected"
    | "Error"
    | "Connecting"
    | "Connected"
    | "NotExist"
    | "Rejected";

  const buttonByStatus: Record<WalletStatus, JSX.Element> = {
    Connected:   <ButtonConnected   onClick={openView} />,
    Connecting:  <ButtonConnecting  />,
    Disconnected:<ButtonDisconnected onClick={connect} />,
    Error:       <ButtonRejected    onClick={connect} />,
    Rejected:    <ButtonRejected    onClick={connect} />,
    NotExist:    <ButtonNotExist    onClick={openView} />,
  };

  const ConnectButton =
    buttonByStatus[status as WalletStatus] ?? (
      <ButtonConnect onClick={connect} />
    );

  const router = useRouter();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    if (!address) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        return;
      }
    } catch {
      // Swallow copy errors to avoid breaking the UI when clipboard is unavailable
    }
    setCopied(false);
  }

  return (
    <div className="flex items-center space-x-3 px-4 py-2 bg-surface-muted dark:bg-surface-muted rounded-xl">
      { address ?
        <>
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
          <FontAwesomeIcon icon={faCheck} className="text-white text-sm" />
        </div>
        <div
          className="hidden xl:block cursor-pointer select-none"
          onClick={handleCopy}
          title={resolveTranslatable({key: 'navbar.addresscopy.title'}, translate)}
        >
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {shortenMiddle(address, 13)}
          </p>
          <p className="text-xs text-neutral-70 dark:text-neutral-70">
            {resolveTranslatable({key: copied ? 'Copied!': 'connected.title' }, translate)}
          </p>
        </div>

        <div className="flex items-center space-x-1 ml-2">
          <IconLabelButton
            Icon={faQrcode}
            title={resolveTranslatable({key: 'navbar.qr.title'}, translate)}
            className='navbar-icon'
          />
          <IconLabelButton
            Icon={faUpRightFromSquare}
            title={resolveTranslatable({key: 'navbar.mintscan.title'}, translate)}
            onClick={() => window.open(`https://www.mintscan.io/${veranaChain.chain_name}/account/${address}`, "_blank")}
            className='navbar-icon'
          />
          <IconLabelButton
            onClick={openView}
            Icon={faRightFromBracket}
            title={resolveTranslatable({key: 'navbar.disconnect.title'}, translate)}
            className='relative group p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500'
          />
        </div>
      </>
      :
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
          <FontAwesomeIcon icon={faWallet} className="text-white text-sm" />
        </div>
        <div className="hidden xl:block">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {resolveTranslatable({key: 'notconnected.title'}, translate)}
          </p>
          <p className="text-xs text-neutral-70 dark:text-neutral-70">
            {resolveTranslatable({key: 'notconnected.click'}, translate)}
          </p>
        </div>
        <div className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
          {ConnectButton}
        </div>
      </div>
      }
    </div>
  );
}