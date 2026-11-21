// Nachschlagen von Fehlercodes in der Buderus-Fehlerdatenbank.
// WICHTIG: Gleiche Codes können bei anderen Herstellern etwas völlig anderes bedeuten.
// Die Deutung darf deshalb nur für Geräte der Marke Buderus verwendet werden (faultDbApplies).

export type Severity = 'info' | 'service' | 'warn' | 'error' | 'unknown';

export interface FaultEntry {
  code: string;
  add: number;
  title: string;
  cause: string;
  fix: string;
  classText: string;
  classMeaning: string;
  severity: Severity;
}

export type FaultDb = {
  classes: Record<string, [string, string]>;
  codes: [string, number, string, string, string, string][];
};

let dbPromise: Promise<FaultDb> | undefined;

// Die Datenbank (~350 KB) wird erst bei Bedarf als eigener Block geladen
export const loadFaultDb = (): Promise<FaultDb> => {
  dbPromise ??= import('./faultdb.json').then(
    (m) => m.default as unknown as FaultDb
  );
  return dbPromise;
};

export const FAULT_DB_BRAND = 'buderus';

// Gerät mit Marke Buderus, oder Gerät ohne Markenangabe (z. B. Regler RC300), wenn der
// Kessel des Systems Buderus ist. Alle anderen Marken: keine Deutung.
export const faultDbApplies = (
  brand: string,
  systemHasBuderusBoiler: boolean
): boolean => {
  const b = brand.trim().toLowerCase();
  return b === FAULT_DB_BRAND || (b === '' && systemHasBuderusBoiler);
};

const severityOf = (k: string): Severity =>
  k === 'BC'
    ? 'info'
    : k === '18' || k === '20'
      ? 'service'
      : k === '14' || k === '16'
        ? 'warn'
        : ['A', 'B', 'L', 'U'].includes(k)
          ? 'unknown'
          : 'error';

const normalize = (s: string): string => s.toUpperCase().replace(/[Ξ≡]/g, '=');

const toEntry = (db: FaultDb, row: FaultDb['codes'][number]): FaultEntry => {
  const [code, add, cls, title, cause, fix] = row;
  const c = db.classes[cls];
  return {
    code,
    add,
    title,
    cause,
    fix,
    classText: c?.[0] ?? '',
    classMeaning: c?.[1] ?? '',
    severity: severityOf(cls)
  };
};

export const findFault = (
  db: FaultDb,
  code: string,
  add: number
): FaultEntry | null => {
  const c = normalize(code);
  const row = db.codes.find((r) => r[0].toUpperCase() === c && r[1] === add);
  return row ? toEntry(db, row) : null;
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

export const searchFaults = (db: FaultDb, raw: string): FaultEntry[] => {
  const q = normalize(raw.trim());
  if (!q) return [];
  let rows: FaultDb['codes'];
  const m = /^([A-Z0-9=-]{1,3})\s*[\s(\-/,:]+\s*(\d{1,4})\)?$/.exec(q);
  if (m) {
    rows = db.codes.filter(
      (r) => r[0].toUpperCase() === m[1] && r[1] === Number(m[2])
    );
  } else if (/^\d+$/.test(q)) {
    rows = db.codes.filter((r) => r[0] === q || r[1] === Number(q));
  } else {
    const code = q.replace(/[^A-Z0-9]/g, '');
    rows = db.codes.filter((r) => r[0].toUpperCase() === code);
  }
  return rows.slice(0, 25).map((r) => toEntry(db, r));
};
