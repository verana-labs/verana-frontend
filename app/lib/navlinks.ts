import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import {
    Squares2X2Icon,
    ListBulletIcon,
    UserIcon,
    ShieldCheckIcon,
  } from '@heroicons/react/24/outline';

const links = [
  { name: resolveTranslatable({key: "dashboard.title"}, translate)??'Dashboard', href: '/dashboard', icon: Squares2X2Icon, 
    links: [{name: resolveTranslatable({key: "dashboard.stats.title"}, translate)??'Stats', href: '/dashboard/stats'},
            {name: resolveTranslatable({key: "dashboard.trending.title"}, translate)??'Trending', href: '/dashboard/trending'}]
  },
  { name: resolveTranslatable({key: "account.title"}, translate)??'Account', href: '/account', icon: UserIcon },
  { name: resolveTranslatable({key: "directory.title"}, translate)??'DID Directory', href: '/did', icon: ListBulletIcon },
  { name: resolveTranslatable({key: "trlist.title"}, translate)??'Trust Registries', href: '/tr', icon: ShieldCheckIcon }
];

export {links};