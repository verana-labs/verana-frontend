import { BanknotesIcon, CurrencyDollarIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

import { Section } from "@/ui/dataview/types";

const t = (key: string) => ({ key });

//Account data
export interface AccountData {
  balance: string | null;
  totalTrustDeposit: string | null;
  claimableInterests: string | null;
  reclaimable: string | null;
  message: string | null;
  getVNA?: string; // action type
  claimInterests?: string; // action type
  reclaimDeposit?: string; // action type
}

// Sections configuration for AccountData
export const accountSections: Section<AccountData>[] = [
  {
    name: t("dataview.account.sections.mainBalance"),
    icon: CurrencyDollarIcon,
    fields: [
      { name: "balance", label: t("dataview.account.fields.balance"), type: "data" },
      { name: "getVNA", label: t("dataview.account.actions.getVNA"), type: "action" },
    ],
  },
  {
    name: t("dataview.account.sections.trustDeposit"),
    icon: BanknotesIcon,
    fields: [
      { name: "totalTrustDeposit", label: t("dataview.account.fields.totalTrustDeposit"), type: "data" },
      { name: "claimableInterests", label: t("dataview.account.fields.claimableInterests"), type: "data" },
      { name: "reclaimable", label: t("dataview.account.fields.reclaimable"), type: "data" },
      { name: "message", label: t("dataview.account.fields.message"), type: "data" },
      { name: "claimInterests", label: t("dataview.account.actions.claimInterests"), type: "action" },
      { name: "reclaimDeposit", label: t("dataview.account.actions.reclaimDeposit"), type: "action" },
    ],
  },
  {
    type: "help",
    help: [
      t("dataview.account.help.available"),
      t("dataview.account.help.trustDeposit"),
      t("dataview.account.help.claimableInterests"),
      t("dataview.account.help.reclaimable"),
    ],
    name: t("dataview.account.sections.aboutBalances"),
    icon: InformationCircleIcon,
    fields: [],
  },
];
