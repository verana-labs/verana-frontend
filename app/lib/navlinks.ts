import {
  faCircleUser,
  faCompass,
  faFingerprint,
  faGaugeHigh,
  faShieldHalved,
  faTasks,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'

interface NavLink {
  name: string
  href: string
  icon: IconDefinition
  iconClass?: string
  links?: NavLink[]
  className?: string
  featuredService?: boolean
  description?: string
  availableOffline?: boolean
  count?: number
}

export function getNavLinks(pendingCount?: number): NavLink[] {
  return [
    {
      name: resolveTranslatable({ key: 'dashboard.title' }, translate) ?? 'Dashboard',
      href: '/dashboard',
      icon: faGaugeHigh,
      availableOffline: true,
    },
    {
      name: resolveTranslatable({ key: 'account.title' }, translate) ?? 'Account',
      href: '/account',
      icon: faCircleUser,
    },
    {
      name: resolveTranslatable({ key: 'digest.title' }, translate) ?? 'Digest Registry',
      href: '/digests',
      icon: faFingerprint,
      availableOffline: true,
    },
    {
      name: resolveTranslatable({ key: 'ecosystemList.title' }, translate) ?? 'My Ecosystems',
      href: '/ecosystems',
      icon: faShieldHalved,
      iconClass: 'bg-gradient-to-br from-orange-500 to-orange-700 text-white',
      featuredService: true,
      description: resolveTranslatable({ key: 'ecosystemList.description' }, translate),
    },
    {
      name: resolveTranslatable({ key: 'discover.title' }, translate) ?? 'Discover & Join',
      href: '/discover',
      icon: faCompass,
      iconClass: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white',
      featuredService: true,
      description: resolveTranslatable({ key: 'discover.description' }, translate),
      availableOffline: true,
    },
    {
      name: resolveTranslatable({ key: 'task.title' }, translate) ?? 'Pending Tasks',
      href: '/pendingtasks',
      icon: faTasks,
      className: 'bg-red-500',
      count: pendingCount,
    },
  ]
}

const offlineRoutesAllowed: (string | RegExp)[] = [
  '/dashboard',
  '/discover',
  '/digests',
  /^\/ecosystems\/[^/]+$/,
  /^\/credential-schemas\/[^/]+$/,
  /^\/participants\/[^/]+$/,
]

export function allowedOffline(pathname: string): boolean {
  return offlineRoutesAllowed.some((route) => (typeof route === 'string' ? route === pathname : route.test(pathname)))
}
