import { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Chip,
  Collapse,
  Link as MuiLink,
  Paper,
  TextField,
  Typography
} from '@mui/material';

import {
  FAULT_DB_BRAND,
  faultDbApplies,
  findFault,
  loadFaultDb,
  parseLastCode,
  searchFaults
} from './faultLookup';
import type { FaultDb, FaultEntry, Severity } from './faultLookup';
import { findItem, str } from './model';
import type { SysItem } from './model';
import { useTexts } from './texts';
import type { Texts } from './texts';

const SEV_COLOR: Record<Severity, string> = {
  info: '#3b82f6',
  service: '#f59e0b',
  warn: '#f97316',
  error: '#ef4444',
  unknown: '#64748b'
};

export interface FaultCardData {
  kind: 'last' | 'ctrl' | 'service' | 'hit';
  raw: string;
  code: string;
  add: number | null;
  span: string;
  applies: boolean; // Deutung erlaubt (Marke Buderus)
  entry: FaultEntry | null;
}

const isBuderusBoiler = (i: SysItem): boolean =>
  i.devType === 'boiler' && i.brand.trim().toLowerCase() === FAULT_DB_BRAND;

export const useFaultCards = (items: readonly SysItem[]) => {
  const hasBuderus = items.some(isBuderusBoiler);
  const [db, setDb] = useState<FaultDb | null>(null);

  const sources = useMemo(
    () => ({
      last: findItem(items, 'boiler:lastcode'),
      ctrl: findItem(items, 'thermostat:lastcode'),
      service: findItem(items, 'boiler:servicecode'),
      serviceNr: findItem(items, 'boiler:servicecodenumber')
    }),
    [items]
  );

  const needDb = [sources.last, sources.ctrl, sources.service].some(
    (i) => i && faultDbApplies(i.brand, hasBuderus)
  );

  useEffect(() => {
    if (needDb && !db) void loadFaultDb().then(setDb);
  }, [needDb, db]);

  const cards: FaultCardData[] = [];
  const add = (
    kind: FaultCardData['kind'],
    item: SysItem | undefined,
    raw: string,
    code: string,
    nr: number | null,
    span: string
  ) => {
    if (!item || !code) return;
    const applies = faultDbApplies(item.brand, hasBuderus);
    cards.push({
      kind,
      raw,
      code,
      add: nr,
      span,
      applies,
      entry: applies && db && nr ? findFault(db, code, nr) : null
    });
  };

  for (const kind of ['last', 'ctrl'] as const) {
    const item = sources[kind];
    const parsed = parseLastCode(item?.dv.v);
    if (item && parsed)
      add(kind, item, String(item.dv.v), parsed.code, parsed.add, parsed.span);
  }
  if (sources.service) {
    const code = str(sources.service.dv.v).trim();
    const nr = Number(sources.serviceNr?.dv.v);
    add('service', sources.service, code, code, nr > 0 ? nr : null, '');
  }
  return { cards, db, hasBuderus };
};

const FaultCard = ({ data, t }: { data: FaultCardData; t: Texts }) => {
  const e = data.entry;
  const color = SEV_COLOR[e?.severity ?? 'unknown'];
  const head =
    data.kind === 'last'
      ? t('FAULT_LAST')
      : data.kind === 'ctrl'
        ? t('FAULT_CTRL')
        : data.kind === 'hit'
          ? t('FAULT_SEARCH')
          : t('FAULT_SERVICE');
  const span = data.span.replace(/\s*-\s*now$/i, ' ' + t('FAULT_UNTIL_NOW'));
  return (
    <Paper sx={{ p: 2, mb: 2, borderLeft: 4, borderLeftColor: color }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>{head}</Typography>
        {e && (
          <Chip
            size="small"
            label={t(`SEV_${e.severity}`)}
            sx={{ bgcolor: color, color: '#101418', fontWeight: 700 }}
          />
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'baseline',
          flexWrap: 'wrap',
          mt: 0.5
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {data.code}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.add ? t('FAULT_ADD', data.add) : ''}
          {span ? ' · ' + span : ''}
        </Typography>
      </Box>
      {!data.applies && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('FAULT_RAW_ONLY')}
        </Typography>
      )}
      {data.applies && !e && data.add !== null && (
        <Typography sx={{ mt: 1, fontWeight: 600 }}>{t('FAULT_UNKNOWN')}</Typography>
      )}
      {e && <FaultBody entry={e} color={color} t={t} />}
    </Paper>
  );
};

const FaultBody = ({
  entry,
  color,
  t
}: {
  entry: FaultEntry;
  color: string;
  t: Texts;
}) => {
  const [open, setOpen] = useState(false);
  const label = (text: string) => (
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        color,
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        display: 'block',
        mt: 1.5
      }}
    >
      {text}
    </Typography>
  );
  return (
    <>
      <Typography sx={{ fontWeight: 600, mt: 1 }}>{entry.title}</Typography>
      {entry.cause && (
        <>
          {label(t('FAULT_CAUSE'))}
          <Typography sx={{ whiteSpace: 'pre-line' }}>{entry.cause}</Typography>
        </>
      )}
      {entry.fix && (
        <>
          {label(t('FAULT_FIX'))}
          <Typography sx={{ whiteSpace: 'pre-line' }}>{entry.fix}</Typography>
        </>
      )}
      {entry.classText && (
        <Box sx={{ mt: 1.5 }}>
          <MuiLink component="button" variant="body2" onClick={() => setOpen(!open)}>
            {t('FAULT_CLASS')} {open ? '▴' : '▾'}
          </MuiLink>
          <Collapse in={open}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, whiteSpace: 'pre-line' }}
            >
              {entry.classText}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {entry.classMeaning}
            </Typography>
          </Collapse>
        </Box>
      )}
    </>
  );
};

export const FaultPanel = ({ items }: { items: readonly SysItem[] }) => {
  const t = useTexts();
  const { cards, db, hasBuderus } = useFaultCards(items);
  const [q, setQ] = useState('');
  const results = db && q.trim() ? searchFaults(db, q) : [];
  return (
    <Box sx={{ mb: 2 }}>
      {hasBuderus && db && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('FAULT_SOURCE', db.codes.length)}
        </Typography>
      )}
      {cards.length === 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="text.secondary">{t('FAULT_NONE')}</Typography>
        </Paper>
      )}
      {cards.map((c) => (
        <FaultCard key={c.kind} data={c} t={t} />
      ))}
      {hasBuderus && (
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>
            {t('FAULT_SEARCH')}
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="H08, 6A 227, H08(1018), 1018"
            helperText={t('FAULT_SEARCH_HINT')}
          />
          <Box sx={{ mt: 2 }}>
            {results.map((e) => (
              <FaultCard
                key={`${e.code}-${e.add}`}
                t={t}
                data={{
                  kind: 'hit',
                  raw: '',
                  code: e.code,
                  add: e.add,
                  span: '',
                  applies: true,
                  entry: e
                }}
              />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export const faultSummary = (
  cards: readonly FaultCardData[]
): FaultCardData | undefined => cards.find((c) => c.kind === 'last');
