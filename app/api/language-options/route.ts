import availableLocalesData from 'cldr-core/availableLocales.json'
import defaultContentData from 'cldr-core/defaultContent.json'
import type { LanguageOption } from '@/lib/language'

export const dynamic = 'force-static'

const PINNED_CODES = ['en', 'en-US', 'es', 'es-419', 'fr', 'pt-BR', 'zh-Hans', 'ar']

// English names for ISO 639-3 tags that Node 22's ICU 77.1 does not ship.
const ENGLISH_OVERRIDES: Record<string, string> = {
  apc: 'Levantine Arabic',
  kek: "Q'eqchi'",
  lld: 'Ladin',
  mhn: 'Mòcheno',
  mww: 'Hmong Daw',
  skr: 'Saraiki',
  suz: 'Sunwar',
}

const UNDETERMINED_LANGUAGE_TAG = 'und'
const UNPINNED_RANK = Number.POSITIVE_INFINITY

const englishLanguages = new Intl.DisplayNames(['en'], { type: 'language', languageDisplay: 'standard' })
const englishRegions = new Intl.DisplayNames(['en'], { type: 'region' })
const englishScripts = new Intl.DisplayNames(['en'], { type: 'script' })

function capitalizeFirst(s: string): string {
  if (!s) return s
  const chars = Array.from(s)
  return chars[0].toUpperCase() + chars.slice(1).join('')
}

function englishLabel(loc: Intl.Locale): string | undefined {
  const rawBase = englishLanguages.of(loc.language)
  const base = rawBase && rawBase !== loc.language ? rawBase : ENGLISH_OVERRIDES[loc.language]
  if (!base) return undefined

  const qualifiers: string[] = []
  if (loc.script) {
    const name = englishScripts.of(loc.script)
    if (name && name !== loc.script) qualifiers.push(name)
  }
  if (loc.region) {
    const name = englishRegions.of(loc.region)
    if (name && name !== loc.region) qualifiers.push(name)
  }

  return qualifiers.length ? `${base} (${qualifiers.join(', ')})` : base
}

const autonymCache = new Map<string, string | undefined>()

function autonym(tag: string): string | undefined {
  if (autonymCache.has(tag)) return autonymCache.get(tag)
  let result: string | undefined
  try {
    const names = new Intl.DisplayNames([tag], { type: 'language', languageDisplay: 'standard' })
    const value = names.of(tag)
    result = value && value !== tag ? value : undefined
  } catch {
    result = undefined
  }
  autonymCache.set(tag, result)
  return result
}

let cached: LanguageOption[] | null = null

function buildLanguageOptions(): LanguageOption[] {
  const tags = [
    ...new Set([...availableLocalesData.availableLocales.full, ...defaultContentData.defaultContent, ...PINNED_CODES]),
  ].filter((tag) => tag !== UNDETERMINED_LANGUAGE_TAG)

  const pinnedRank = new Map(PINNED_CODES.map((code, i) => [code, i]))

  const unresolved: string[] = []
  const entries: { value: string; label: string; sortKey: string }[] = []

  for (const tag of tags) {
    let loc: Intl.Locale
    try {
      loc = new Intl.Locale(tag)
    } catch {
      unresolved.push(tag)
      continue
    }
    const english = englishLabel(loc)
    if (!english) {
      unresolved.push(tag)
      continue
    }
    const native = autonym(tag)
    const left = native ? capitalizeFirst(native) : undefined
    const label = left && !english.startsWith(left) ? `${left} — ${english} (${tag})` : `${english} (${tag})`
    entries.push({ value: tag, label, sortKey: english })
  }

  if (unresolved.length > 0) {
    throw new Error(
      `Unresolved language tags (no English name): ${unresolved.join(', ')}. Add entries to ENGLISH_OVERRIDES in app/api/language-options/route.ts.`
    )
  }

  entries.sort((a, b) => {
    const ra = pinnedRank.get(a.value) ?? UNPINNED_RANK
    const rb = pinnedRank.get(b.value) ?? UNPINNED_RANK
    if (ra !== rb) return ra - rb
    return a.sortKey.localeCompare(b.sortKey, 'en')
  })

  return entries.map(({ value, label }) => ({ value, label, pinned: pinnedRank.has(value) }))
}

export function GET() {
  cached ??= buildLanguageOptions()
  return Response.json(cached)
}
