import availableLocalesData from 'cldr-core/availableLocales.json'
import defaultContentData from 'cldr-core/defaultContent.json'
import type { LanguageOption } from '@/lib/language'

export const dynamic = 'force-static'

const PINNED_CODES = ['en', 'en-US', 'es', 'es-419', 'fr', 'pt-BR', 'zh-Hans', 'ar']

// cldr-localenames-full
const ENGLISH_LANGUAGE_OVERRIDES: Record<string, string> = {
  apc: 'Levantine Arabic',
  lld: 'Ladin',
  mhn: 'Mòcheno',
  mww: 'Hmong Daw',
  skr: 'Saraiki',
  suz: 'Sunwar',
}

const UNDETERMINED_LANGUAGE_TAG = 'und'
const UNPINNED_RANK = Number.POSITIVE_INFINITY

const { createRequire } = process.getBuiltinModule('node:module')
const { readFileSync, readdirSync } = process.getBuiltinModule('node:fs')
const { dirname, join } = process.getBuiltinModule('node:path')

type LocaleDisplayNames = {
  languages?: Record<string, string>
  territories?: Record<string, string>
  scripts?: Record<string, string>
}
type CldrNamesFile = { main: Record<string, { localeDisplayNames: LocaleDisplayNames }> }

// All cldr-localenames-full access is lazy: this module MUST NOT touch the
// filesystem at module scope. The route is force-static (the response is
// prerendered at build time, where node_modules is complete), but the runtime
// still loads this module on request; in the standalone/Docker output the CLDR
// data only exists because next.config.ts outputFileTracingIncludes copies it,
// and a module-scope crash would turn the prerendered route into a 500.
type CldrData = {
  cldrMain: string
  englishLanguages: Record<string, string>
  englishTerritories: Record<string, string>
  englishScripts: Record<string, string>
  availableLocaleDirs: Set<string>
  nativeLanguagesCache: Map<string, Record<string, string> | null>
}

let cldrData: CldrData | null = null

function readDisplayNames(cldrMain: string, locale: string, kind: keyof LocaleDisplayNames): Record<string, string> {
  const file = JSON.parse(readFileSync(join(cldrMain, locale, `${kind}.json`), 'utf8')) as CldrNamesFile
  return file.main[locale]?.localeDisplayNames[kind] ?? {}
}

function loadCldrData(): CldrData {
  if (cldrData) return cldrData
  const cldrRequire = createRequire(import.meta.url)
  const cldrMain = join(dirname(cldrRequire.resolve('cldr-localenames-full/package.json')), 'main')
  cldrData = {
    cldrMain,
    englishLanguages: readDisplayNames(cldrMain, 'en', 'languages'),
    englishTerritories: readDisplayNames(cldrMain, 'en', 'territories'),
    englishScripts: readDisplayNames(cldrMain, 'en', 'scripts'),
    availableLocaleDirs: new Set(readdirSync(cldrMain)),
    nativeLanguagesCache: new Map(),
  }
  return cldrData
}

function nativeLanguages(cldr: CldrData, dir: string): Record<string, string> | null {
  const cached = cldr.nativeLanguagesCache.get(dir)
  if (cached !== undefined) return cached
  let result: Record<string, string> | null = null
  try {
    result = readDisplayNames(cldr.cldrMain, dir, 'languages')
  } catch {
    result = null
  }
  cldr.nativeLanguagesCache.set(dir, result)
  return result
}

function capitalizeFirst(s: string): string {
  if (!s) return s
  const chars = Array.from(s)
  return chars[0].toUpperCase() + chars.slice(1).join('')
}

function englishLabel(cldr: CldrData, loc: Intl.Locale): string | undefined {
  const base = cldr.englishLanguages[loc.language] ?? ENGLISH_LANGUAGE_OVERRIDES[loc.language]
  if (!base) return undefined

  const qualifiers: string[] = []
  if (loc.script) {
    const name = cldr.englishScripts[loc.script]
    if (name) qualifiers.push(name)
  }
  if (loc.region) {
    const name = cldr.englishTerritories[loc.region]
    if (name) qualifiers.push(name)
  }

  return qualifiers.length ? `${base} (${qualifiers.join(', ')})` : base
}

function autonym(cldr: CldrData, loc: Intl.Locale): string | undefined {
  const scriptDir = loc.script ? `${loc.language}-${loc.script}` : undefined
  const candidates = [loc.baseName, scriptDir, loc.language].filter(
    (dir): dir is string => !!dir && cldr.availableLocaleDirs.has(dir)
  )
  for (const dir of candidates) {
    const languages = nativeLanguages(cldr, dir)
    if (!languages) continue
    const name = languages[loc.baseName] ?? (scriptDir ? languages[scriptDir] : undefined) ?? languages[loc.language]
    if (name) return name
  }
  return undefined
}

let cached: LanguageOption[] | null = null

function buildLanguageOptions(): LanguageOption[] {
  const cldr = loadCldrData()
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
    const english = englishLabel(cldr, loc)
    if (!english) {
      unresolved.push(tag)
      continue
    }
    const native = autonym(cldr, loc)
    const left = native ? capitalizeFirst(native) : undefined
    const label = left && !english.startsWith(left) ? `${left} — ${english} (${tag})` : `${english} (${tag})`
    entries.push({ value: tag, label, sortKey: english })
  }

  if (unresolved.length > 0) {
    throw new Error(
      `Unresolved language tags (no English name in cldr-localenames-full): ${unresolved.join(', ')}. Add entries to ENGLISH_LANGUAGE_OVERRIDES in app/api/language-options/route.ts.`
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
