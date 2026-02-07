import { formatDate, shortenDID, shortenMiddle } from "@/util/util";
import { Column, Filter } from "@/ui/datatable/types";
import { resolveTranslatable, type I18nValues, type Translatable } from "@/ui/dataview/types";
import { translate } from "@/i18n/dataview";

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
}

const roleFilterOptions = [
  { value: "", label: t("datatable.tr.filter.role.all") },
  { value: "ECOSYSTEM", label: t("datatable.tr.filter.role.ecosystem"), class: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300" },
  { value: "ISSUER_GRANTOR", label: t("datatable.tr.filter.role.issuergrantor"), class: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" },
  { value: "VERIFIER_GRANTOR", label: t("datatable.tr.filter.role.verifiergrantor"), class: "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300" },
  { value: "ISSUER", label: t("datatable.tr.filter.role.issuer"), class: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" },
  { value: "VERIFIER", label: t("datatable.tr.filter.role.verifier"), class: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300" },
  { value: "HOLDER", label: t("datatable.tr.filter.role.holder"), class: "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300" }
];

export const trFilter: Filter<TrList>[] = [
  {label: t("datatable.tr.filter.did_aka.label"), columns: ["did", "aka"], inputType: "text", placeholder:  t("datatable.tr.filter.did_aka.placeholder")},
  {label: t("datatable.tr.filter.role.label"), columns: ["role"], inputType: "select", options: roleFilterOptions}
];

export const columnsTrList: Column<TrList>[] = [
  { header: t("datatable.tr.header.id"), accessor: "id"},
  { header: t("datatable.tr.header.did"), accessor: "did", format: (value) => shortenDID(String(value)) },
  { header: t("datatable.tr.header.controller"), accessor: "controller", format: (value) => shortenMiddle(String(value), 25), priority: 2 },
  { header: t("datatable.tr.header.created"), accessor: "created", format: (value) => formatDate(value as string), priority: 4 },
  { header: t("datatable.tr.header.modified"), accessor: "modified", format: (value) => formatDate(value as string), priority: 1 },
  { header: t("datatable.tr.header.role"), accessor: "role", format: (value) => getRoleLabels(value as string), isHtml: true, viewMobileRight: true},
];


export const description: Translatable[] = [
      t("datatable.tr.description")
];

function getRoleLabels(value: string): string {
  if (!value?.trim()) return "";
  return value
    .split(",")
    .map(v => v.trim())
    .filter(Boolean)
    .map(v => {
      const found = roleFilterOptions.find(opt => opt.value === v);
      return (
        `<label class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleClass(v)}">${resolveTranslatable( found?.label, translate)}</label>`
      );
    })
    .filter(Boolean)
    .join("<br/>");
}

function getRoleClass(value: string): string {
  const found = roleFilterOptions.find(opt => opt.value === value);
  return found?.class ?? "";
}
