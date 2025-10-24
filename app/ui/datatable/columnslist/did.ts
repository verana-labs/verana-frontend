import { formatDate, formatVNA, isExpired, shortenMiddle } from "@/util/util";
import { Column } from "@/ui/datatable/types";
import type { I18nValues, Translatable } from "@/ui/dataview/types";

const t = (key: string, values?: I18nValues) => ({ key, values });

export interface DidList {
  controller: string;
  created: string;
  deposit: string;
  did: string;
  exp: string;
  modified: string;
}

export const columnsDidList: Column<DidList>[] = [
  { header: t("datatable.did.header.did"), accessor: "did", filterType: "text", format: (value) => shortenMiddle(String(value), 30) },
  { header: t("datatable.did.header.controller"), accessor: "controller", filterType: "text", format: (value) => shortenMiddle(String(value), 25), priority: 2 },
  { header: t("datatable.did.header.created"), accessor: "created", filterType: "text", format: (value) => formatDate(value), priority: 4 },
  { header: t("datatable.did.header.modified"), accessor: "modified", filterType: "text", format: (value) => formatDate(value), priority: 1 },
  { header: t("datatable.did.header.expire"), accessor: "exp", filterType: "checkbox", filterLabel: t("datatable.did.filter.expired"), filterFn: (value) => isExpired(value), format: (value) => formatDate(value) },
  { header: t("datatable.did.header.deposit"), accessor: "deposit", filterType: "text", format: (value) => formatVNA(String(value), 6), priority: 3 },
];

export const description: Translatable[] = [
      t("datatable.did.description.1"),
      t("datatable.did.description.2"),
];