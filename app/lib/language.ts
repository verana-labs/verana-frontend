import { useEffect, useSyncExternalStore } from 'react'
import { logger } from '@/lib/logger'

export type LanguageOption = { value: string; label: string; pinned?: boolean }

export function canonicalizeLanguageTag(tag: string): string {
  if (!tag) return tag
  try {
    return new Intl.Locale(tag).toString()
  } catch {
    return tag
  }
}

type LanguageData = {
  options: LanguageOption[]
  labelByValue: Map<string, string>
}

const EMPTY_OPTIONS: LanguageOption[] = []
const EMPTY_LABEL_MAP: Map<string, string> = new Map()

let cache: LanguageData | null = null
let inflight: Promise<unknown> | null = null
let loadFailed = false
let version = 0

const listeners = new Set<() => void>()

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot(): number {
  return version
}

function getServerSnapshot(): number {
  return 0
}

function notify(): void {
  version += 1
  for (const cb of listeners) cb()
}

function startLoad(): void {
  if (inflight) return
  inflight = fetch('/api/language-options')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load language options: ${res.status}`)
      return res.json() as Promise<LanguageOption[]>
    })
    .then((options) => {
      cache = { options, labelByValue: new Map(options.map((opt) => [opt.value, opt.label])) }
      loadFailed = false
      notify()
      return cache
    })
    .catch((err) => {
      inflight = null
      loadFailed = true
      notify()
      logger.error('Failed to load language options', err)
    })
}

function retryLoad(): void {
  if (cache) return
  loadFailed = false
  startLoad()
  notify()
}

export type LanguageDataState = {
  options: LanguageOption[]
  labelByValue: Map<string, string>
  loadFailed: boolean
  retry: () => void
}

export function useLanguageData(): LanguageDataState {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (!cache && !inflight) startLoad()
  }, [])

  return {
    options: cache?.options ?? EMPTY_OPTIONS,
    labelByValue: cache?.labelByValue ?? EMPTY_LABEL_MAP,
    loadFailed,
    retry: retryLoad,
  }
}

export function getLanguageLabel(
  state: { labelByValue: Map<string, string>; loadFailed: boolean },
  value: string | undefined
): string {
  if (!value) return ''
  const label = state.labelByValue.get(value) ?? state.labelByValue.get(canonicalizeLanguageTag(value))
  if (label !== undefined) return label
  return state.loadFailed ? value : ''
}

export function useLanguageLabel(value?: string): string {
  const state = useLanguageData()
  return getLanguageLabel(state, value)
}
