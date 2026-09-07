import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import ServiceIdentity from './service-identity'

export type EcosystemBreadcrumbProps = {
  ecosystemId: string
  ecosystemDid: string
}

export default function EcosystemBreadcrumb({ ecosystemId, ecosystemDid }: EcosystemBreadcrumbProps) {
  return (
    <section className="mb-6">
      <Link
        href={`/ecosystems/${ecosystemId}`}
        className="inline-flex items-center text-sm text-neutral-70 dark:text-neutral-70 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        <ServiceIdentity did={ecosystemDid} showFlag={false} showTrust={false} />
      </Link>
    </section>
  )
}
