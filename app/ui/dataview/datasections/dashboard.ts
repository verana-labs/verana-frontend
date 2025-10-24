import { LinkIcon } from "@heroicons/react/24/outline";

import { Section } from "@/ui/dataview/types";

const t = (key: string) => ({ key });

//Dashboard data
export interface DashboardData {
  chainName: string | null;
  blockHeight: string | null;
  status: string | null;
  isWalletConnected: string | null;
  address: string | null;
  walletPrettyName: string | null;
}

// Sections configuration for DashboardData
export const dashboardSections: Section<DashboardData>[] = [
  {
    name: t("dataview.dashboard.sections.connectionDetails"),
    icon: LinkIcon,
    fields: [
      { name: "chainName", label: t("dataview.dashboard.fields.chainName"), type: "data" },
      { name: "blockHeight", label: t("dataview.dashboard.fields.blockHeight"), type: "data" },
      { name: "status", label: t("dataview.dashboard.fields.status"), type: "data" },
      { name: "isWalletConnected", label: t("dataview.dashboard.fields.isWalletConnected"), type: "data" },
      { name: "address", label: t("dataview.dashboard.fields.address"), type: "data" },
      { name: "walletPrettyName", label: t("dataview.dashboard.fields.walletPrettyName"), type: "data" },
    ],
  },
];
