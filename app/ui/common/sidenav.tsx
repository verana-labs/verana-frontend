'use client';

import NavLinks from '@/ui/common/nav-links';
import { Footer } from '@/ui/common/footer';

export default function SideNav() {
  return (
    <div className='sidenav-container'>
      <div className="sidenav-links h-full flex flex-col justify-between sticky top-0">
          <NavLinks />
          <Footer />
      </div>
    </div>
  );
}
