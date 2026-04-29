'use client';

import { useCallback, useEffect, useState } from 'react';
import { DidEnrichment, fetchDidEnrichment, invalidateDid } from '@/lib/resolverClient';

interface UseDidTrustEnrichmentResult {
  data: DidEnrichment | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface State {
  data: DidEnrichment | null;
  loading: boolean;
  error: string | null;
}

const INITIAL: State = { data: null, loading: false, error: null };

export function useDidTrustEnrichment(did: string | undefined): UseDidTrustEnrichmentResult {
  const [state, setState] = useState<State>(INITIAL);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!did) {
      setState(INITIAL);
      return;
    }

    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    fetchDidEnrichment(did)
      .then((data) => {
        if (cancelled) return;
        setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ data: null, loading: false, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [did, reloadToken]);

  const refetch = useCallback(() => {
    if (did) invalidateDid(did);
    setReloadToken((token) => token + 1);
  }, [did]);

  return { ...state, refetch };
}
