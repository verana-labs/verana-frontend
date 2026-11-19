import { IBM_Plex_Mono, Inter, Kantumruy_Pro, Lusitana, Space_Grotesk } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
})

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '600', '700'],
})

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500'],
})

export const lusitana = Lusitana({
  subsets: ['latin'],
  variable: '--font-lusitana',
  weight: ['400', '700'],
})

export const kantumruy = Kantumruy_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-kantumruy',
  display: 'swap',
})
