'use client';

import { WalletStatus } from "cosmos-kit";
import { useChain } from "@cosmos-kit/react";
import {
  ButtonConnect,
  ButtonConnected,
  ButtonConnecting,
  ButtonDisconnected,
  ButtonError,
  ButtonNotExist,
  ButtonRejected,
} from "./Connect";
import { veranaChain } from "@/app/config/veranachain";
import { useRouter } from "next/navigation";
import { shortenMiddle } from "@/app/util/util";
import { ArrowRightEndOnRectangleIcon, ArrowTopRightOnSquareIcon, QrCodeIcon, Square2StackIcon } from "@heroicons/react/24/outline";
import IconLabelButton from "@/app/ui/common/icon-label-button";

export default function Wallet() {
  const {
    status,
    address,
    connect,
    openView,
  } = useChain(veranaChain.chain_name);

  const ConnectButton = {
    [WalletStatus.Connected]: <ButtonConnected onClick={openView} />,
    [WalletStatus.Connecting]: <ButtonConnecting />,
    [WalletStatus.Disconnected]: <ButtonDisconnected onClick={connect} />,
    [WalletStatus.Error]: <ButtonError onClick={openView} />,
    [WalletStatus.Rejected]: <ButtonRejected onClick={connect} />,
    [WalletStatus.NotExist]: <ButtonNotExist onClick={openView} />,
  }[status] || <ButtonConnect onClick={connect} />;

  const router = useRouter();

  return (
    <div className="md:flex">
      { address ?
        <>
          <IconLabelButton
            Icon={QrCodeIcon}
            title="Address QR Code"
          />
          <IconLabelButton
            Icon={Square2StackIcon}
            onClick={() => navigator.clipboard.writeText(address)}
            title="Copy Address"
          />
          <IconLabelButton
            onClick={() => router.push('/account')}
            label={shortenMiddle(address, 18)}
            title="Open Account"
          />
          <IconLabelButton
            Icon={ArrowTopRightOnSquareIcon}
            title="Mintscan"
          />
          <IconLabelButton
            onClick={openView}
            Icon={ArrowRightEndOnRectangleIcon}
            title="Disconnect"
          />
      </>
      : 
      <div className="rounded-md flex text-white items-center border border-transparent py-2 px-4 text-center text-sm transition-all hover:text-slate-600 active:text-slate-600 focus:text-slate-600 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none">
        {ConnectButton}
      </div>
      }
    </div>
  );
}