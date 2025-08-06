'use client';

import NavLinks from '@/app/ui/common/nav-links';

export default function SideNav() {
  return (
    // <div class="w-60 flex flex-col justify-start items-start gap-8">
    <div className="flex flex-col justify-start items-start gap-8">
      {/* <div className="self-stretch relative flex flex-col justify-start items-start"> */}
      <div className="self-stretch relative flex flex-col justify-start items-start">
        <NavLinks />
      </div>
    </div>
  );
}
