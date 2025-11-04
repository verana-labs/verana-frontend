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
import { ArrowRightEndOnRectangleIcon, ArrowTopRightOnSquareIcon, QrCodeIcon, Square2StackIcon, CheckIcon } from "@heroicons/react/24/outline";
import IconLabelButton from "@/ui/common/icon-label-button";
import { JSX, useEffect, useState } from "react";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "@/ui/dataview/types";

export default function Wallet({ isNavBar = true }: { isNavBar?: boolean }) {
  
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
    <div className="hidden lg:flex items-center space-x-4 rtl:space-x-reverse">
      { address && isNavBar ?
        <>
        <div className="flex items-center border rounded-md border-light-border dark:border-dark-border">
          <IconLabelButton
            Icon={QrCodeIcon}
            title={resolveTranslatable({key: 'navbar.qr.title'}, translate)}
            className="border-transparent"
          />
          <IconLabelButton
            Icon={copied? CheckIcon: Square2StackIcon}
            onClick={() => handleCopy()}
            title={resolveTranslatable({key: 'navbar.addresscopy.title'}, translate)}
            className="border-transparent"
          />
          <IconLabelButton
            onClick={() => router.push('/account')}
            label={shortenMiddle(address, 18)}
            title={resolveTranslatable({key: 'navbar.account.title'}, translate)}
            className="border-transparent underline text-connect-light-text dark:text-connect-dark-text"
          />
          <IconLabelButton
            Icon={ArrowTopRightOnSquareIcon}
            title={resolveTranslatable({key: 'navbar.mintscan.title'}, translate)}
            className="border-transparent"
            onClick={() => window.open(`https://www.mintscan.io/${veranaChain.chain_name}/account/${address}`, "_blank")}
          />
        </div>
        <IconLabelButton
          onClick={openView}
          Icon={ArrowRightEndOnRectangleIcon}
          title={resolveTranslatable({key: 'navbar.disconnect.title'}, translate)}
        />
      </>
      : 
      <div className={(isNavBar ? 
              "h-8 w-36 border-light-border dark:border-dark-border text-connect-light-text dark:text-connect-dark-text hover:text-light-selected-text hover:bg-light-selected-bg dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg border"
              : "border-0") + " items-center justify-center flex rounded-md transition-all"}  
      >
        {ConnectButton}
      </div>
      }
    </div>
  );
}