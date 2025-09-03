'use client';

import React, { useEffect, useState } from 'react';
import { useChain } from '@cosmos-kit/react';
import {
  MsgAddDID,
  MsgRenewDID,
  MsgTouchDID,
  MsgRemoveDID,
} from '@/proto-codecs/codec/verana/dd/v1/tx';
import { usePathname, useRouter } from 'next/navigation';
import { useVeranaChain } from '@/app/hooks/useVeranaChain';
import { useNotification } from '@/app/ui/common/notification-provider';
import { msgTypeConfig, getCostMessage, MessageType } from '@/app/constants/msgTypeConfig';
import { useTrustDepositValue } from '@/app/hooks/useTrustDepositValue';
import { MSG_ERROR_ACTION_DID, MSG_INPROGRESS_ACTION_DID, MSG_SUCCESS_ACTION_DID, MsgTypeDID } from '@/app/constants/notificationMsgForMsgType';
import { MsgAny } from '@/app/msg/amino-converter/aminoConvertersDID';
import { useCalculateFee } from '@/app/hooks/useCalculateFee';
import { useTrustDepositAccountData } from '@/app/hooks/useTrustDepositAccountData';
import { DidData } from '@/app/types/dataViewTypes';

interface FormState { did: string; years: number; }

export default function ActionDID({ action, id, data }: { action: MsgTypeDID, id?: string, data?: object }) {
  // Load chain and wallet context
  const veranaChain = useVeranaChain();
  const { address, signAndBroadcast, isWalletConnected } = useChain(veranaChain.chain_name);
  const [errorNotified, setErrorNotified] = useState(false);

  // Form state
  const [form, setForm] = useState<FormState>({ did: '', years: 1 });

  // Enabled Action
  const [enabledAction, setEnabledAction] = useState(false);

  // Router, notification, and path
  const router = useRouter();
  const { notify } = useNotification();
  const pathname = usePathname();

  const messageType: MessageType = action;
  const { description, label } = msgTypeConfig[messageType];
  // Get the trust deposit value for the message type
  const { value, errorTrustDepositValue } = useTrustDepositValue(messageType);

  // Custom hook to fetch user's account/trust deposit data
  const { accountData, errorAccountData } = useTrustDepositAccountData();

  // Show notification if there is an error fetching trust deposit value or account data
  useEffect(() => {
    if (errorTrustDepositValue && !errorNotified) {
      (async () => {
        await notify(errorTrustDepositValue, 'error', 'Error fetching trust deposit cost');
        setErrorNotified(true);
        router.push('/did');
      })();
    }
    if (errorAccountData && !errorNotified) {
      (async () => {
        await notify(errorAccountData, 'error', 'Error fetching account balance');
        setErrorNotified(true);
        router.push('/did');
      })();
    }
  }, [errorAccountData, errorTrustDepositValue, router, errorNotified]);

  // Get fee and amount in VNA
  const { fee, amountVNA } = useCalculateFee(messageType);

  // Local state to store the total required value for action (deposit + fee)
  const [totalValue, setTotalValue] = useState<string>("0.00");

  useEffect(() => {
    // Calculate deposit and total required value
    let deposit = Number(value || 0);
    if (messageType === "MsgAddDID" || messageType === "MsgRenewDID") {
      deposit = deposit * Number(form.years || 1);
    }
    const feeAmount = Number(amountVNA || 0);
    setTotalValue((deposit + feeAmount).toFixed(6));
    const availableBalance = accountData.balance ? Number(accountData.balance)/ 1_000_000 : 0;
    const availableReclaimable = (accountData.reclaimable) ? Number(accountData.reclaimable)/ 1_000_000 : 0;
    const hasEnoughBalance = 
      (availableBalance >= feeAmount) &&
      ( ( availableReclaimable + availableBalance - feeAmount) >= deposit );
    const didRequired = messageType === 'MsgAddDID' ? !!form.did.trim() : true;
    setEnabledAction(hasEnoughBalance && didRequired);
  }, [value, form.years, form.did, amountVNA, messageType, accountData.balance, accountData.reclaimable]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'years' ? Number(value) : value }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require wallet connection
    if (!isWalletConnected || !address) {
      notify('Connect wallet', 'error');
      return;
    }

    // Validate form inputs
    const { did, years } = form;
    if (action === 'MsgAddDID' && !did) {
      notify('Enter valid DID', 'error');
      return;
    }
    if ((action === 'MsgAddDID' || action === 'MsgRenewDID') && years < 1) {
      notify('Enter valid years', 'error');
      return;
    }

    // Determine DID to operate on
    const didPayLoad = (id && action !== "MsgAddDID") ? id : did;

    // Show progress notification
    let notifyPromise: Promise<void> = notify(
      MSG_INPROGRESS_ACTION_DID[action](didPayLoad),
      'inProgress',
      'Transaction in progress'
    );

    let success = false;
    try {
      // Build message for the action
      const basePayload = { creator: address, did: didPayLoad };
      const fullPayload = { ...basePayload, years };
      let msgAny: MsgAny;

      switch (action) {
        case 'MsgAddDID':
          msgAny = { typeUrl: '/verana.dd.v1.MsgAddDID', value: MsgAddDID.fromPartial(fullPayload) };
          break;
        case 'MsgRenewDID':
          msgAny = { typeUrl: '/verana.dd.v1.MsgRenewDID', value: MsgRenewDID.fromPartial(fullPayload) };
          break;
        case 'MsgTouchDID':
          msgAny = { typeUrl: '/verana.dd.v1.MsgTouchDID', value: MsgTouchDID.fromPartial(basePayload) };
          break;
        case 'MsgRemoveDID':
          msgAny = { typeUrl: '/verana.dd.v1.MsgRemoveDID', value: MsgRemoveDID.fromPartial(basePayload) };
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      // Broadcast the transaction
      const res = await signAndBroadcast([msgAny], fee, action);

      // Handle broadcast result and notifications
      if (res.code === 0) {
        success = true;
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_DID[action](didPayLoad),
          'success',
          'Transaction successful'
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION_DID[action](didPayLoad, res.code, res.rawLog),
          'error',
          'Transaction failed'
        );
      }
    } catch (err) {
      notifyPromise = notify(
        MSG_ERROR_ACTION_DID[action](didPayLoad, undefined, err instanceof Error ? err.message : String(err)),
        'error',
        'Transaction failed'
      );
    } finally {
      // Wait for notification to close before continuing
      if (notifyPromise) await notifyPromise;

      // Redirect on success or fallback
      const didUrl = `/did/${encodeURIComponent(didPayLoad)}`;
      if ((action === 'MsgRenewDID' || action === 'MsgTouchDID' || action === 'MsgAddDID') && success) {
        if (pathname === didUrl) {
          router.push('/did');
          setTimeout(() => router.push(didUrl), 200);
        } else {
          router.push(didUrl);
        }
      } else {
        router.push('/did');
      }
    }
  };

  // UI: MsgAddDID includes DID input, MsgAddDID/MsgRenewDID include years select
  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-copy">
        <p>{description}</p>
      </div>
      {action === 'MsgAddDID' && (
        <div className="form-field">
          <label htmlFor="did" className="label">DID</label>
          <input
            name="did"
            value={form.did}
            onChange={handleChange}
            placeholder="did:method:identifier"
            className="input"
            type='text'
          />
        </div>
      )}
      {(action === 'MsgAddDID' || action === 'MsgRenewDID') && (
        <div>
          <label htmlFor="years" className="form-field">Years</label>
          <select
            id="years"
            name="years"
            value={form.years}
            onChange={handleChange}
            className="input"
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
      )}
      {totalValue && (
        <div className="form-copy">
          <p>
            {getCostMessage( msgTypeConfig[messageType].cost, totalValue, (data as DidData)?.deposit )}
          </p>
        </div>
      )}
      <button
        type="submit"
        disabled={!enabledAction}
        className="btn-action"
      >
        {label}
      </button>
    </form>
  );
}
