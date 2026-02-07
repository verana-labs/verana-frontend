import { shortenDID, shortenMiddle } from "@/util/util";
import { Column, Filter } from "@/ui/datatable/types";
import { type I18nValues, type Translatable } from "@/ui/dataview/types";

const t = (key: string, values?: I18nValues) => ({ key, values });

export interface TrList {
  id: string;
  did: string;
  controller: string;
  created: string;
  modified: string;
  aka: string;
  role: string;
  deposit: string;
  versions?: {
    id: string;
    version: number;
    active_since: string;
    documents?: {
      id: string;
      url: string;
      language: string;
    }[];
  }[];
  active_version?: number;
  active_schemas?: number | null;
  participants?: number | null;
  weight?: number | null;
  issued?: number | null;
  verified?: number | null;
}

export const trFilter: Filter<TrList>[] = [
  {label: t("datatable.tr.filter.did_aka.label"), columns: ["did", "aka"], inputType: "text", placeholder:  t("datatable.tr.filter.did_aka.placeholder")}
];

const formatNumber = (value: unknown): string => {
  if (value === null || value === undefined) return "0";
  const num = Number(value);
  return isNaN(num) ? "0" : String(num);
};

export const columnsTrList: Column<TrList>[] = [
  { header: t("datatable.tr.header.id"), accessor: "id"},
  { header: t("datatable.tr.header.did"), accessor: "did", format: (value) => shortenDID(String(value)) },
  { header: t("datatable.tr.header.controller"), accessor: "controller", format: (value) => shortenMiddle(String(value), 25), priority: 2 },
  { header: t("datatable.tr.header.activeSchemas"), accessor: "active_schemas", format: formatNumber, priority: 3 },
  { header: t("datatable.tr.header.participants"), accessor: "participants", format: formatNumber, priority: 3 },
  { header: t("datatable.tr.header.trustDeposit"), accessor: "weight", format: formatNumber, priority: 4 },
  { header: t("datatable.tr.header.issuedCredentials"), accessor: "issued", format: formatNumber, priority: 4 },
  { header: t("datatable.tr.header.verifiedCredentials"), accessor: "verified", format: formatNumber, priority: 4 },
];


export const description: Translatable[] = [
      t("datatable.tr.description")
];
