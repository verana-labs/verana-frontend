import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import langs from 'langs';

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

const PINNED_CODES = new Set(['en', 'es', 'fr', 'pt', 'zh', 'ar']);

const allSorted: LanguageOption[] = langs.all()
  .filter((l: { "1": string }) => l["1"])
  .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
  .map((l: { "1": string; local: string; name: string }) => ({
    value: l["1"],
    label: `${l.local} — ${l.name} (${l["1"]})`,
  }));

export const languageOptions: LanguageOption[] = allSorted
  .map((o) => ({ ...o, pinned: PINNED_CODES.has(o.value)}))
  .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

export function getLabelByValue(value?: string): string {
  if (!value) return "";
  const lang = langs.where('1', value);
  if (!lang) return value;
  return `${lang.local} — ${lang.name} (${lang["1"]})`;
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
