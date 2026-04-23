'use client';

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { shortenDID } from "@/util/util";

export type TrustRegistryBreadcrumbProps = {
  trId: string;
  trName: string;
  iconUrl?: string;
};

export default function TrustRegistryBreadcrumb({ trId, trName, iconUrl }: TrustRegistryBreadcrumbProps) {
  // MOCK (replace when indexer exposes real service/icon URL): deterministic dicebear seed
  const resolvedIconUrl = iconUrl ?? `https://api.dicebear.com/7.x/shapes/svg?seed=tr-${trId}`;

  return (
    <section className="mb-6">
      <Link
        href={`/tr/${trId}`}
        className="inline-flex items-center text-sm text-neutral-70 dark:text-neutral-70 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        <img
          src={resolvedIconUrl}
          alt="Trust Registry Icon"
          className="w-5 h-5 rounded mr-2"
        />
        <span className="font-medium">{shortenDID(trName)}</span>
      </Link>
    </section>
  );
}
