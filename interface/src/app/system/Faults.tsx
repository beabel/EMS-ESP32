import { useMemo, useState } from 'react';

import { Button, SearchField, Tag } from 'components/ui';
import type { TagKind } from 'components/ui';
import { useI18nContext } from 'i18n/i18n-react';

import {
  FAULT_DB_BRAND,
  faultDbApplies,
  findFault,
  parseLastCode,
  searchFaults
} from './faultLookup';
import type { FaultEntry, Severity } from './faultLookup';
import { installPack, removePack, useFaultPack } from './faultPacks';
import { findItem, str } from './model';
import type { SysItem } from './model';

const SEV_TAG: Record<Severity, TagKind> = {
  info: 'ok',
  service: 'warn',
  warn: 'warn',
  error: 'err',
  unknown: 'muted'
};

export interface FaultCardData {
  kind: 'last' | 'ctrl' | 'service' | 'hit';
  code: string;
  add: number | null;
  span: string;
  // interpretation allowed: only for devices of the brand Buderus
  applies: boolean;
  // the pack of the brand is installed, so a missing entry really is unknown
  packReady: boolean;
  entry: FaultEntry | null;
}

const isBuderusBoiler = (i: SysItem): boolean =>
  i.devType === 'boiler' && i.brand.trim().toLowerCase() === FAULT_DB_BRAND;

// the fault codes the devices report, looked up in the database where it applies.
// The same code can mean something else for another manufacturer, so a device of
// another brand only shows its raw code.
export const useFaultCards = (items: readonly SysItem[]) => {
  const hasBuderus = items.some(isBuderusBoiler);
  const db = useFaultPack(FAULT_DB_BRAND);

  const sources = useMemo(
    () => ({
      last: findItem(items, 'boiler:lastcode'),
      ctrl: findItem(items, 'thermostat:lastcode'),
      service: findItem(items, 'boiler:servicecode'),
      serviceNr: findItem(items, 'boiler:servicecodenumber')
    }),
    [items]
  );

  // the explanations are used for a device when the pack of its brand is installed
  const applicable = [sources.last, sources.ctrl, sources.service].some(
    (i) => i && faultDbApplies(i.brand, hasBuderus)
  );

  const cards: FaultCardData[] = [];
  const add = (
    kind: FaultCardData['kind'],
    item: SysItem,
    code: string,
    nr: number | null,
    span: string
  ) => {
    if (!code) return;
    const applies = faultDbApplies(item.brand, hasBuderus);
    cards.push({
      kind,
      code,
      add: nr,
      span,
      applies,
      packReady: !!db,
      entry: applies && db && nr ? findFault(db, code, nr) : null
    });
  };

  for (const kind of ['last', 'ctrl'] as const) {
    const item = sources[kind];
    const parsed = parseLastCode(item?.dv.v);
    if (item && parsed) add(kind, item, parsed.code, parsed.add, parsed.span);
  }
  if (sources.service) {
    const code = str(sources.service.dv.v).trim();
    const nr = Number(sources.serviceNr?.dv.v);
    add('service', sources.service, code, nr > 0 ? nr : null, '');
  }
  return { cards, db, hasBuderus, packMissing: applicable && !db };
};

const FaultBody = ({ entry }: { entry: FaultEntry }) => {
  const { LL } = useI18nContext();
  return (
    <>
      <div className="sys-fault-title">{entry.title}</div>
      {entry.cause && (
        <>
          <div className="sys-fault-lbl">{LL.SYS_FAULT_CAUSE()}</div>
          <p>{entry.cause}</p>
        </>
      )}
      {entry.fix && (
        <>
          <div className="sys-fault-lbl">{LL.SYS_FAULT_FIX()}</div>
          <p>{entry.fix}</p>
        </>
      )}
      {entry.classText && (
        <details>
          <summary>{LL.SYS_FAULT_CLASS()}</summary>
          <p>
            <b>{entry.classText}</b>
            {'\n'}
            {entry.classMeaning}
          </p>
        </details>
      )}
    </>
  );
};

const FaultCard = ({ data }: { data: FaultCardData }) => {
  const { LL } = useI18nContext();
  const e = data.entry;
  const head =
    data.kind === 'last'
      ? LL.SYS_FAULT_LAST()
      : data.kind === 'ctrl'
        ? LL.SYS_FAULT_CTRL()
        : data.kind === 'hit'
          ? LL.SYS_FAULT_SEARCH()
          : LL.SYS_FAULT_SERVICE();
  const span = data.span.replace(/\s*-\s*now$/i, ` ${LL.SYS_FAULT_UNTIL_NOW()}`);
  const sev = {
    info: LL.SYS_SEV_INFO(),
    service: LL.SYS_SEV_SERVICE(),
    warn: LL.SYS_SEV_WARN(),
    error: LL.SYS_SEV_ERROR(),
    unknown: LL.SYS_SEV_UNKNOWN()
  };
  return (
    <div className={`sys-fault ${e?.severity ?? ''}`}>
      <div className="sys-fault-head">
        <span>{head}</span>
        {e && <Tag kind={SEV_TAG[e.severity]}>{sev[e.severity]}</Tag>}
      </div>
      <div className="sys-fault-code">
        {data.code}
        <small>
          {data.add ? LL.SYS_FAULT_ADD(data.add) : ''}
          {span ? ` · ${span}` : ''}
        </small>
      </div>
      {!data.applies && <p>{LL.SYS_FAULT_RAW_ONLY()}</p>}
      {data.applies && !e && data.add !== null && data.packReady && (
        <div className="sys-fault-title">{LL.SYS_FAULT_UNKNOWN()}</div>
      )}
      {e && <FaultBody entry={e} />}
    </div>
  );
};

// the fault cards of the System menu page Maintenance & faults, with a code lookup
export const FaultPanel = ({ items }: { items: readonly SysItem[] }) => {
  const { LL } = useI18nContext();
  const { cards, db, hasBuderus } = useFaultCards(items);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const install = async () => {
    setBusy(true);
    setError('');
    try {
      await installPack(FAULT_DB_BRAND);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const results = db && q.trim() ? searchFaults(db, q) : [];
  return (
    <>
      {hasBuderus && !db && (
        <div className="sys-fault">
          <p>{LL.SYS_FAULT_PACK_MISSING()}</p>
          <p>
            <Button icon="download" disabled={busy} onClick={() => void install()}>
              {LL.SYS_FAULT_PACK_INSTALL()}
            </Button>
          </p>
          {error && <p>{LL.SYS_FAULT_PACK_ERROR(error)}</p>}
        </div>
      )}
      {hasBuderus && db && (
        <p className="sys-sub" style={{ margin: '0 0 8px' }}>
          {LL.SYS_FAULT_SOURCE(db.version, db.codes.length)}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              void install();
            }}
          >
            {LL.SYS_FAULT_PACK_UPDATE()}
          </a>
          {' · '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              removePack(FAULT_DB_BRAND);
            }}
          >
            {LL.SYS_FAULT_PACK_REMOVE()}
          </a>
          {error && ` · ${LL.SYS_FAULT_PACK_ERROR(error)}`}
        </p>
      )}
      {cards.length === 0 && (
        <div className="sys-fault">
          <p>{LL.SYS_FAULT_NONE()}</p>
        </div>
      )}
      {cards.map((c) => (
        <FaultCard key={c.kind} data={c} />
      ))}
      {hasBuderus && db && (
        <div className="sys-fault">
          <div className="sys-fault-head">{LL.SYS_FAULT_SEARCH()}</div>
          <p>
            <SearchField
              label={LL.SYS_FAULT_SEARCH()}
              placeholder="H08, 6A 227, H08(1018), 1018"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </p>
          <p className="sys-sub" style={{ margin: '6px 0 0' }}>
            {LL.SYS_FAULT_SEARCH_HINT()}
          </p>
          <div className="sys-search-res">
            {results.map((e) => (
              <FaultCard
                key={`${e.code}-${e.add}`}
                data={{
                  kind: 'hit',
                  code: e.code,
                  add: e.add,
                  span: '',
                  applies: true,
                  packReady: true,
                  entry: e
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export const faultSummary = (
  cards: readonly FaultCardData[]
): FaultCardData | undefined => cards.find((c) => c.kind === 'last');
