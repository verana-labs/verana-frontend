'use client'

import Long from 'long';

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