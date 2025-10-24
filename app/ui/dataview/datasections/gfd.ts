import { ShieldCheckIcon } from "@heroicons/react/24/outline";

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

export const languageOptions = [
  { value: "en", label: t("dataview.gfd.fields.language.option.en") },
  { value: "es", label: t("dataview.gfd.fields.language.option.es") },
  { value: "fr", label: t("dataview.gfd.fields.language.option.fr") },
];

// Sections configuration for GfdData
export const gfdSections: Section<GfdData>[] = [
  {
    name: t("dataview.gfd.sections.main"),
    icon: ShieldCheckIcon,
    type: "basic",
    fields: [
      { name: "creator", label: t("dataview.gfd.fields.creator"), type: "data", show: "create", update: false },
      {
        name: "docLanguage",
        label: t("dataview.gfd.fields.docLanguage"),
        type: "data",
        inputType: "select",
        options: languageOptions,
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
