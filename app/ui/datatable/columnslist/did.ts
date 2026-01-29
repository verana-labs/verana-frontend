import { formatDate, formatVNA, getStatus, shortenDID, shortenMiddle } from "@/util/util";
import { Column, Filter } from "@/ui/datatable/types";
import { resolveTranslatable, type I18nValues, type Translatable } from "@/ui/dataview/types";
import { translate } from "@/i18n/dataview";

const t = (key: string, values?: I18nValues) => ({ key, values });

export interface DidList {
  controller: string;
  created: string;
  deposit: string;
  did: string;
  exp: string;
  modified: string;
  status: string;
}

const statusFilterOptions = [
  { value: "", label: t("datatable.did.filter.status.all") },
  { value: "active", label: t("datatable.did.filter.status.active"), class: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
  { value: "expiring", label: t("datatable.did.filter.status.expiring"), class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" },
  { value: "expired", label: t("datatable.did.filter.status.expired"), class: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" }
];

const expClass = [
  { value: "active", label: t("datatable.did.filter.status.active"), class: "text-green-600 dark:text-green-40" },
  { value: "expiring", label: t("datatable.did.filter.status.expiring"), class: "text-yellow-600 dark:text-yellow-40" },
  { value: "expired", label: t("datatable.did.filter.status.expired"), class: "text-red-600 dark:text-red-40" }
];

export const didFilter: Filter<DidList>[] = [
  {label: t("datatable.did.filter.did.label"), columns: ["did"], inputType: "text", placeholder:  t("datatable.did.filter.did.placeholder")},
  {label: t("datatable.did.filter.status.label"), columns: ["status"], inputType: "select", options: statusFilterOptions}
];

export const columnsDidList: Column<DidList>[] = [
  { header: t("datatable.did.header.did"), accessor: "did", format: (value) => shortenDID(String(value)) },
  { header: t("datatable.did.header.controller"), accessor: "controller", format: (value) => shortenMiddle(String(value), 25), priority: 2 },
  { header: t("datatable.did.header.created"), accessor: "created", format: (value) => formatDate(value), priority: 4 },
  { header: t("datatable.did.header.modified"), accessor: "modified", format: (value) => formatDate(value), priority: 1 },
  { header: t("datatable.did.header.expire"), accessor: "exp", format: (value) => formatDate(value), className: (value) => getExpireClass(value) },
  { header: t("datatable.did.header.deposit"), accessor: "deposit", format: (value) => formatVNA(String(value), 6), priority: 3 },
  { header: t("datatable.did.header.status"), accessor: "status", format: (value) => getStatusLabel(value), priority: 9999, className: (value) => getStatusClass(value), viewMobileRight: true },
];

export const description: Translatable[] = [
      t("datatable.did.description")
];

function getStatusLabel(value: string): string {
  const found = statusFilterOptions.find(opt => opt.value === value);
  return resolveTranslatable(found ? found.label : statusFilterOptions[0].label, translate) ?? "";
}

function getStatusClass(value: string): string {
  const found = statusFilterOptions.find(opt => opt.value === value);
  return found?.class ?? "";
}

function getExpireClass(value: string): string {
  const status = getStatus(value);
  const found = expClass.find(opt => opt.value === status);
  return found?.class ?? "";
}