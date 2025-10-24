import { ReactNode } from 'react';
import {
  Translatable,
  resolveTranslatable,
  resolveTranslatables,
} from "@/ui/dataview/types";
import { translate } from '@/i18n/dataview';

// Generic column definition (i18n-aware)
export type Column<T> = {
  header: Translatable;                 // ← before: string
  accessor: keyof T;
  filterType?: "text" | "checkbox";
  filterLabel?: Translatable;           // ← before: string | undefined
  filterFn?: (value: T[keyof T]) => boolean;
  format?: (value: T[keyof T]) => ReactNode;
  priority?: number;
};

// Resolved (ready-to-render) columns
export type ResolvedColumn<T> = Omit<Column<T>, "header" | "filterLabel"> & {
  header: string;
  filterLabel?: string;
};

export interface DataTableProps<T extends object> {
  columnsI18n: Column<T>[];         // ← resolved
  data: T[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  descriptionI18n?: Translatable[];               // ← resolved
  defaultSortColumn?: keyof T;
  defaultSortDirection?: "asc" | "desc";
}

// Helper: translate columns
export function translateColumns<T>(
  cols: ReadonlyArray<Column<T>>
): ResolvedColumn<T>[] {
  return cols.map((c) => ({
    ...c,
    header: resolveTranslatable(c.header, translate) ?? "",
    filterLabel: c.filterLabel
      ? resolveTranslatable(c.filterLabel, translate) ?? ""
      : undefined,
  }));
}

// Helper: translate columns description
export function translateDataTableDescriptions(
  texts: ReadonlyArray<Translatable> | undefined
): string[] | undefined {
  return texts ? resolveTranslatables(texts, translate) : undefined;
}