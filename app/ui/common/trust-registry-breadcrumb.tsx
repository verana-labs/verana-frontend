import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import ServiceIdentity from "./service-identity";

export type TrustRegistryBreadcrumbProps = {
  trId: string;
  trDid: string;
};

export default function TrustRegistryBreadcrumb({ trId, trDid }: TrustRegistryBreadcrumbProps) {
  return (
    <section className="mb-6">
      <Link
        href={`/tr/${trId}`}
        className="inline-flex items-center text-sm text-neutral-70 dark:text-neutral-70 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        <ServiceIdentity did={trDid} showFlag={false} showTrust={false} />
      </Link>
    </section>
  );
}
