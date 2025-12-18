'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import Long from 'long';
import type { OptionalUInt32 } from 'proto-codecs/codec/verana/cs/v1/tx';

export const u64ToStr = (v?: Long | string | number | null) =>
  v != null ? Long.fromValue(v).toString() : undefined;

export const strToU64 = (s?: string | null) =>
  s != null ? Long.fromString(s) : undefined;

export const u32ToAmino_ = (n?: number | null) =>
  n == null ? undefined : (n >>> 0);

export const pickU32 = (v?: number | string | null) =>
  v == null ? undefined : (Number(v) >>> 0);

// 0 -> "0" (string), >0 -> number
export const u32ToAmino = (n?: number | null) =>
  n == null ? undefined : (((n >>> 0) === 0) ? 0 : (n >>> 0));

// number|string|undefined -> number uint32
export const fromAminoU32 = (v?: number | string | null) =>
  v == null ? 0 : (Number(v) >>> 0);

export const pickOptionalUInt32 = (v: any): OptionalUInt32 | undefined => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  const value = (n >>> 0);
  return { value };
};

// 0 => {} (omitempty chain), >0 => {value:n}
export const toOptU32Amino = (m?: { value: number } | undefined) => {
  if (!m) return undefined;
  const value = (Number(m.value) >>> 0);
  return value === 0 ? {} : { value };
};

// {}  (=> 0), {value:n}
export const fromOptU32Amino = (x: any): OptionalUInt32 | undefined => {
  if (x == null) return undefined;
  // {} => wrapper, value default 0
  if (typeof x === "object" && x.value == null) return { value: 0 };

  const n = typeof x === "object" ? x.value : x;
  if (n === undefined || n === null) return undefined;
  if (typeof n === "string" && n.trim() === "") return undefined;

  const u = (Number(n) >>> 0);
  return { value: u };
};