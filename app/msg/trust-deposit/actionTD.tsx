'use client';
import React, { useState } from 'react';
import { useChain } from '@cosmos-kit/react';
import type { StdFee } from '@cosmjs/stargate';
import { veranaGasLimit, veranaGasPrice } from '@/app/config/veranaChain';
import {
  MsgReclaimTrustDeposit,
  MsgReclaimTrustDepositYield,
} from '@/proto-codecs/codec/verana/td/v1/tx';
import { useRouter } from 'next/navigation';
import { useVeranaChain } from '@/app/config/useVeranaChain';
import { useNotification } from '@/app/ui/common/notification-provider';

// Explicit type for supported Trust Deposit actions
export type MsgTypeTD = 'ReclaimDepositTrustDeposit' | 'ClaimInterestsTrustDeposit';

interface FormState { claimed: number }
interface ActionTDProps {
  action: MsgTypeTD;
  setActiveActionId: React.Dispatch<React.SetStateAction<string | null>>;
}

// Success, error and in-progress messages per action
const MSG_SUCCESS_ACTION: Record<MsgTypeTD, (claimed?: number) => string> = {
  ReclaimDepositTrustDeposit: (claimed) =>
    `Deposit reclaimed successfully!${claimed ? ` Amount: ${claimed}` : ''}`,
  ClaimInterestsTrustDeposit: () => 'Interests claimed successfully!',
};

const MSG_INPROGRESS_ACTION: Record<MsgTypeTD, () => string> = {
  ReclaimDepositTrustDeposit: () => 'Reclaiming deposit...',
  ClaimInterestsTrustDeposit: () => 'Claiming interests...',
};

const MSG_ERROR_ACTION: Record<MsgTypeTD, (code?: number, msg?: string) => string> = {
  ReclaimDepositTrustDeposit: (code, msg) =>
    `Failed to reclaim deposit. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  ClaimInterestsTrustDeposit: (code, msg) =>
    `Failed to claim interests. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
};

export default function ActionTD({ action, setActiveActionId }: ActionTDProps) {
  const veranaChain = useVeranaChain();
  const { address, signAndBroadcast, isWalletConnected } = useChain(veranaChain.chain_name);

  const [form, setForm] = useState<FormState>({ claimed: 0 });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'claimed' ? Number(value) : value }));
  };

  const handleCancel = () => {
    setActiveActionId(null);
  };

  const router = useRouter();
  const { notify } = useNotification();
  let notifyPromise: Promise<void> | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWalletConnected || !address) {
      notify('Connect wallet', 'error');
      return;
    }
    const { claimed } = form;

    if (action === 'ReclaimDepositTrustDeposit' && claimed < 1) {
      notify('Enter valid claimed', 'error');
      return;
    }

    setSubmitting(true);
    notifyPromise = notify(
      MSG_INPROGRESS_ACTION[action](),
      'inProgress',
      'Transaction in progress'
    );

    try {
      const basePayload = { creator: address };
      const fullPayload = { ...basePayload, claimed };
      let msgAny:
        | { typeUrl: '/verana.td.v1.MsgReclaimTrustDeposit'; value: MsgReclaimTrustDeposit }
        | { typeUrl: '/verana.td.v1.MsgReclaimTrustDepositYield'; value: MsgReclaimTrustDepositYield };

      switch (action) {
        case 'ReclaimDepositTrustDeposit':
          msgAny = {
            typeUrl: '/verana.td.v1.MsgReclaimTrustDeposit',
            value: MsgReclaimTrustDeposit.fromPartial(fullPayload),
          };
          break;
        case 'ClaimInterestsTrustDeposit':
          msgAny = {
            typeUrl: '/verana.td.v1.MsgReclaimTrustDepositYield',
            value: MsgReclaimTrustDepositYield.fromPartial(basePayload),
          };
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      const fee: StdFee = {
        amount: [
          {
            denom: 'uvna',
            amount: String(
              Math.ceil(parseFloat(veranaGasPrice.toString()) * veranaGasLimit)
            ),
          },
        ],
        gas: veranaGasLimit.toString(),
      };

      const res = await signAndBroadcast([msgAny], fee, action);

      if (res.code === 0) {
        notifyPromise = notify(
          MSG_SUCCESS_ACTION[action](claimed),
          'success',
          'Transaction successful'
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION[action](res.code, res.rawLog),
          'error',
          'Transaction failed'
        );
      }
    } catch (err: unknown) {
      notifyPromise = notify(
        MSG_ERROR_ACTION[action](undefined, err instanceof Error ? err.message : String(err)),
        'error',
        'Transaction failed'
      );
    } finally {
      if (notifyPromise) await notifyPromise;
      setSubmitting(false);
      handleCancel();
      router.push('/');
      setTimeout(() => router.push('/account'), 100);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {action === 'ReclaimDepositTrustDeposit' && (
        <div>
          <label htmlFor="claimed" className="block text-sm font-medium">
            Claimed
          </label>
          <input
            name="claimed"
            type="number"
            value={form.claimed}
            onChange={handleChange}
            placeholder="Claimed"
            className="w-full p-2 border rounded bg-white dark:bg-black"
            min={1}
          />
        </div>
      )}
      <div className="text-center space-x-4">
        <button
          type="button"
          disabled={submitting}
          className="border border-button-light-border dark:border-button-dark-border 
                    inline-flex items-center justify-center gap-2 rounded-md py-1 px-2 transition-all 
                    hover:text-light-selected-text hover:bg-light-selected-bg
                    dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg 
                    disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="border border-button-light-border dark:border-button-dark-border 
                    inline-flex items-center justify-center gap-2 rounded-md py-1 px-2 transition-all 
                    hover:text-light-selected-text hover:bg-light-selected-bg
                    dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg 
                    disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? 'Submitting...' : 'Confirm'}
        </button>
      </div>
    </form>
  );
}
