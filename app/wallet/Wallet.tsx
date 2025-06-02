'use client';

import {
  Box,
  // ClipboardCopyText,
  // Stack,
  // useColorModeValue,
} from "@interchain-ui/react";
import { WalletStatus } from "cosmos-kit";
import { useChain } from "@cosmos-kit/react";
// import { getChainLogo } from "../lib/wallet_util";
import { CHAIN_NAME } from "../config/defaults";
// import User from "./User";
// import Chain from "./Chain";
// import Warning from "./Warning";
import {
  ButtonConnect,
  ButtonConnected,
  ButtonConnecting,
  ButtonDisconnected,
  ButtonError,
  ButtonNotExist,
  ButtonRejected,
} from "./Connect";

export default function Wallet() {
  const {
    // chain,
    status,
    // wallet,
    // username,
    // address,
    // message,
    connect,
    openView,
  } = useChain(CHAIN_NAME);

  const ConnectButton = {
    [WalletStatus.Connected]: <ButtonConnected onClick={openView} />,
    [WalletStatus.Connecting]: <ButtonConnecting />,
    [WalletStatus.Disconnected]: <ButtonDisconnected onClick={connect} />,
    [WalletStatus.Error]: <ButtonError onClick={openView} />,
    [WalletStatus.Rejected]: <ButtonRejected onClick={connect} />,
    [WalletStatus.NotExist]: <ButtonNotExist onClick={openView} />,
  }[status] || <ButtonConnect onClick={connect} />;

  return (
    <Box
    //   my="$8"
    //   flex="1"
    //   width="full"
    //   display="flex"
    //   height="$16"
    //   overflow="hidden"
    //   justifyContent="center"
    //   px={{ mobile: "$8", tablet: "$10" }}
      // backgroundColor="transparent"
    >
      {ConnectButton}
    </Box>
  );
}
