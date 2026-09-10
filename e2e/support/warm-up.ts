const ROUTES = [
  '/',
  '/dashboard',
  '/account',
  '/corporation',
  '/ecosystems',
  '/ecosystems/13',
  '/credential-schemas/26',
  '/participants/26',
  '/discover',
  '/join/13',
  '/pendingtasks',
]

export default async function warmUp() {
  const base = process.env.E2E_BASE_URL ?? 'http://localhost:3100'
  for (const route of ROUTES) {
    try {
      await fetch(`${base}${route}`, { signal: AbortSignal.timeout(120_000) })
    } catch {}
  }
}
