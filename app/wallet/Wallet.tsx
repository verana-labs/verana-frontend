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
import { veranaChain } from "@/app/config/veranachain";
import { useRouter } from "next/navigation";
import { shortenMiddle } from "@/app/util/util";
import { ArrowRightEndOnRectangleIcon, ArrowTopRightOnSquareIcon, QrCodeIcon, Square2StackIcon } from "@heroicons/react/24/outline";
import IconLabelButton from "@/app/ui/common/icon-label-button";
import { JSX } from "react";

export default function Wallet() {
  
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
    <div className="md:flex space-x-4">
      { address ?
        <>
        <div className="md:flex border rounded-md">
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
            className="border-transparent"
          />
          <IconLabelButton
            Icon={ArrowTopRightOnSquareIcon}
            title="Mintscan"
            className="border-transparent"
          />
        </div>
        <IconLabelButton
          onClick={openView}
          Icon={ArrowRightEndOnRectangleIcon}
          title="Disconnect"
        />
      </>
      : 
      <div className="border border-button-light-border dark:button-dark-border text-sm text-connect-light-text dark:text-connect-dark-text md:flex rounded-md py-2 px-4 transition-all hover:text-sidenav-light-selected-text hover:sidenav-light-selected-bg dark:hover:text-sidenav-dark-selected-text dark:hover:sidenav-dark-selected-bg">
        {ConnectButton}
      </div>
      }
    </div>
  );
}