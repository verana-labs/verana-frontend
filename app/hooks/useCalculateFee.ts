'use client';

import { veranaGasLimit, veranaGasPrice, veranaDenom } from '@/config/veranaChain.sign.client';
import { calculateFee, GasPrice, type StdFee } from '@cosmjs/stargate';

/**
 * Custom hook to calculate fee and fee in VNA for a given message type.
 */
export function useCalculateFee(): { fee: StdFee; amountVNA: number } {
  const { gasLimit, gasPrice, denom } = { gasLimit: veranaGasLimit, gasPrice: veranaGasPrice, denom: veranaDenom };
  const amount = Math.ceil(Number(gasPrice.substring(0, gasPrice.indexOf(denom))) * Number(gasLimit));
  const amountVNA = (amount / 1_000_000);
  const fee = calculateFee(veranaGasLimit, GasPrice.fromString(`${gasPrice}`)); 
  return { fee, amountVNA };
}
