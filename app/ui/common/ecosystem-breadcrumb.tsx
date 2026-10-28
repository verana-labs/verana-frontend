import { ArrowLeftIcon } from 'lucide-react'
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
        className="-ml-2 inline-flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeftIcon className="size-4 shrink-0" aria-hidden="true" />
        <ServiceIdentity did={ecosystemDid} showFlag={false} showTrust={false} />
      </Link>
    </section>
  )
}
