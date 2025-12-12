import en from "./en.json";
import es from "./es.json";
import type { Translator } from "@/ui/dataview/types";

type FlatDict = Record<string, string>;
export type Locale = "en" | "es";
type TemplateValues = Record<string, string | number | boolean | null | undefined>;

const DEFAULT_LOCALE: Locale = "en";

const dictionaries: Record<Locale, FlatDict> = {
  en: en as FlatDict,
  es: es as FlatDict,
};

function interpolate(template: string, values?: TemplateValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const value = values[k];
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

export function getDictionary(locale: Locale = DEFAULT_LOCALE): FlatDict {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

let currentLocale: Locale = DEFAULT_LOCALE;
export function setLocale(locale: Locale) { currentLocale = locale; }

export function translateWithLocale(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  values?: TemplateValues
): string {
  const dict = getDictionary(locale);
  const template = dict[key] ?? getDictionary(DEFAULT_LOCALE)[key] ?? key;
  return interpolate(template, values);
}

export function formatDictionaryValue(
  template: string,
  values?: TemplateValues
): string {
  return interpolate(template, values);
}

export const translate: Translator = (key, values) => {
  const dict = getDictionary(currentLocale);
  const template = dict[key] ?? getDictionary(DEFAULT_LOCALE)[key] ?? key;
  return interpolate(template, values);
};
