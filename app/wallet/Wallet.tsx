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
} from "./Connect";
import { useRouter } from "next/navigation";
import { shortenMiddle } from "@/app/util/util";
import { ArrowRightEndOnRectangleIcon, ArrowTopRightOnSquareIcon, QrCodeIcon, Square2StackIcon } from "@heroicons/react/24/outline";
import IconLabelButton from "@/app/ui/common/icon-label-button";
import { JSX } from "react";
import { useVeranaChain } from "@/app/config/useVeranaChain";

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

  return (
    <div className="flex items-center justify-center gap-2">
      { address && isNavBar ?
        <>
        <div className="flex items-center border rounded-md border-light-border dark:border-dark-border">
          <IconLabelButton
            Icon={QrCodeIcon}
            title="Address QR Code"
            className="border-transparent"
          />
          <IconLabelButton
            Icon={Square2StackIcon}
            onClick={() => navigator.clipboard.writeText(address)}
            title="Copy Address"
            className="border-transparent"
          />
          <IconLabelButton
            onClick={() => router.push('/account')}
            label={shortenMiddle(address, 18)}
            title="Open Account"
            className="border-transparent underline text-connect-light-text dark:text-connect-dark-text"
          />
          <IconLabelButton
            Icon={ArrowTopRightOnSquareIcon}
            title="Mintscan"
            className="border-transparent"
            onClick={() => window.open(`https://www.mintscan.io/${veranaChain.chain_name}/account/${address}`, "_blank")}
          />
        </div>
        <IconLabelButton
          onClick={openView}
          Icon={ArrowRightEndOnRectangleIcon}
          title="Disconnect"
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