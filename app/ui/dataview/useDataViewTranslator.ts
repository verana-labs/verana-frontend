import { useCallback, useEffect, useState } from "react";

import enMessages from "@/i18n/dataview/en.json";
import esMessages from "@/i18n/dataview/es.json";
import type { I18nValues, Translator } from "./types";

type SupportedLocale = "en" | "es";

const TRANSLATIONS: Record<SupportedLocale, Record<string, string>> = {
  en: enMessages as Record<string, string>,
  es: esMessages as Record<string, string>,
};

const FALLBACK_LOCALE: SupportedLocale = "en";

function normalizeLocale(locale?: string | null): SupportedLocale {
  if (!locale) return FALLBACK_LOCALE;
  const lower = locale.toLowerCase();
  if (lower.startsWith("es")) return "es";
  return FALLBACK_LOCALE;
}

function formatMessage(message: string, values?: I18nValues): string {
  if (!values) return message;
  return message.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = values[key];
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

export function useDataViewTranslator(localeOverride?: string): Translator {
  const [locale, setLocale] = useState<SupportedLocale>(() =>
    normalizeLocale(localeOverride)
  );

  useEffect(() => {
    if (localeOverride) {
      const normalized = normalizeLocale(localeOverride);
      if (normalized !== locale) {
        setLocale(normalized);
      }
      return;
    }
    if (typeof navigator !== "undefined") {
      const detected = normalizeLocale(navigator.language);
      if (detected !== locale) {
        setLocale(detected);
      }
    }
  }, [localeOverride, locale]);

  return useCallback<Translator>(
    (key: string, values?: I18nValues) => {
      const bundle = TRANSLATIONS[locale] ?? TRANSLATIONS[FALLBACK_LOCALE];
      const fallbackBundle = TRANSLATIONS[FALLBACK_LOCALE];
      const template = bundle[key] ?? fallbackBundle[key] ?? key;
      return formatMessage(template, values);
    },
    [locale]
  );
}
