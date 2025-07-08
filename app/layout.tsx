import '@/app/ui/global.css';
import { inter, lusitana } from '@/app/ui/common/fonts'
import "@interchain-ui/react/styles";
import NavBar from '@/app/ui/common/nav-bar';
import SideNav from '@/app/ui/common/sidenav';
import Providers from '@/app/providers';

export const metadata = { title: 'Verana Front', description: 'Verana Front' }

export default function RootLayout({ children }: { children: React.ReactNode; }) {
                      
  return (
    <html lang="en" className={`${inter.variable} ${lusitana.variable}`}>
      <body className='antialiased bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border font-sans text-black text-sm dark:text-white'>
        <Providers>
          <div className="w-full" >
            <NavBar />
            <div className="relative flex h-screen flex-col md:flex-row md:overflow-hidden">
              <aside className="w-full flex-none md:w-64">
                <SideNav />
              </aside>
              <main className="flex-grow p-6 md:overflow-y-auto md:p-12">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
