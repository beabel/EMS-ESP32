// Looking up fault codes in a fault code pack (see faults/README.md).
// IMPORTANT: The same code can mean something completely different for another manufacturer.
// A pack is therefore only used for the devices of its brand (packApplies).

export type Severity = 'info' | 'service' | 'warn' | 'error' | 'unknown';

export interface FaultClass {
  title: string;
  meaning: string;
  severity: Severity;
}

// [code, additional code or null, class id, title, cause, remedy]
export type FaultCode = [string, number | null, string, string, string, string];

export interface FaultPack {
  format: 1;
  brand: string; // lower case, as the devices report it
  lang: string;
  version: string;
  source: string;
  license: string;
  applies?: { unbranded_with_boiler?: boolean };
  classes: Record<string, FaultClass>;
  codes: FaultCode[];
}

export interface FaultEntry {
  code: string;
  add: number | null;
  title: string;
  cause: string;
  fix: string;
  classText: string;
  classMeaning: string;
  severity: Severity;
}

// A pack is used for a device of its brand, or for a device without a brand (e.g. a controller)
// when the pack says so and the boiler of the system has the brand of the pack.
export const packApplies = (
  pack: FaultPack,
  deviceBrand: string,
  boilerBrand: string
): boolean => {
  const b = deviceBrand.trim().toLowerCase();
  return (
    b === pack.brand ||
    (b === '' && !!pack.applies?.unbranded_with_boiler && boilerBrand === pack.brand)
  );
};

const normalize = (s: string): string => s.toUpperCase().replace(/[Ξ≡]/g, '=');

const toEntry = (pack: FaultPack, row: FaultCode): FaultEntry => {
  const [code, add, cls, title, cause, fix] = row;
  const c = pack.classes[cls];
  return {
    code,
    add,
    title,
    cause,
    fix,
    classText: c?.title ?? '',
    classMeaning: c?.meaning ?? '',
    severity: c?.severity ?? 'unknown'
  };
};

export const findFault = (
  pack: FaultPack,
  code: string,
  add: number | null
): FaultEntry | null => {
  const c = normalize(code);
  const row = pack.codes.find((r) => r[0].toUpperCase() === c && r[1] === add);
  return row ? toEntry(pack, row) : null;
};

export interface ParsedCode {
  code: string;
  add: number;
  span: string;
}

// "H08(1018) 20.11.2026 20:58 - now"
export const parseLastCode = (value: unknown): ParsedCode | null => {
  const m = /^\s*([A-Z0-9=-]+)\((\d+)\)\s*(.*)$/.exec(
    normalize(
      typeof value === 'string' || typeof value === 'number' ? String(value) : ''
    )
  );
  if (!m) return null;
  return { code: m[1] ?? '', add: Number(m[2]), span: m[3] ?? '' };
};

export const searchFaults = (pack: FaultPack, raw: string): FaultEntry[] => {
  const q = normalize(raw.trim());
  if (!q) return [];
  let rows: FaultCode[];
  const m = /^([A-Z0-9=-]{1,3})\s*[\s(\-/,:]+\s*(\d{1,4})\)?$/.exec(q);
  if (m) {
    rows = pack.codes.filter(
      (r) => r[0].toUpperCase() === m[1] && r[1] === Number(m[2])
    );
  } else if (/^\d+$/.test(q)) {
    rows = pack.codes.filter((r) => r[0] === q || r[1] === Number(q));
  } else {
    const code = q.replace(/[^A-Z0-9]/g, '');
    rows = pack.codes.filter((r) => r[0].toUpperCase() === code);
  }
  return rows.slice(0, 25).map((r) => toEntry(pack, r));
};
