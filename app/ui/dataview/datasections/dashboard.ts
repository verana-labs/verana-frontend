import { Section } from "@/ui/dataview/types";
import { faCertificate, faCheck, faCoins, faCubes, faFileLines, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

const t = (key: string) => ({ key });

// API response from /verana/metrics/v1/all
export type GlobalMetrics = {
  participants: number;
  active_trust_registries: number;
  archived_trust_registries: number;
  active_schemas: number;
  archived_schemas: number;
  weight: number;
  issued: number;
  verified: number;
  ecosystem_slash_events: number;
  ecosystem_slashed_amount: number;
  ecosystem_slashed_amount_repaid: number;
  network_slash_events: number;
  network_slashed_amount: number;
  network_slashed_amount_repaid: number;
};

//Dashboard data
export interface DashboardData {
  chainName: string | null;
  blockHeight: string | null;
  status: string | null;
  isWalletConnected: string | null;
  address: string | null;
  walletPrettyName: string | null;
  ecosystems: string | null;
  schemas: string | null;
  totalLockedTrustDeposit: string | null;
  issuedCredentials: string | null;
  verifiedCredentials: string | null;
}

// Sections configuration for DashboardData
export const dashboardSections: Section<DashboardData>[] = [
  {
    // name: t("dataview.dashboard.sections.connectionDetails"),
    cardView: true,
    classFormEdit: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
    fields: [
      // { name: "chainName", label: t("dataview.dashboard.fields.chainName"), type: "data" },
      // { name: "status", label: t("dataview.dashboard.fields.status"), type: "data" },
      // { name: "isWalletConnected", label: t("dataview.dashboard.fields.isWalletConnected"), type: "data" },
      // { name: "address", label: t("dataview.dashboard.fields.address"), type: "data" },
      // { name: "walletPrettyName", label: t("dataview.dashboard.fields.walletPrettyName"), type: "data" },
      { name: "blockHeight", label: t("dataview.dashboard.fields.blockHeight"), type: "data",
        icon: faCubes,
        iconClass: "bg-blue-100 dark:bg-blue-900/20",
        iconColorClass: "text-blue-600 dark:text-blue-400 text-xl"
      },
      { name: "ecosystems", label: t("dataview.dashboard.fields.ecosystems"), type: "data",
        icon: faShieldHalved,
        iconClass: "bg-purple-100 dark:bg-purple-900/20",
        iconColorClass: "text-purple-600 dark:text-purple-400 text-xl"
      },
      { name: "schemas", label: t("dataview.dashboard.fields.schemas"), type: "data",
        icon: faFileLines,
        iconClass: "bg-slate-100 dark:bg-slate-900/20",
        iconColorClass: "text-slate-600 dark:text-slate-400 text-xl"
      },
      { name: "totalLockedTrustDeposit", label: t("dataview.dashboard.fields.totalLockedTrustDeposit"), type: "data",
        icon: faCoins,
        iconClass: "bg-yellow-100 dark:bg-yellow-900/20",
        iconColorClass: "text-yellow-600 dark:text-yellow-400 text-xl"
      },
      { name: "issuedCredentials", label: t("dataview.dashboard.fields.issuedCredentials"), type: "data",
        icon: faCertificate,
        iconClass: "bg-green-100 dark:bg-green-900/20",
        iconColorClass: "text-green-600 dark:text-green-400 text-xl"
      },
      { name: "verifiedCredentials", label: t("dataview.dashboard.fields.verifiedCredentials"), type: "data",
        icon: faCheck,
        iconClass: "bg-orange-100 dark:bg-orange-900/20",
        iconColorClass: "text-orange-600 dark:text-orange-400 text-xl"
      },
   ],
  },
];
