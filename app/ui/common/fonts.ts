import { Inter, Lusitana, Kantumruy_Pro } from 'next/font/google';
 
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300','400','500','600','700'],
})
 
export const lusitana = Lusitana({
  subsets: ['latin'],
  variable: '--font-lusitana',
  weight: ['400','700'],
})

export const kantumruy = Kantumruy_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'], 
  variable: '--font-kantumruy',
  display: 'swap',
})