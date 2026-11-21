import { memo } from 'react';
import { LuMinus, LuPlus, LuStar } from 'react-icons/lu';

import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Slider,
  TextField,
  Typography
} from '@mui/material';

import { useI18nContext } from 'i18n/i18n-react';

import { formatValue } from '../main/deviceValue';
import { Segmented } from './Segmented';
import { favoriteId, rangeOf, str } from './model';
import type { SysItem } from './model';
import { useTexts } from './texts';
import type { Texts } from './texts';
import type { Edits } from './useSystemData';

// Kurzname wie bei beschreibbaren Werten, z. B. hc1/currtemp
const shortId = (item: SysItem): string => {
  const short = (item.key.split(':')[1] ?? '').split('/').pop() ?? '';
  return item.tag ? `${item.tag}/${short}` : short;
};

const round = (v: number, step: number): number => {
  const decimals = (String(step).split('.')[1] ?? '').length;
  return Number((Math.round(v / step) * step).toFixed(decimals));
};

interface ControlProps {
  item: SysItem;
  value: unknown;
  onChange: (v: unknown) => void;
  onRun: () => void;
  t: Texts;
  variant?: 'row' | 'tile'; // tile: Kachel der Startseite (volle Breite, ohne Schieber)
}

export const useFormat = () => {
  const { LL } = useI18nContext();
  return (v: unknown, u?: number): string => formatValue(LL, v, u);
};

export const ValueControl = ({
  item,
  value,
  onChange,
  onRun,
  t,
  variant = 'row'
}: ControlProps) => {
  const format = useFormat();
  const { dv } = item;
  const tile = variant === 'tile';

  if (!dv.c) {
    const text = format(dv.v, dv.u);
    return (
      <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {text === '' ? '–' : text}
      </Typography>
    );
  }

  if (dv.v === undefined && dv.l === undefined) {
    return (
      <Button variant="outlined" size="small" onClick={onRun}>
        {t('RUN')}
      </Button>
    );
  }

  if (dv.l && dv.l.length > 0) {
    const current = str(value);
    if (dv.l.length <= 3 || (tile && dv.l.length <= 6)) {
      return (
        <Segmented
          fullWidth={tile}
          size={tile ? 'medium' : 'small'}
          value={current}
          options={dv.l.map((o) => ({ value: o, label: o }))}
          onChange={onChange}
        />
      );
    }
    return (
      <Select
        size="small"
        value={dv.l.includes(current) ? current : ''}
        onChange={(e) => onChange(e.target.value)}
        sx={{ minWidth: 160, borderRadius: '10px' }}
      >
        {dv.l.map((o) => (
          <MenuItem key={o} value={o}>
            {o}
          </MenuItem>
        ))}
      </Select>
    );
  }

  const range = rangeOf(item);
  if (typeof value === 'number' && range) {
    const set = (v: number) =>
      onChange(round(Math.min(range.max, Math.max(range.min, v)), range.step));
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}
      >
        {!tile && (
          <Slider
            size="small"
            min={range.min}
            max={range.max}
            step={range.step}
            value={value}
            onChange={(_, v) => set(v)}
            sx={{ width: 110, display: { xs: 'none', sm: 'block' } }}
          />
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            border: 1,
            borderColor: 'divider',
            borderRadius: '12px',
            bgcolor: 'action.hover',
            overflow: 'hidden'
          }}
        >
          <IconButton
            onClick={() => set(value - range.step)}
            sx={{ color: 'primary.main', borderRadius: 0, width: 38, height: 38 }}
          >
            <LuMinus size={18} />
          </IconButton>
          <Typography
            sx={{
              minWidth: 76,
              textAlign: 'center',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {format(value, dv.u)}
          </Typography>
          <IconButton
            onClick={() => set(value + range.step)}
            sx={{ color: 'primary.main', borderRadius: 0, width: 38, height: 38 }}
          >
            <LuPlus size={18} />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <TextField
      size="small"
      defaultValue={str(value)}
      key={str(item.dv.v)}
      onBlur={(e) => {
        if (e.target.value !== str(item.dv.v)) onChange(e.target.value);
      }}
      helperText={dv.h}
      sx={{ width: 190 }}
    />
  );
};

interface RowProps {
  item: SysItem;
  edits: Edits;
  favorites: readonly string[];
  onFavorite: (id: string) => void;
  showMenu?: string;
}

export const ValueRow = memo(
  ({ item, edits, favorites, onFavorite, showMenu }: RowProps) => {
    const t = useTexts();
    const format = useFormat();
    const changed = edits.pending.has(item.uid);
    const fid = favoriteId(item);
    const isFav = favorites.includes(fid);
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
          gap: 1,
          alignItems: 'center',
          px: 2,
          py: 1.25,
          borderBottom: 1,
          borderColor: 'divider',
          '&:last-of-type': { borderBottom: 0 },
          bgcolor: changed ? 'action.selected' : undefined
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="small"
              aria-label="favorite"
              onClick={() => onFavorite(fid)}
              sx={{ mr: 0.5, color: isFav ? 'warning.main' : 'text.disabled' }}
            >
              <LuStar size={17} fill={isFav ? 'currentColor' : 'none'} />
            </IconButton>
            <Typography sx={{ fontWeight: 600, lineHeight: 1.25 }}>
              {item.label}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            component="div"
          >
            {showMenu ? showMenu + ' · ' : ''}
            {item.dv.c ?? shortId(item)}
            {changed && ' · ' + t('CHANGED_WAS', format(item.dv.v, item.dv.u))}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }
          }}
        >
          <ValueControl
            item={item}
            value={edits.value(item)}
            onChange={(v) => edits.set(item, v)}
            onRun={() => void edits.run(item, t('SENT'))}
            t={t}
          />
        </Box>
      </Box>
    );
  }
);

export const PendingBar = ({
  edits,
  items
}: {
  edits: Edits;
  items: readonly SysItem[];
}) => {
  const t = useTexts();
  const format = useFormat();
  const n = edits.pending.size;
  if (n === 0) return null;
  return (
    <Paper
      elevation={8}
      sx={{
        position: 'sticky',
        bottom: 8,
        mt: 2,
        p: 1.5,
        zIndex: 10,
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}
    >
      <Box sx={{ flex: 1, minWidth: 200, maxHeight: 90, overflow: 'auto' }}>
        {[...edits.pending].map(([uid, v]) => {
          const it = items.find((i) => i.uid === uid);
          return it ? (
            <Typography key={uid} variant="body2">
              <b>{it.label}</b>
              {it.tag ? ` (${it.tag})` : ''}:{' '}
              <s style={{ opacity: 0.6 }}>{format(it.dv.v, it.dv.u)}</s> →{' '}
              <b>{format(v, it.dv.u)}</b>
            </Typography>
          ) : null;
        })}
      </Box>
      <Button onClick={edits.discard}>{t('DISCARD')}</Button>
      <Button variant="contained" onClick={() => void edits.apply(t('SENT'))}>
        {n === 1 ? t('APPLY_ONE') : t('APPLY_MANY', n)}
      </Button>
    </Paper>
  );
};
