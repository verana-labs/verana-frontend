'use client'

import { useCSList } from "@/hooks/useCredentialSchemas";
import { useTrustRegistries } from "@/hooks/useTrustRegistries";
import { translate } from "@/i18n/dataview";
import CsCard from "@/ui/common/cs-card";
import { useNotification } from "@/ui/common/notification-provider";
import TitleAndButton from "@/ui/common/title-and-button";
import { CsList } from "@/ui/datatable/columnslist/cs";
import { resolveTranslatable } from "@/ui/dataview/types";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCoins, faFileContract, faHandshake, faScaleBalanced, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { formatVNA } from "@/util/util";
import Link from "next/link";

// function roleClasses(role: string): string {
//   switch (role) {
//     case "ISSUER":
//       return "bg-green-100 text-green-800";
//     case "VERIFIER":
//       return "bg-orange-100 text-orange-800";
//     case "HOLDER":
//       return "bg-pink-100 text-pink-800";
//     case "ECOSYSTEM":
//       return "bg-purple-100 text-purple-800";
//     case "GRANTOR":
//       return "bg-slate-100 text-slate-800";
//     case "ISSUER_GRANTOR":
//       return "bg-blue-100 text-blue-800";
//     case "VERIFIER_GRANTOR":
//       return "bg-slate-100 text-slate-800";
//     case "OPEN":
//       return "bg-green-100 text-green-800";
//     default:
//       return "bg-gray-100 text-gray-800";
//   }
// }

export default function DiscoverJoinPage() {

    const router = useRouter();
    const { trList, loading, errorTrList, refetch: fetchTrList } = useTrustRegistries(true);
    const { csList } = useCSList (undefined, true);
    const [errorNotified, setErrorNotified] = useState(false);
    // Notification context for showing error messages
    const { notify } = useNotification();

    const csByTrId = useMemo(() => {
        const map = new Map<string, CsList[]>();
        if (!csList) return map;
        for (const cs of csList) {
            const key = cs.trId;
            const arr = map.get(key);
            if (arr) arr.push(cs);
            else map.set(key, [cs]);
        }
        return map;
    }, [csList]);

    const ecosystems = useMemo(() => {
        if (!trList) return [];
        return trList.map((tr) => ({
            ...tr,
            csList: csByTrId.get(tr.id) ?? [],
        }))
        .sort((a, b) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const da = Number((a as any).deposit ?? (a as any).trustDeposit ?? 0); 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = Number((b as any).deposit ?? (b as any).trustDeposit ?? 0); 
          return db - da; // desc
        });
    }, [trList, csByTrId]);

    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
      const term = search.trim().toLowerCase(); 
      if (!term) return ecosystems;
      return ecosystems.filter((e) => e.did?.toLowerCase().includes(term));
    }, [search, ecosystems]);

    const onFilter = () => {
    };

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
      if (e.key === "Enter") onFilter();
    };

    const PAGE_SIZE = 5;
    const [page, setPage] = useState(1);

    const totalPages = useMemo(() => {
      return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    }, [filtered.length]);

    useEffect(() => {
      setPage((p) => Math.min(Math.max(1, p), totalPages));
    }, [totalPages]);

    const paginated = useMemo(() => {
      const start = (page - 1) * PAGE_SIZE;
      return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    useEffect(() => {
      setPage(1);
    }, [search]);

    useEffect(() => {
      document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
    }, [page]);

    // Refresh trList
    const [refresh, setRefresh] = useState<boolean>(false);
    useEffect(() => {
        if (!refresh) return;
        console.info('useEffect TrPage');
        (async () => {
        await fetchTrList();
        setRefresh(false);
        })();
    }, [refresh]);

    // Notify and redirect if there is an error fetching account data
    useEffect(() => {
        // Show a notification if an error occurred
        if (errorTrList && !errorNotified) {
        (async () => {
            await notify(errorTrList, 'error', resolveTranslatable({key: "error.fetch.tr.title"}, translate));
            setErrorNotified(true);
            router.push('/');
        })();
        }
    }, [errorTrList, router, errorNotified]);

    if (loading) return null; //(<p>{resolveTranslatable({ key: "loading.trlist" }, translate) ?? "Loading Discover..."}</p>);
  
  return (
    <>
       <TitleAndButton
         title={resolveTranslatable({key: "discover.title"}, translate)?? "Discover & Join"}
       />
        
      <section
        id="search-form"
        className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              id="search-input"
              placeholder={resolveTranslatable({key: "discover.search.placeholder"}, translate)}
              className="w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          {/* <button
            type="button"
            onClick={onFilter}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <i className="fas fa-filter mr-2" />
            Filter
          </button> */}
        </div>
      </section>

      <section id="ecosystem-list" className="space-y-6">
        {paginated.map((eco, idx) => {
          const egfUrl = eco.versions?.find((x) => x.version === eco.active_version)?.documents?.[0]?.url;
        return (
          <div
            key={eco.did + '-' + idx}
            className="ecosystem-card bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6"
            data-ecosystem-name={eco.did}
          >
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {eco.did}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-neutral-70 dark:text-neutral-70">
                    <span>
                      <FontAwesomeIcon className="mr-1" aria-hidden="true" icon={faFileContract} />
                      {eco.csList.length} {resolveTranslatable({key: "discover.cs.label"}, translate)}
                    </span>
                    <span>
                      <FontAwesomeIcon className="mr-1" aria-hidden="true" icon={faCoins} />
                      {resolveTranslatable({key: "discover.td.label"}, translate)} {formatVNA(eco.deposit)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {egfUrl && (
                <Link
                  href={egfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium"
                >
                  <FontAwesomeIcon className="mr-2" aria-hidden="true" icon={faScaleBalanced} />
                  {resolveTranslatable({key: "discover.btn.egf"}, translate)}
                </Link>
                )}

                <Link
                  href={`/tr/${eco.id}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
                >
                  <FontAwesomeIcon className="mr-2" aria-hidden="true" icon={faShieldHalved} />
                  {resolveTranslatable({key: "discover.btn.view"}, translate)} 
                </Link>

                <Link
                  href={`/join/${eco.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium"
                >
                  <FontAwesomeIcon className="mr-2" aria-hidden="true" icon={faHandshake} />
                  {resolveTranslatable({key: "discover.btn.join"}, translate)}
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {eco.csList.map((schema) => (
                <CsCard key={schema.id} cs={schema}/>
              ))}
            </div>
          </div>
        )})}
      </section>

      <section id="pagination" className="mt-8 flex justify-center">
        <nav className="inline-flex rounded-lg shadow-sm" aria-label="Pagination">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={[
              "px-3 py-2 text-sm font-medium bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-l-lg",
              page === 1
                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800",
            ].join(" ")}
            aria-label="Previous page"
          >
            <FontAwesomeIcon icon={faChevronLeft}/>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isActive = p === page;

            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-primary-600"
                    : "px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 hover:bg-gray-50 dark:hover:bg-gray-800"
                }
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={[
              "px-3 py-2 text-sm font-medium bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-r-lg",
              page === totalPages
                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800",
            ].join(" ")}
            aria-label="Next page"
          >
            <FontAwesomeIcon icon={faChevronRight}/>
          </button>
        </nav>
      </section>

    </>
  );
}