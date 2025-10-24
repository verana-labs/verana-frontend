import { formatDate, formatVNA, shortenMiddle } from "@/util/util";
import { Column } from "@/ui/datatable/types";
import type { I18nValues } from "@/ui/dataview/types";

const t = (key: string, values?: I18nValues) => ({ key, values });

export interface TrList {
  id: string;
  did: string;
  controller: string;
  created: string;
  modified: string;
  active_version: string;
  deposit: string;
}

export const columnsTrList: Column<TrList>[] = [
  { header: t("datatable.tr.header.id"), accessor: "id", filterType: "text" },
  { header: t("datatable.tr.header.did"), accessor: "did", filterType: "text", format: (value) => shortenMiddle(String(value), 30) },
  { header: t("datatable.tr.header.controller"), accessor: "controller", filterType: "text", format: (value) => shortenMiddle(String(value), 25), priority: 2 },
  { header: t("datatable.tr.header.created"), accessor: "created", filterType: "text", format: (value) => formatDate(value), priority: 4 },
  { header: t("datatable.tr.header.modified"), accessor: "modified", filterType: "text", format: (value) => formatDate(value), priority: 1 },
  { header: t("datatable.tr.header.activeVersion"), accessor: "active_version", filterType: "text" },
  { header: t("datatable.tr.header.deposit"), accessor: "deposit", filterType: "text", format: (value) => formatVNA(String(value), 6), priority: 3 },
];