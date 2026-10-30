import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { getNavLinks } from '@/lib/navlinks'
import { cn } from '@/lib/utils'
import { interactiveCard } from '@/ui/motion/interaction'
import { resolveTranslatable } from '../dataview/types'

type FeaturedServicesProps = {
  isWalletConnected: boolean
  hasCorporation: boolean | undefined
  className?: string
}

export default function FeaturedServices({ isWalletConnected, hasCorporation, className }: FeaturedServicesProps) {
  const links = getNavLinks()
  const available = (link: { availableOffline?: boolean; requiresCorporation?: boolean }) =>
    link.availableOffline === true || (isWalletConnected && (!link.requiresCorporation || hasCorporation))

  return (
    <section aria-labelledby="featured-services-title" className={cn('flex flex-col gap-3', className)}>
      <h2 id="featured-services-title" className="px-1 text-sm font-medium text-muted-foreground">
        {resolveTranslatable({ key: 'featuredservices.title' }, translate)}
      </h2>
      <ul className="grid flex-1 grid-cols-1 gap-4 @xl/page:grid-cols-2 @5xl/page:grid-cols-1">
        {links
          .filter((link) => link.featuredService === true)
          .map((link) => {
            const open = available(link)
            const reason =
              !isWalletConnected || hasCorporation === false
                ? resolveTranslatable(
                    {
                      key: isWalletConnected
                        ? 'featuredservices.corporationrequired'
                        : 'featuredservices.connectrequired',
                    },
                    translate
                  )
                : null
            return (
              <li key={link.href} className="h-full">
                <div
                  className={cn(
                    'group relative flex h-full flex-col gap-3 rounded-xl bg-card p-4 shadow-card',
                    open && interactiveCard,
                    open && 'focus-within:ring-[3px] focus-within:ring-ring/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FontAwesomeIcon icon={link.icon} aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-semibold">{link.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    {open ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
                        {resolveTranslatable({ key: 'featuredservices.available' }, translate)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{reason}</span>
                    )}
                    {open ? (
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
                      >
                        {resolveTranslatable({ key: 'featuredservices.explore' }, translate)?.replace(/\s*→$/, '')}
                        <ArrowRightIcon
                          aria-hidden="true"
                          className="size-4 transition-transform duration-(--duration-base) ease-standard group-hover:translate-x-0.5 rtl:rotate-180"
                        />
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="cursor-not-allowed text-sm font-medium text-muted-foreground"
                      >
                        {resolveTranslatable({ key: 'featuredservices.explore' }, translate)?.replace(/\s*→$/, '')}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
      </ul>
    </section>
  )
}
