import {
    Squares2X2Icon,
    ListBulletIcon,
    UserIcon,
    ShieldCheckIcon,
  } from '@heroicons/react/24/outline';

const links = [
  { name: 'Dashboard', href: '/', icon: Squares2X2Icon, links: [{name: 'Stats', href: '/stats'}, {name: 'Trending', href: '/trending'}] },  
  { name: 'Account', href: '/account', icon: UserIcon },
  { name: 'DID Directory', href: '/did', icon: ListBulletIcon },
  { name: 'Trust Registries', href: '/tr', icon: ShieldCheckIcon }
];

export {links};