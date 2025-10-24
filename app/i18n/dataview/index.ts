import en from "./en.json";
import es from "./es.json";
import type { Translator } from "@/ui/dataview/types";

type FlatDict = Record<string, string>;
type Locale = "en" | "es";

const dictionaries: Record<Locale, FlatDict> = {
  en: en as FlatDict,
  es: es as FlatDict,
};

let currentLocale: Locale = "en";
export function setLocale(locale: Locale) { currentLocale = locale; }

export const translate: Translator = (key, values) => {
  const dict = dictionaries[currentLocale];
  const template = dict[key] ?? key;

  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));
};