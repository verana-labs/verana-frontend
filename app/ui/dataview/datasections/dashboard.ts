import { Section } from "@/ui/dataview/types";
import { faChartLine, faCoins, faCubes, faIdCard, faShieldHalved, faUsers } from "@fortawesome/free-solid-svg-icons";

const t = (key: string) => ({ key });

//Dashboard data
export interface DashboardData {
  chainName: string | null;
  blockHeight: string | null;
  status: string | null;
  isWalletConnected: string | null;
  address: string | null;
  walletPrettyName: string | null;
  totalDIDs: string | null;
  trustRegistries: string | null;
  participants: string | null;
  sessions: string | null;
  totalDepositValue: string | null;
}

// Sections configuration for DashboardData
export const dashboardSections: Section<DashboardData>[] = [
  {
    // name: t("dataview.dashboard.sections.connectionDetails"),
    cardView: true,
    classForm: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
    fields: [
      // { name: "chainName", label: t("dataview.dashboard.fields.chainName"), type: "data" },
      // { name: "status", label: t("dataview.dashboard.fields.status"), type: "data" },
      // { name: "isWalletConnected", label: t("dataview.dashboard.fields.isWalletConnected"), type: "data" },
      // { name: "address", label: t("dataview.dashboard.fields.address"), type: "data" },
      // { name: "walletPrettyName", label: t("dataview.dashboard.fields.walletPrettyName"), type: "data" },
      { name: "blockHeight", label: t("dataview.dashboard.fields.blockHeight"), type: "data",
        icon: faCubes,
        iconClass: "bg-accent-100 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 text-xl"
      },
      { name: "totalDIDs", label: t("dataview.dashboard.fields.totalDIDs"), type: "data",
        icon: faIdCard,
        iconClass: "bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 ttext-xl"
      },
      { name: "trustRegistries", label: t("dataview.dashboard.fields.trustRegistries"), type: "data",
        icon: faShieldHalved,
        iconClass: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xl"
      },
      { name: "participants", label: t("dataview.dashboard.fields.participants"), type: "data",
        icon: faUsers,
        iconClass: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xl"
      },
      { name: "sessions", label: t("dataview.dashboard.fields.sessions"), type: "data",
        icon: faChartLine,
        iconClass: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xl"
      },
       { name: "totalDepositValue", label: t("dataview.dashboard.fields.totalDepositValue"), type: "data",
        icon: faCoins,
        iconClass: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xl"
      },
   ],
  },
];
