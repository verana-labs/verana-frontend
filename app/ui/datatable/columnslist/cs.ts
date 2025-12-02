import { formatDate, formatVNA, getStatus, shortenMiddle } from "@/util/util";
import { Column, Filter } from "@/ui/datatable/types";
import { resolveTranslatable, type I18nValues, type Translatable } from "@/ui/dataview/types";
import { translate } from "@/i18n/dataview";

const t = (key: string, values?: I18nValues) => ({ key, values });

export interface CsList {
  id: string;
  title: string;
  description: string;
  created: string;
  modified: string;
  role: string;
}

const roleFilterOptions = [
  { value: "", label: t("datatable.tr.filter.role.all") },
  { value: "ISSUER", label: t("datatable.tr.filter.role.issuer"), class: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" },
  { value: "VERIFIER", label: t("datatable.tr.filter.role.verifier"), class: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300" },
  { value: "ISSUER_GRANTOR", label: t("datatable.tr.filter.role.issuergrantor"), class: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" },
  { value: "VERIFIER_GRANTOR", label: t("datatable.tr.filter.role.verifiergrantor"), class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" },
  { value: "ECOSYSTEM", label: t("datatable.tr.filter.role.ecosystem"), class: "bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300" },
  { value: "HOLDER", label: t("datatable.tr.filter.role.holder"), class: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300" }
];

export const columnsCsList: Column<CsList>[] = [
  { header: t("datatable.cs.header.id"), accessor: "id" },
  { header: t("datatable.cs.header.title"), accessor: "title", priority: 1 },
  { header: t("datatable.cs.header.desc"), accessor: "description", priority: 1 },
  { header: t("datatable.cs.header.created"), accessor: "created", format: (value) => formatDate(value), priority: 2 },
  { header: t("datatable.cs.header.modified"), accessor: "modified", format: (value) => formatDate(value), priority: 2 },
  { header: t("datatable.cs.header.role"), accessor: "role", format: (value) => getRoleLabels(value), isHtml: true, viewMobileRight: true},
];

export const description: Translatable[] = [
      t("datatable.cs.description")
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
