import NavLinks from '@/app/ui/common/nav-links';

export default function SideNav() {
  return (
    <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-1">
      <NavLinks />
      <div className="hidden h-auto w-full grow rounded-md md:block"></div>
    </div>
  );
}
