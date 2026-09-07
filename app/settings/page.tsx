'use client'

import { VERANA_CHAIN_ID, VERANA_INDEXER_BASE_URL, VERANA_REST_ENDPOINT, VERANA_RPC_ENDPOINT } from '@/config/env'
import { isLocale, SUPPORTED_LOCALES, translate } from '@/i18n/dataview'
import { THEME_PREFERENCES } from '@/lib/preferences'
import { usePreferences } from '@/providers/preferences-provider'
import TitleAndButton from '@/ui/common/title-and-button'
import { Card, Fact, SectionTitle } from '@/ui/corporation/shared'

const NETWORK_FACTS = (
  [
    ['settings.network.chainid', VERANA_CHAIN_ID],
    ['settings.network.rpc', VERANA_RPC_ENDPOINT],
    ['settings.network.rest', VERANA_REST_ENDPOINT],
    ['settings.network.indexer', VERANA_INDEXER_BASE_URL],
  ] as const
).flatMap(([key, value]) => (value ? [{ key, value }] : []))

export default function SettingsPage() {
  const { locale, theme, setLocale, setTheme } = usePreferences()

  return (
    <>
      <TitleAndButton title={translate('settings.title')} description={[translate('settings.description')]} />

      <div className="space-y-6">
        <Card id="settings-locale">
          <SectionTitle>{translate('settings.locale.title')}</SectionTitle>
          <select
            id="settings-locale-select"
            aria-label={translate('settings.locale.title')}
            className="input mt-4 max-w-xs"
            value={locale}
            onChange={(event) => {
              if (isLocale(event.target.value)) setLocale(event.target.value)
            }}
          >
            {SUPPORTED_LOCALES.map((option) => (
              <option key={option} value={option}>
                {translate(`settings.locale.name.${option}`)}
              </option>
            ))}
          </select>
        </Card>

        <Card id="settings-theme">
          <SectionTitle>{translate('settings.theme.title')}</SectionTitle>
          <div role="radiogroup" aria-label={translate('settings.theme.title')} className="mt-4 flex flex-wrap gap-6">
            {THEME_PREFERENCES.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <input
                  type="radio"
                  name="theme"
                  value={option}
                  checked={theme === option}
                  onChange={() => setTheme(option)}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-surface border-neutral-20 dark:border-neutral-70 focus:ring-2 focus:ring-primary-500"
                />
                {translate(`settings.theme.${option}`)}
              </label>
            ))}
          </div>
        </Card>

        <Card id="settings-network">
          <SectionTitle>{translate('settings.network.title')}</SectionTitle>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {NETWORK_FACTS.map(({ key, value }) => (
              <Fact key={key} label={translate(key)} value={value} />
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
