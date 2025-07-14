import {
    Squares2X2Icon,
    ListBulletIcon,
    UserIcon,
  } from '@heroicons/react/24/outline';

const links = [
  { name: 'Dashboard', href: '/', icon: Squares2X2Icon, links: [{name: 'Stats', href: '/stats'}, {name: 'Trending', href: '/trending'}] },  
  { name: 'Account', href: '/account', icon: UserIcon },
  { name: 'DID Directory', href: '/dids', icon: ListBulletIcon }
];

export {links};