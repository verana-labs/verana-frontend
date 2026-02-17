import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import { faGaugeHigh, faCircleUser, faIdCard, faCompass, faShieldHalved, faTasks, IconDefinition } from '@fortawesome/free-solid-svg-icons';
interface NavLink {
  name: string;
  href: string;
  icon: IconDefinition;
  iconClass?: string;
  links?: NavLink[];
  className?: string;
  featuredService?: boolean;
  description?: string;
  availableOffline?: boolean;
}  
const links : NavLink[] = [
  { name: resolveTranslatable({key: "dashboard.title"}, translate)??'Dashboard', href: '/dashboard', icon: faGaugeHigh, availableOffline: true},
  { name: resolveTranslatable({key: "account.title"}, translate)??'Account', href: '/account', icon: faCircleUser },
  /* { name: resolveTranslatable({key: "directory.title"}, translate)??'Manage DIDs', href: '/did',
    icon: faIdCard,
    iconClass: "bg-gradient-to-br from-purple-500 to-purple-700 text-white",
    featuredService: true, description: resolveTranslatable({key: "directory.description"}, translate) }, */
  { name: resolveTranslatable({key: "trlist.title"}, translate)??'My Ecosystems', href: '/tr',
    icon: faShieldHalved,
    iconClass: "bg-gradient-to-br from-orange-500 to-orange-700 text-white",
    featuredService: true, description: resolveTranslatable({key: "trlist.description"}, translate) },
  { name: resolveTranslatable({key: "discover.title"}, translate)??'Discover & Join', href: '/discover',
    icon: faCompass,
    iconClass: "bg-gradient-to-br from-blue-500 to-blue-700 text-white",
    featuredService: true, description: resolveTranslatable({key: "discover.description"}, translate),
    availableOffline: true },
  { name: resolveTranslatable({key: "task.title"}, translate)??'Pending Tasks', href: '/pendingtasks', icon: faTasks, className: 'bg-red-500' }
];

export {links};