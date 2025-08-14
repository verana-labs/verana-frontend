'use client';

import { veranaGasLimit, veranaGasPrice, veranaDenom } from '@/app/config/veranaChain.client';
import type { StdFee } from '@cosmjs/stargate';
import type { MessageType } from '@/app/constants/msgTypeConfig';

const gasConfig: Record<MessageType, { gasLimit: number; gasPrice: number; denom: string }> = {
  MsgAddDID: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgRenewDID: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgTouchDID: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgRemoveDID: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgReclaimTrustDepositYield: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgReclaimTrustDeposit: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgRepaySlashedTrustDeposit: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgCreateTrustRegistry: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgUpdateTrustRegistry: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgArchiveTrustRegistry: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgAddGovernanceFrameworkDocument: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
  MsgIncreaseActiveGovernanceFrameworkVersion: { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom },
};

/**
 * Custom hook to calculate fee and fee in VNA for a given message type.
 */
export function useCalculateFee(type: MessageType): { fee: StdFee; amountVNA: number } {
  const { gasLimit, gasPrice, denom } = gasConfig[type];
  const amount = Math.ceil(Number(gasPrice) * Number(gasLimit));
  const amountVNA = (amount / 1_000_000);

  const fee: StdFee = {
    amount: [
      {
        denom,
        amount: String(amount),
      },
    ],
    gas: gasLimit.toString(),
  };

  return { fee, amountVNA };
}
