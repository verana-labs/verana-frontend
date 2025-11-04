import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import { faGaugeHigh, faCircleUser, faIdCard, faCompass, faShieldHalved, faTasks } from '@fortawesome/free-solid-svg-icons';
interface NavLink {
  name: string;
  href: string;
  icon: any;
  links?: NavLink[];
  className?: string;
}  
const links : NavLink[] = [
  { name: resolveTranslatable({key: "dashboard.title"}, translate)??'Dashboard', href: '/dashboard', icon: faGaugeHigh},
  { name: resolveTranslatable({key: "account.title"}, translate)??'Account', href: '/account', icon: faCircleUser },
  { name: resolveTranslatable({key: "directory.title"}, translate)??'Manage DIDs', href: '/did', icon: faIdCard },
  { name: resolveTranslatable({key: "trlist.title"}, translate)??'My Ecosystems', href: '/tr', icon: faShieldHalved },
  { name: resolveTranslatable({key: "discover.title"}, translate)??'Discover & Join', href: '/discover', icon: faCompass },
  { name: resolveTranslatable({key: "task.title"}, translate)??'Pending Tasks', href: '/task', icon: faTasks, className: 'bg-red-500' }
];

export {links};