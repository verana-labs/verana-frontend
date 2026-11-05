import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { communityLinks, configFooter, footLinks, veranaLinks } from '@/lib/dashlinks'
import { cn } from '@/lib/utils'

const COMMUNITY_NAMES: Record<string, string> = {
  github: 'GitHub',
  'x-twitter': 'X',
  linkedin: 'LinkedIn',
  discord: 'Discord',
}

const LINK_CLASS =
  'rounded-sm text-sm text-muted-foreground transition-colors duration-(--duration-base) hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

export default function DashboardFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('border-t border-border pt-8', className)}>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-3 flex items-center gap-2.5">
            <img src={configFooter.img} alt={translate('navbar.logo.alt')} className="size-7" />
            <span className="text-lg font-semibold tracking-tight">{configFooter.title}</span>
          </div>
          <p className="mb-4 max-w-md text-sm text-muted-foreground">{configFooter.msg}</p>
          <ul className="flex gap-1">
            {communityLinks.map((link, idx) => {
              const name = COMMUNITY_NAMES[link.icon?.iconName ?? ''] ?? link.href
              return (
                <li key={`communityLink-${idx}`}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    title={name}
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-(--duration-base) hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <FontAwesomeIcon icon={link.icon ?? '0'} aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
        {footLinks.map((links, i) => (
          <div key={i}>
            <h2 className="mb-3 text-sm font-semibold">{links.title}</h2>
            <ul className="space-y-2">
              {links.links.map((link, j) => (
                <li key={`${i}-${j}`}>
                  <Link href={link.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
        <p className="text-xs text-muted-foreground">© {configFooter.copyright}</p>
        <ul className="flex gap-6">
          {veranaLinks.map((link, idx) => (
            <li key={`veranaLink-${idx}`}>
              <Link href={link.href} target="_blank" rel="noopener noreferrer" className={cn(LINK_CLASS, 'text-xs')}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
