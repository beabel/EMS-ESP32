// Fault code packs: the explanations of one manufacturer's fault codes are a separate
// file, not part of the firmware. The Web UI downloads it once on request and keeps it in
// the browser, so nobody pays the flash space for a manufacturer they don't have.
//
// A pack is a JSON file: { format: 1, brand, version, classes, codes }, see faults/README.md.
import { useSyncExternalStore } from 'react';

import type { FaultDb } from './faultLookup';

export interface FaultPack extends FaultDb {
  format: 1;
  brand: string; // lower case, as the devices report it, e.g. "buderus"
  version: string;
}

// where the packs are published, one file per brand: <base>/<brand>.json
export const FAULT_PACK_BASE =
  'https://raw.githubusercontent.com/emsesp/EMS-ESP32/dev/faults';

const KEY = (brand: string) => `emsesp-faultpack-${brand}`;
const TIMEOUT_MS = 15000;
const MAX_BYTES = 2_000_000;

const isPack = (p: unknown, brand: string): p is FaultPack => {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return (
    o.format === 1 &&
    o.brand === brand &&
    typeof o.version === 'string' &&
    Array.isArray(o.codes) &&
    typeof o.classes === 'object' &&
    o.classes !== null
  );
};

const cache = new Map<string, FaultPack | null>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// the browser storage can be blocked or full; the page works without it
const readStored = (brand: string): FaultPack | null => {
  try {
    const raw = localStorage.getItem(KEY(brand));
    if (!raw) return null;
    const p: unknown = JSON.parse(raw);
    return isPack(p, brand) ? p : null;
  } catch {
    return null;
  }
};

export const getPack = (brand: string): FaultPack | null => {
  if (!cache.has(brand)) cache.set(brand, readStored(brand));
  return cache.get(brand) ?? null;
};

export const installPack = async (brand: string): Promise<void> => {
  const response = await fetch(`${FAULT_PACK_BASE}/${brand}.json`, {
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > MAX_BYTES) throw new Error('file too large');
  const pack: unknown = JSON.parse(text);
  if (!isPack(pack, brand)) throw new Error('not a fault code pack');
  try {
    localStorage.setItem(KEY(brand), text);
  } catch {
    // not stored: usable until the page is closed
  }
  cache.set(brand, pack);
  emit();
};

export const removePack = (brand: string): void => {
  try {
    localStorage.removeItem(KEY(brand));
  } catch {
    // nothing stored
  }
  cache.set(brand, null);
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// the installed pack of a brand, null while there is none
export const useFaultPack = (brand: string): FaultPack | null =>
  useSyncExternalStore(subscribe, () => getPack(brand));
