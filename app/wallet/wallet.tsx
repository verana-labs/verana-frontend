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
import { JSX, useEffect, useRef } from "react";
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "@/ui/dataview/types";

type WalletProps = {
  autoConnect?: boolean;
};

export default function Wallet({ autoConnect = false }: WalletProps) {  
  const veranaChain = useVeranaChain();

  const {
    status,
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
    Disconnected:<ButtonDisconnected onClick={connect} text={resolveTranslatable({key: 'wallet.dashboard.connect' }, translate) }/>,
    Error:       <ButtonRejected    onClick={connect} />,
    Rejected:    <ButtonRejected    onClick={connect} />,
    NotExist:    <ButtonNotExist    onClick={openView} />,
  };

  const ConnectButton =
    buttonByStatus[status as WalletStatus] ?? (
      <ButtonConnect onClick={connect} text={ resolveTranslatable({key: 'wallet.dashboard.connect' }, translate) }/>
    );

  const attemptAutoConnect = useRef(false);
  useEffect(() => {
    if (!autoConnect) return;
    if (attemptAutoConnect.current) return;
    const canConnect =
      status === "Disconnected" ||
      status === "Rejected" ||
      status === "Error";
    if (canConnect) {
      attemptAutoConnect.current = true;
      connect();
    }
  }, [autoConnect, status, connect]);

  if (autoConnect) return null;

  return (
    <div className="flex items-center space-x-4 rtl:space-x-reverse">
      <div className="border-0 items-center justify-center flex rounded-md transition-all" >
        {ConnectButton}
      </div>
    </div>
  );
}