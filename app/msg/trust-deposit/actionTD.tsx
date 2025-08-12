'use client';

import React, { useEffect, useState } from 'react';
import { useChain } from '@cosmos-kit/react';
import {
  MsgReclaimTrustDeposit,
  MsgReclaimTrustDepositYield,
} from '@/proto-codecs/codec/verana/td/v1/tx';
import { useRouter } from 'next/navigation';
import { useVeranaChain } from '@/app/hooks/useVeranaChain';
import { useNotification } from '@/app/ui/common/notification-provider';
import { getCostMessage, getDescriptionMessage, MessageType, msgTypeConfig } from '@/app/constants/msgTypeConfig';
import { MSG_ERROR_ACTION_TD, MSG_INPROGRESS_ACTION_TD, MSG_SUCCESS_ACTION_TD, MsgTypeTD } from '@/app/constants/notificationMsgForMsgType';
import { useCalculateFee } from '@/app/hooks/useCalculateFee';
import { AccountData } from '@/app/types/dataViewTypes';
import { parseVNA } from '@/app/util/util';
import { useTrustDepositValue } from '@/app/hooks/useTrustDepositValue';

// Define form state interface
interface FormState { claimed: number }
// Define ActionTD props interface
interface ActionTDProps {
  action: MsgTypeTD;  // Action type to perform (e.g. MsgReclaimTrustDeposit)
  setActiveActionId: React.Dispatch<React.SetStateAction<string | null>>; // Collapse/hide action on cancel
  data: object;       // Data for the account, e.g. balances
}

export default function ActionTD({ action, setActiveActionId, data }: ActionTDProps) {
  // Read description and label for the current message type (for UI display)
  const messageType: MessageType = action;
  const accountData: AccountData = data as AccountData;
  const { description, label } = msgTypeConfig[messageType];  

  // Get the trust deposit value for the message type
  const { value, errorTrustDepositValue } = useTrustDepositValue(messageType);
  // Calculate the transaction fee for this message type
  const { fee, amountVNA } = useCalculateFee(messageType);

  // Cosmos wallet and chain context
  const veranaChain = useVeranaChain();
  const { address, signAndBroadcast, isWalletConnected } = useChain(veranaChain.chain_name);

  // Local state for the form (amount claimed)
  const [form, setForm] = useState<FormState>({ claimed: 0 });
  // State for submission process (submitting), and enabling/disabling action button
  const [submitting, setSubmitting] = useState(false);
  const [enabledAction, setEnabledAction] = useState(false);
  const [errorNotified, setErrorNotified] = useState(false);

  // Navigation and notification context
  const router = useRouter();
  const { notify } = useNotification();
  let notifyPromise: Promise<void> | undefined;

  // Reclaimable balance burn rate
  const [burnRate, setBurnRate] = useState<number>(0.00);

  // Local state to store the total required value for action (deposit + fee)
  const [totalValue, setTotalValue] = useState<string>("0.00");
  const [hasEnoughBalance, setHasEnoughBalance] = useState<boolean>(false);

  // Show notification if there is an error fetching trust deposit value or account data
  useEffect(() => {
    if (errorTrustDepositValue && !errorNotified) {
      (async () => {
        await notify(errorTrustDepositValue, 'error', 'Error fetching trust deposit cost');
        setErrorNotified(true);
        router.push('/did');
      })();
    }
  }, [ errorTrustDepositValue, notify, router, errorNotified]);

  // Update burnRate percentage as soon as 'value' from the trust deposit hook changes.
  useEffect(() => {
    if (value) {
      setBurnRate(Number(value) * 100);
    }
  }, [value]); 

  // Calculate total required value
  useEffect(() => {
    const feeAmount = Number(amountVNA || 0);
    setTotalValue((feeAmount).toFixed(6));
    const availableBalance = accountData.balance ? Number(parseVNA(accountData.balance))/ 1_000_000 : 0;
    setHasEnoughBalance(availableBalance >= feeAmount);
  }, [amountVNA, messageType, accountData.balance]);

  useEffect(() => {
    const reclaimable = accountData.reclaimable ? Number(parseVNA(accountData.reclaimable))/ 1_000_000 : 0;
    const claimedRequired = messageType === 'MsgReclaimTrustDeposit' ? (Number(form.claimed) > 0 && (Number(form.claimed) <= reclaimable)) : true;
    setEnabledAction(hasEnoughBalance && claimedRequired);
  }, [form.claimed, hasEnoughBalance, accountData.reclaimable, messageType]);
  
  // Handler for input changes (numeric)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'claimed' ? Number(value) : value }));
  };

  // Handler for Cancel button - collapses/hides the action UI
  const handleCancel = () => {
    setActiveActionId(null);
  };

  // Handle form submission (trigger Cosmos transaction)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent if wallet not connected
    if (!isWalletConnected || !address) {
      notify('Connect wallet', 'error');
      return;
    }

    const { claimed } = form;

    // For MsgReclaimTrustDeposit, check that claimed > 1 (can adjust as needed)
    if (action === 'MsgReclaimTrustDeposit' && claimed <= 0) {
      notify('Enter valid claimed', 'error');
      return;
    }

    setSubmitting(true);

    // Notify that transaction is in progress
    notifyPromise = notify(
      MSG_INPROGRESS_ACTION_TD[action](),
      'inProgress',
      'Transaction in progress'
    );

    try {
      // Build transaction payload
      const basePayload = { creator: address };
      const fullPayload = { ...basePayload, claimed };
      let msgAny:
        | { typeUrl: '/verana.td.v1.MsgReclaimTrustDeposit'; value: MsgReclaimTrustDeposit }
        | { typeUrl: '/verana.td.v1.MsgReclaimTrustDepositYield'; value: MsgReclaimTrustDepositYield };

      // Select the message type and build its payload
      switch (action) {
        case 'MsgReclaimTrustDeposit':
          msgAny = {
            typeUrl: '/verana.td.v1.MsgReclaimTrustDeposit',
            value: MsgReclaimTrustDeposit.fromPartial(fullPayload),
          };
          break;
        case 'MsgReclaimTrustDepositYield':
          msgAny = {
            typeUrl: '/verana.td.v1.MsgReclaimTrustDepositYield',
            value: MsgReclaimTrustDepositYield.fromPartial(basePayload),
          };
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      // Sign and broadcast the transaction
      const res = await signAndBroadcast([msgAny], fee, action);

      // Notify on success or error (waits for notification to close)
      if (res.code === 0) {
        notifyPromise = notify(
          MSG_SUCCESS_ACTION_TD[action](claimed),
          'success',
          'Transaction successful'
        );
      } else {
        notifyPromise = notify(
          MSG_ERROR_ACTION_TD[action](res.code, res.rawLog),
          'error',
          'Transaction failed'
        );
      }
    } catch (err: unknown) {
      notifyPromise = notify(
        MSG_ERROR_ACTION_TD[action](undefined, err instanceof Error ? err.message : String(err)),
        'error',
        'Transaction failed'
      );
    } finally {
      // Wait for notification close, reset submitting state, collapse UI, and redirect
      if (notifyPromise) await notifyPromise;
      setSubmitting(false);
      handleCancel();
      router.push('/');
      setTimeout(() => router.push('/account'), 100);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      {/* Show description of the action */}
      <div className="form-copy">
        <p>
          { (messageType === 'MsgReclaimTrustDeposit' )? 
              getDescriptionMessage( msgTypeConfig[messageType].description, (100 - burnRate), burnRate )
              : description
            }
        </p>
      </div>
      {/* Only show claimed input for MsgReclaimTrustDeposit */}
      {action === 'MsgReclaimTrustDeposit' && (
        <div>
          <label htmlFor="claimed" className="label">
            Claimed
          </label>
          <input
            name="claimed"
            type="number"
            value={form.claimed}
            onChange={handleChange}
            placeholder="Claimed"
            className="input"
            min={1}
          />
        </div>
      )}
      {/* Show transaction cost (fee) */}
      {totalValue && (
        <div className="form-copy">
          <p>
            {getCostMessage( msgTypeConfig[messageType].cost, totalValue )}
          </p>
        </div>
      )}
      {/* Action buttons (Cancel and Confirm/label) */}
      <div className="text-center space-x-2">
        <button
          type="button"
          disabled={submitting}
          className="btn-action"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!enabledAction || submitting}
          className="btn-action"
        >
          {label}
        </button>
      </div>
    </form>
  );
}
