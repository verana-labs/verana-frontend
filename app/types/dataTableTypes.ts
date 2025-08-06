import { formatDate, formatVNA, isExpired, shortenMiddle } from '@/app/util/util';
import { ReactNode } from 'react';

// Generic column definition
export type Column<T> = {
  header: string;
  accessor: keyof T;
  filterType?: 'text' | 'checkbox';
  filterLabel?: string;
  filterFn?: (value: T[keyof T]) => boolean;
  format?: (value: T[keyof T]) => ReactNode;
  priority?: number;
};

export interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  description?: string[];
};

export interface DidList {
  controller: string;
  created: string;
  deposit: string;
  did: string;
  exp: string;
  modified: string;
};

export const columnsDidList: Column<DidList>[] = [
  { header: 'DID', accessor: 'did', filterType: 'text', format: (value) => shortenMiddle(String(value), 30) },
  { header: 'Controller', accessor: 'controller', filterType: 'text', format: (value) => { return shortenMiddle(String(value), 25); }, priority:2 },
  { header: 'Created', accessor: 'created', filterType: 'text', format: (value) => formatDate(value), priority:4 },
  { header: 'Modified', accessor: 'modified', filterType: 'text', format: (value) => formatDate(value), priority:1 },
  { header: 'Expire', accessor: 'exp', filterType: 'checkbox', filterLabel: 'Expired', filterFn: (value) => isExpired(value), format: (value) => formatDate(value) },
  { header: 'Deposit', accessor: 'deposit', filterType: 'text', format: (value) => formatVNA(String(value), 6), priority:3 },
];

export interface TrList {
  id: string;
  did: string;
  controller: string;
//   role: string;
  created: string;
  modified: string;
  active_version: string;
//   schemas: string;
  deposit: string;
};

export const columnsTrList: Column<TrList>[] = [
  { header: 'Id', accessor: 'id', filterType: 'text'},
  { header: 'DID', accessor: 'did', filterType: 'text', format: (value) => shortenMiddle(String(value), 30) },
  { header: 'Controller', accessor: 'controller', filterType: 'text', format: (value) => { return shortenMiddle(String(value), 25); }, priority:2 },
//   { header: 'role', accessor: 'role', filterType: 'text'},
  { header: 'Created', accessor: 'created', filterType: 'text', format: (value) => formatDate(value), priority:4 },
  { header: 'Modified', accessor: 'modified', filterType: 'text', format: (value) => formatDate(value), priority:1 },
  { header: 'Active GF Version', accessor: 'active_version', filterType: 'text'},
//   { header: 'schemas', accessor: 'schemas', filterType: 'text'},
  { header: 'Deposit', accessor: 'deposit', filterType: 'text', format: (value) => formatVNA(String(value), 6), priority:3 }
];
