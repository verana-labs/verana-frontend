'use client';

import { useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { MessageType } from '@/app/constants/msgTypeConfig';

/**
 * Returns the correct REST endpoint with /params appended, based on the message type.
 */
function getEndpoint(messageType: MessageType) {
  if ( messageType === 'MsgAddDID' || messageType === 'MsgRenewDID') {
    const base = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID') ||
                process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID;
    return base ? `${base}/params` : undefined;
  } 
  if (messageType === 'MsgCreateTrustRegistry') {
    const base = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY') ||
                 process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY;
    return base ? `${base}/params` : undefined;
  }
  if (messageType === 'MsgReclaimTrustDeposit') {
    const base = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_DEPOSIT') ||
                 process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_DEPOSIT;
    return base ? `${base}/params` : undefined;
  } 
  if (messageType === 'MsgCreateCredentialSchema') {
    const base = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA') ||
                 process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA;
    return base ? `${base}/params` : undefined;
  }
  return undefined;
}

/**
 * Custom hook to fetch the trust deposit value depending on the message type.
 * - For MsgAddDID and MsgRenewDID, returns 'did_directory_trust_deposit'.
 * - For MsgCreateTrustRegistry, returns 'trust_registry_trust_deposit'.
 */
export function useTrustDepositValue(messageType: MessageType) {
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorTrustDepositValue, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !messageType ||
      !['MsgAddDID', 'MsgRenewDID', 'MsgCreateTrustRegistry', 'MsgReclaimTrustDeposit', 'MsgCreateCredentialSchema'].includes(messageType)
    ) return;

    const endpoint = getEndpoint(messageType);
    if (!endpoint) {
      setError('Endpoint not configured in environment variables');
      setValue(null);
      return;
    }

    setLoading(true);
    setError(null);

    // To avoid setting state from previous fetch if messageType changes
    let cancelled = false;

    fetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then(json => {
        if (cancelled) return;
        if ( messageType === 'MsgAddDID' || messageType === 'MsgRenewDID') {
          const deposit = json?.params?.did_directory_trust_deposit;
          if (deposit !== undefined) {
            setValue(deposit);
          } else {
            setError('Parameter did_directory_trust_deposit not found');
          }
        } else if (messageType === 'MsgCreateTrustRegistry') {
          const deposit = json?.params?.trust_registry_trust_deposit;
          if (deposit !== undefined) {
            setValue(deposit);
          } else {
            setError('Parameter trust_registry_trust_deposit not found');
          }
        } else if (messageType === 'MsgReclaimTrustDeposit') {
          const reclaimBurnRate = json?.params?.trust_deposit_reclaim_burn_rate;
          if (reclaimBurnRate !== undefined) {
            setValue(Number(reclaimBurnRate));
          } else {
            setError('Parameter trust_deposit_reclaim_burn_rate not found');
          }
        } else if (messageType === 'MsgCreateCredentialSchema') {
          const deposit = json?.params?.credential_schema_trust_deposit;
          if (deposit !== undefined) {
            setValue(Number(deposit));
          } else {
            setError('Parameter credential_schema_trust_deposit not found');
          }
        }
      })
      .catch(err => {
        if (!cancelled) setError(err?.message ?? 'Error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Cleanup function to avoid race conditions
    return () => { cancelled = true };
  }, [messageType]);

  // Return the trust deposit value, loading, and error state
  return { value, loading, errorTrustDepositValue };
}
