import { Section } from "@/ui/dataview/types";
import { faCoins, faPlus, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

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
  address: string | null;
  network: string | null;
  created: string | null;
  totalTransactions: number;
  trustRegistriesJoined: number;
  didsManaged: number;
}

// Sections configuration for AccountData
export const accountSections: Section<AccountData>[] = [
  {
    // name: t("dataview.account.sections.mainBalance"),
    // icon: CurrencyDollarIcon,
    cardView: true,
    largeTexts: true,
    fields: [
      { name: "balance", type: "data",
        label: t("dataview.account.fields.balance.label"), 
        description: t("dataview.account.fields.balance.desc"), 
        icon: faCoins,
        iconClass: "bg-gradient-to-br from-primary-500 to-primary-700",
        iconColorClass: "text-white text-xl",
        usdValue: true, hasStats: true
      },
      { name: "totalTrustDeposit", type: "data",
        label: t("dataview.account.fields.totalTrustDeposit.label"),
        description: t("dataview.account.fields.totalTrustDeposit.desc"),
        icon: faShieldHalved,
        iconClass: "bg-gradient-to-br from-blue-500 to-blue-700",
        iconColorClass: "text-white text-xl",
        usdValue: true, hasStats: true
      },
    ],
  },
  // {
  //   name: t("dataview.account.sections.trustDeposit"),
  //   icon: BanknotesIcon,
  //   fields: [
  //     { name: "claimableInterests", label: t("dataview.account.fields.claimableInterests"), type: "data" },
  //     { name: "reclaimable", label: t("dataview.account.fields.reclaimable"), type: "data" },
  //     { name: "message", label: t("dataview.account.fields.message"), type: "data" },
  //   ],
  // },
  // {
  //   type: "help",
  //   help: [
  //     t("dataview.account.help.available"),
  //     t("dataview.account.help.trustDeposit"),
  //     t("dataview.account.help.claimableInterests"),
  //     t("dataview.account.help.reclaimable"),
  //   ],
  //   name: t("dataview.account.sections.aboutBalances"),
  //   icon: InformationCircleIcon,
  //   fields: [],
  // },
  {
    type: "actions",
    name: t("dataview.account.sections.accountActions"),
    fields: [
      { name: "getVNA", label: t("dataview.account.actions.getVNA.label"), type: "action",
        description: t("dataview.account.actions.getVNA.desc"), 
        icon: faPlus,
        iconClass: "bg-gradient-to-br from-green-500 to-green-700",
        iconColorClass: "text-white"
      },
      { name: "claimInterests", label: t("dataview.account.actions.claimInterests.label"), type: "action",
        description: t("dataview.account.actions.claimInterests.desc"), 
        icon: faCoins,
        iconClass: "bg-gradient-to-br from-orange-500 to-orange-700",
        iconColorClass: "text-white"
      },
      // { name: "reclaimDeposit", label: t("dataview.account.actions.reclaimDeposit"), type: "action" }
    ],
  },
  {
    name: t("dataview.account.sections.accountInformation"),
    fields: [
      { name: "address", type: "data", label: t("dataview.account.fields.address") },
      { name: "totalTransactions", label: t("dataview.account.fields.totalTransactions"), type: "data" },
      { name: "network", label: t("dataview.account.fields.network"), type: "data",
        classField: "flex items-center space-x-2 px-3 py-1 bg-success-50 dark:bg-success-900/20 rounded-full w-fit", isHtml: true
       },
      { name: "trustRegistriesJoined", label: t("dataview.account.fields.trustRegistriesJoined"), type: "data" },
      { name: "created", label: t("dataview.account.fields.created"), type: "data" },
      { name: "didsManaged", label: t("dataview.account.fields.didsManaged"), type: "data" },
    ],
  },

];
