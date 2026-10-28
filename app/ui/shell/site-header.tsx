'use client'

import { SearchIcon, SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { configFooter } from '@/lib/dashlinks'
import { cn } from '@/lib/utils'
import { CorporationSelector } from '@/ui/common/corporation-selector'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/shadcn/breadcrumb'
import { Button } from '@/ui/shadcn/button'
import { Kbd, KbdGroup } from '@/ui/shadcn/kbd'
import { Separator } from '@/ui/shadcn/separator'
import { SidebarTrigger } from '@/ui/shadcn/sidebar'
import { ecosystemLabel, useCommandMenu, useModifierKeyLabel, useSearchableEntities } from '@/ui/shell/command-menu'
import { useNavItems } from '@/ui/shell/nav-items'
import { ThemeToggle } from '@/ui/shell/theme-toggle'

type Crumb = { label: string; href?: string }

const DETAIL_ROUTE = /^\/(ecosystems|credential-schemas|participants)\/([^/]+)$/

const NETWORK_TONE: Record<string, string> = {
  devnet: 'border-info/25 bg-info/10 text-info',
  testnet: 'border-warning/25 bg-warning/10 text-warning',
}

const NETWORK_DOT: Record<string, string> = {
  devnet: 'bg-info',
  testnet: 'bg-warning',
}

function useCrumbs(pathname: string | null): Crumb[] | null {
  const navItems = useNavItems()
  const { ecosystemsById, schemas } = useSearchableEntities()
  const match = pathname?.match(DETAIL_ROUTE)
  if (!match) return null

  const [, section, id] = match
  const rootItem =
    navItems.find((item) => item.url === '/ecosystems') ?? navItems.find((item) => item.url === '/discover')
  const crumbs: Crumb[] = rootItem ? [{ label: rootItem.title, href: rootItem.url }] : []

  if (section === 'ecosystems') {
    const ecosystem = ecosystemsById.get(id)
    crumbs.push({ label: ecosystem ? ecosystemLabel(ecosystem) : translate('meta.ecosystem.detail.title', { id }) })
    return crumbs
  }

  const schema = schemas.find((item) => item.id === id)
  const ecosystem = schema ? ecosystemsById.get(schema.ecosystemId) : undefined
  if (ecosystem) crumbs.push({ label: ecosystemLabel(ecosystem), href: `/ecosystems/${ecosystem.id}` })
  const schemaLabel = schema?.title || translate('meta.cs.detail.title', { id })

  if (section === 'credential-schemas') {
    crumbs.push({ label: schemaLabel })
    return crumbs
  }

  crumbs.push({ label: schemaLabel, href: `/credential-schemas/${id}` })
  crumbs.push({ label: translate('participants.title') })
  return crumbs
}

function HeaderBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumb aria-label={translate('shell.breadcrumb.label')} className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <Fragment key={`${crumb.href ?? 'page'}-${crumb.label}`}>
              <BreadcrumbItem className={cn('min-w-0', last ? '' : 'hidden md:inline-flex')}>
                {last || !crumb.href ? (
                  <BreadcrumbPage className="truncate font-medium">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="max-w-48 truncate">
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {last ? null : <BreadcrumbSeparator className="hidden md:block" />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function NetworkChip() {
  const veranaChain = useVeranaChain()
  const networkType = String(veranaChain.network_type ?? '')
  return (
    <span
      data-shell="network-chip"
      title={`${networkType} · ${veranaChain.chain_id}`}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2 font-mono text-xs font-medium',
        NETWORK_TONE[networkType] ?? 'border-success/25 bg-success/10 text-success'
      )}
    >
      <span
        aria-hidden="true"
        className={cn('pulse-dot relative size-1.5 rounded-full', NETWORK_DOT[networkType] ?? 'bg-success')}
      />
      <span className="hidden lg:inline">{veranaChain.chain_id}</span>
      <span className="font-sans lg:hidden">{networkType || veranaChain.chain_id}</span>
    </span>
  )
}

function SearchButton() {
  const { setOpen } = useCommandMenu()
  const modifier = useModifierKeyLabel()
  const label = translate('palette.open')
  return (
    <Button
      variant="outline"
      aria-label={label}
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => setOpen(true)}
      className="size-8 justify-center bg-background px-0 text-muted-foreground shadow-none md:w-44 md:justify-start md:px-2.5 xl:w-60"
    >
      <SearchIcon />
      <span className="hidden truncate font-normal md:inline">{label}</span>
      <KbdGroup className="ml-auto hidden md:inline-flex">
        <Kbd>{modifier}</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </Button>
  )
}

export function SiteHeader({ title }: { title?: string }) {
  const pathname = usePathname()
  const crumbs = useCrumbs(pathname)
  const settingsLabel = translate('navbar.settings.title')

  return (
    <header
      data-shell="header"
      className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 rounded-t-[inherit] border-b bg-page/90 backdrop-blur transition-[width,height] ease-linear"
    >
      <div className="flex w-full min-w-0 items-center gap-1.5 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 hidden md:inline-flex" aria-label={translate('shell.sidebar.toggle')} />
        <Link
          href={configFooter.href}
          aria-label={configFooter.title}
          className="-ml-0.5 shrink-0 rounded-md md:hidden"
        >
          <img src={configFooter.img} alt="" className="size-6" />
        </Link>
        {crumbs || title ? (
          <Separator orientation="vertical" className="mx-1 hidden data-[orientation=vertical]:h-4 md:block" />
        ) : null}
        {crumbs ? (
          <HeaderBreadcrumb crumbs={crumbs} />
        ) : title ? (
          <span className="min-w-0 truncate text-sm font-medium md:text-base">{title}</span>
        ) : null}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
          <SearchButton />
          <NetworkChip />
          <CorporationSelector />
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex">
            <Link href="/settings" aria-label={settingsLabel} title={settingsLabel}>
              <SettingsIcon />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
