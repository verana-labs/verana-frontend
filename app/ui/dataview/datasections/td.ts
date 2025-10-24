import { CurrencyDollarIcon } from "@heroicons/react/24/outline";

import { Section } from "@/ui/dataview/types";

const t = (key: string) => ({ key });

//TD data
export interface TdData {
  claimedVNA?: number;
}

// Sections configuration for AccountData
export const tdSections: Section<TdData>[] = [
  {
    name: t("dataview.td.sections.main"),
    type: "basic",
    icon: CurrencyDollarIcon,
    fields: [
      {
        name: "claimedVNA",
        label: t("dataview.td.fields.claimedVNA"),
        type: "data",
        inputType: "number",
        show: "edit",
        required: true,
        update: true,
        validation: { type: "Long", greaterThan: 0 },
      },
    ],
  },
];
