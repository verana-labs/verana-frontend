"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CsData } from "@/ui/dataview/datasections/cs";
import { useCsData } from "./useCredentialSchemaData";

type UseCsDataManyResult = {
  csDataList: CsData[];
  csDataById: Record<string, CsData>;
  loading: boolean;
  errorsById: Record<string, string>;
  refetchAll: () => void;
};

export function useCsDataMany(schemaIds: string[]): UseCsDataManyResult {
  const ids = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();

    for (const id of schemaIds) {
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }

    // Keep order stable to avoid unnecessary resets
    out.sort((a, b) => a.localeCompare(b));
    return out;
  }, [schemaIds]);

  const [idx, setIdx] = useState(0);
  const [csDataList, setCsDataList] = useState<CsData[]>([]);
  const [csDataById, setCsDataById] = useState<Record<string, CsData>>({});
  const [errorsById, setErrorsById] = useState<Record<string, string>>({});

  const idsKey = useMemo(() => ids.join("|"), [ids]);
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    setIdx(0);
    setCsDataList([]);
    setCsDataById({});
    setErrorsById({});
    seenRef.current = new Set<string>();
  }, [idsKey]);

  const currentId = ids[idx] ?? "";

  const hasData = !!csDataById[currentId];
  const hasError = !!errorsById[currentId];
  const enabled = !!currentId && !hasData && !hasError;

  const { csData, loading: loadingOne, errorCS } = useCsData(currentId);//, enabled);

  useEffect(() => {
    if (!currentId) return;

    // Skip fetching if already resolved
    if (!enabled) {
      setIdx((prev) => prev + 1);
      return;
    }

    if (csData) {
      const key = String(currentId);
      if (!seenRef.current.has(key)) {
        seenRef.current.add(key);
        setCsDataList((prev) => [...prev, csData]);
        setCsDataById((prev) => ({ ...prev, [key]: csData }));
      }
      setIdx((prev) => prev + 1);
      return;
    }

    if (errorCS && !loadingOne) {
      const key = String(currentId);
      setErrorsById((prev) => ({ ...prev, [key]: errorCS }));
      setIdx((prev) => prev + 1);
    }
  }, [csData, errorCS, loadingOne, currentId, enabled, csDataById, errorsById]);
  
  const loading = ids.length > 0 && (loadingOne || idx < ids.length);

  const refetchAll = () => {
    setIdx(0);
    setCsDataList([]);
    setCsDataById({});
    setErrorsById({});
    seenRef.current = new Set<string>();
  };

  return { csDataList, csDataById, loading, errorsById, refetchAll };
}