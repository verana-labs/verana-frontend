'use client';

import React, { useState } from 'react';
import { useChain } from '@cosmos-kit/react';
import type { StdFee } from '@cosmjs/stargate';
import { veranaGasLimit, veranaGasPrice } from '@/app/config/veranaChain';
import {
  MsgAddDID,
  MsgRenewDID,
  MsgTouchDID,
  MsgRemoveDID,
} from '@/proto-codecs/codec/verana/dd/v1/tx';
import { usePathname, useRouter } from 'next/navigation';
import { useVeranaChain } from '@/app/config/useVeranaChain';
import { useNotification } from '@/app/ui/common/notification-provider';

// Restrict allowed actions to valid message types
export type MsgTypeDID = 'AddDID' | 'RenewDID' | 'TouchDID' | 'RemoveDID';

// Constants for user notifications per action
const MSG_SUCCESS_ACTION: Record<MsgTypeDID, (did: string) => string> = {
  AddDID:    (did) => `Your DID ${did} was created successfully!`,
  RenewDID:  (did) => `Your DID ${did} was renewed successfully!`,
  TouchDID:  (did) => `Your DID ${did} was touched successfully!`,
  RemoveDID: (did) => `Your DID ${did} was removed successfully!`
};
const MSG_ERROR_ACTION: Record<MsgTypeDID, (did: string, code?: number, msg?: string) => string> = {
  AddDID:    (did, code, msg) => `Failed to create DID ${did}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  RenewDID:  (did, code, msg) => `Failed to renew DID ${did}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  TouchDID:  (did, code, msg) => `Failed to touch DID ${did}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  RemoveDID: (did, code, msg) => `Failed to remove DID ${did}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
};
const MSG_INPROGRESS_ACTION: Record<MsgTypeDID, (did: string) => string> = {
  AddDID:    (did) => `Creating DID ${did}...`,
  RenewDID:  (did) => `Renewing DID ${did}...`,
  TouchDID:  (did) => `Touching DID ${did}...`,
  RemoveDID: (did) => `Removing DID ${did}...`
};

interface FormState { did: string; years: number; }
interface ActionDIDProps {
  action: MsgTypeDID; // Type-safe action prop
  id?: string;
}

// Supported Cosmos Amino message types for DID actions
type MsgAny =
  | { typeUrl: '/verana.dd.v1.MsgAddDID'; value: MsgAddDID }
  | { typeUrl: '/verana.dd.v1.MsgRenewDID'; value: MsgRenewDID }
  | { typeUrl: '/verana.dd.v1.MsgTouchDID'; value: MsgTouchDID }
  | { typeUrl: '/verana.dd.v1.MsgRemoveDID'; value: MsgRemoveDID };

export default function ActionDID({ action, id }: ActionDIDProps) {
  // Load chain and wallet context
  const veranaChain = useVeranaChain();
  const { address, signAndBroadcast, isWalletConnected } = useChain(veranaChain.chain_name);

  // Form state
  const [form, setForm] = useState<FormState>({ did: '', years: 1 });
  const [submitting, setSubmitting] = useState(false);

  // Router, notification, and path
  const router = useRouter();
  const { notify } = useNotification();
  const pathname = usePathname();

  // Handle input changes in the form
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'years' ? Number(value) : value }));
  };

  // Form submission for all DID actions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require wallet connection
    if (!isWalletConnected || !address) {
      notify('Connect wallet', 'error');
      return;
    }

    // Validate inputs
    const { did, years } = form;
    if (action === 'AddDID' && !did) {
      notify('Enter valid DID', 'error');
      return;
    }
    if ((action === 'AddDID' || action === 'RenewDID') && years < 1) {
      notify('Enter valid years', 'error');
      return;
    }

    setSubmitting(true);

    // Determine the DID to operate on
    const didPayLoad = (id && action !== "AddDID") ? id : did;

    // Show progress notification
    let notifyPromise: Promise<void> = notify(
      MSG_INPROGRESS_ACTION[action](didPayLoad),
      'inProgress',
      'Transaction in progress'
    );

    let success = false;
    try {
      // Build message for this action
      const basePayload = { creator: address, did: didPayLoad };
      const fullPayload = { ...basePayload, years };
      let msgAny: MsgAny;

      switch (action) {
        case 'AddDID':
          msgAny = { typeUrl: '/verana.dd.v1.MsgAddDID', value: MsgAddDID.fromPartial(fullPayload) };
          break;
        case 'RenewDID':
          msgAny = { typeUrl: '/verana.dd.v1.MsgRenewDID', value: MsgRenewDID.fromPartial(fullPayload) };
          break;
        case 'TouchDID':
          msgAny = { typeUrl: '/verana.dd.v1.MsgTouchDID', value: MsgTouchDID.fromPartial(basePayload) };
          break;
        case 'RemoveDID':
          msgAny = { typeUrl: '/verana.dd.v1.MsgRemoveDID', value: MsgRemoveDID.fromPartial(basePayload) };
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      // Prepare the transaction fee
      const fee: StdFee = {
        amount: [
          {
            denom: 'uvna',
            amount: String(Math.ceil(parseFloat(veranaGasPrice.toString()) * veranaGasLimit)),
          },
        ],
        gas: veranaGasLimit.toString(),
      };

      // Broadcast the transaction
      const res = await signAndBroadcast([msgAny], fee, action);

      // Handle broadcast result and notifications
      if (res.code === 0) {
        success = true;
        notifyPromise = notify(
          MSG_SUCCESS_ACTION[action](didPayLoad),
          'success',
          'Transaction successful'
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION[action](didPayLoad, res.code, res.rawLog),
          'error',
          'Transaction failed'
        );
      }
    } catch (err) {
      notifyPromise = notify(
        MSG_ERROR_ACTION[action](didPayLoad, undefined, err instanceof Error ? err.message : String(err)),
        'error',
        'Transaction failed'
      );
    } finally {
      // Wait for notification to close before continuing
      if (notifyPromise) await notifyPromise;
      setSubmitting(false);

      // Redirect on success or fallback
      const didUrl = `/did/${encodeURIComponent(didPayLoad)}`;
      if ((action === 'RenewDID' || action === 'TouchDID' || action === 'AddDID') && success) {
        if (pathname === didUrl) {
          router.push('/did');
          setTimeout(() => router.push(didUrl), 100);
        } else {
          router.push(didUrl);
        }
      } else {
        router.push('/did');
      }
    }
  };

  // UI: AddDID includes DID input, AddDID/RenewDID include years select
  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {action === 'AddDID' && (
        <div>
          <label htmlFor="did" className="block text-sm font-medium">
            DID
          </label>
          <input
            name="did"
            value={form.did}
            onChange={handleChange}
            placeholder="did:method:identifier"
            className="w-full p-2 border rounded bg-white dark:bg-black"
            type='text'
          />
        </div>
      )}
      {(action === 'AddDID' || action === 'RenewDID') && (
        <div>
          <label htmlFor="years" className="block text-sm font-medium">
            Years
          </label>
          <select
            id="years"
            name="years"
            value={form.years}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded bg-white dark:bg-black"
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="border border-button-light-border dark:border-button-dark-border 
                  inline-flex items-center justify-center gap-2 rounded-md py-1 px-2 transition-all 
                  hover:text-light-selected-text hover:bg-light-selected-bg
                  dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg 
                  disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
      >
        {submitting ? 'Submitting...' : action.substring(0, action.indexOf("DID")) + " DID"}
      </button>
    </form>
  );
}
