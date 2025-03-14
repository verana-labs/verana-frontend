import SideNav from '@/app/ui/dashboard/sidenav';
import NavBar from '../ui/dashboard/nav-bar';
import NavBar2 from '../ui/dashboard/nav-bar-2';
 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full" >
      <NavBar2 />
      <div className="relative flex h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="w-full flex-none md:w-64">
          <SideNav />
        </div>
        <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
      </div>
    </div>
  );
}