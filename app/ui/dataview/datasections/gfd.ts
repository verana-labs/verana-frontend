import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import availableLocalesData from 'cldr-core/availableLocales.json';
import defaultContentData from 'cldr-core/defaultContent.json';

import { Section } from "@/ui/dataview/types";

const t = (key: string) => ({ key });

//Governance Framework Document
export interface GfdData {
  creator: string;
  id: string;
  docLanguage: string;
  docUrl: string;
  version?: number;
}

export type LanguageOption = { value: string; label: string; pinned?: boolean };

// Tags promoted above the divider in the selector. Includes the spec-driven
// region variants (en-US, es-419) Fabrice requested.
const PINNED_CODES = ['en', 'en-US', 'es', 'es-419', 'fr', 'pt-BR', 'zh-Hans', 'ar'];
const PINNED_SET = new Set(PINNED_CODES);

// Authoritative BCP-47 locale set from Unicode CLDR (cldr-core, version-pinned).
// `defaultContent` supplies the default-content locales (e.g. en-US, pt-BR)
// that CLDR omits from `availableLocales.full` by design. The pinned codes are
// unioned in defensively so a pin can never silently drop.
const ALL_TAGS: string[] = Array.from(
  new Set<string>([
    ...availableLocalesData.availableLocales.full,
    ...defaultContentData.defaultContent,
    ...PINNED_CODES,
  ])
);

const englishNames = new Intl.DisplayNames(['en'], {
  type: 'language',
  languageDisplay: 'standard',
});

function capitalizeFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Canonical BCP-47 form, e.g. "en-us" -> "en-US". Falls back to the raw input
// for malformed/legacy tags so we never throw.
export function canonicalizeLanguageTag(tag: string): string {
  if (!tag) return tag;
  try {
    return new Intl.Locale(tag).toString();
  } catch {
    return tag;
  }
}

// Builds the display entry for a tag. `Intl.DisplayNames` returns the input
// tag unchanged when it cannot resolve a name; treat that as unresolved.
function buildEntry(tag: string): { value: string; label: string; sortKey: string } {
  let autonym: string | undefined;
  try {
    autonym = new Intl.DisplayNames([tag], {
      type: 'language',
      languageDisplay: 'standard',
    }).of(tag);
  } catch {
    autonym = undefined;
  }
  let english: string | undefined;
  try {
    english = englishNames.of(tag);
  } catch {
    english = undefined;
  }
  const resolvedAutonym = autonym && autonym !== tag ? autonym : undefined;
  const resolvedEnglish = english && english !== tag ? english : undefined;
  if (!resolvedAutonym && !resolvedEnglish) {
    return { value: tag, label: tag, sortKey: tag };
  }
  const left = capitalizeFirst(resolvedAutonym ?? resolvedEnglish ?? tag);
  const right = resolvedEnglish ?? left;
  return { value: tag, label: `${left} — ${right} (${tag})`, sortKey: resolvedEnglish ?? left };
}

const allSorted: LanguageOption[] = ALL_TAGS
  .map(buildEntry)
  .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  .map(({ value, label }) => ({ value, label }));

export const languageOptions: LanguageOption[] = allSorted
  .map((o) => ({ ...o, pinned: PINNED_SET.has(o.value) }))
  .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

export function getLabelByValue(value?: string): string {
  if (!value) return "";
  return buildEntry(canonicalizeLanguageTag(value)).label;
}

// Sections configuration for GfdData
export const gfdSections: Section<GfdData>[] = [
  {
    name: t("dataview.gfd.sections.main"),
    icon: ShieldCheckIcon,
    type: "basic",
    fields: [
      { name: "creator", label: t("dataview.gfd.fields.creator"), type: "data", show: "create", update: false, disabled: true },
      {
        name: "docLanguage",
        label: t("dataview.gfd.fields.docLanguage"),
        type: "data",
        inputType: "languageSelector",
        show: "create",
        required: true,
        update: true,
      },
      {
        name: "docUrl",
        label: t("dataview.gfd.fields.docUrl"),
        type: "data",
        show: "create",
        required: true,
        update: true,
        validation: { type: "URL" },
      },
    ],
  },
];
