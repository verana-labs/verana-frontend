'use client';

import { Box } from "@interchain-ui/react";
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
    <Box>
      {
        address ?
        <div onClick={() => router.push("/account")}style={{cursor: "pointer"}}>
          {shortenMiddle(address, 18)}
        </div>
        : ConnectButton
      }
    </Box>
  );
}

