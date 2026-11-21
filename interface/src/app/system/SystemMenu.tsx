import { memo, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  LuArrowLeftRight,
  LuBox,
  LuDroplets,
  LuFan,
  LuFlame,
  LuHeater,
  LuSlidersHorizontal,
  LuStar,
  LuSun,
  LuWaves,
  LuWind,
  LuWrench,
  LuZap
} from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router';

import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

import { useLayoutTitle } from 'components';
import { usePersistState } from 'utils';

import { FaultPanel } from './Faults';
import { useShell } from './SystemShell';
import { PendingBar, ValueRow } from './ValueRow';
import type { SectionId } from './catalog';
import { buildMenus, favoriteId, groupItems } from './model';
import type { SysItem } from './model';
import { useTexts } from './texts';
import type { Texts } from './texts';
import { useEdits, useSystemData } from './useSystemData';

export const menuName = (t: Texts, id: string): string => {
  const hc = /^hc(\d)$/.exec(id);
  if (hc) return t('HC', hc[1] ?? '');
  switch (id) {
    case 'dhw':
      return t('DHW');
    case 'boiler':
      return t('BOILER');
    case 'thermostat':
      return t('CONTROLLER');
    case 'mixer':
      return t('MIXER');
    case 'solar':
      return t('SOLAR');
    case 'heatpump':
      return t('HEATPUMP');
    case 'ahs':
      return t('AHS');
    case 'hs':
      return t('HEATSOURCE', '').trim();
    case 'src':
      return t('SOURCE', '').trim();
    case 'ventilation':
      return t('VENTILATION');
    case 'pool':
      return t('POOL');
    case 'service':
      return t('SERVICE');
    case 'energy':
      return t('ENERGY');
    case 'fav':
      return t('FAVORITES');
    default:
      return t('OTHER_DEVICES');
  }
};

const menuIcon = (id: string): ReactNode => {
  if (/^hc\d$/.test(id)) return <LuHeater size="1em" />;
  switch (id) {
    case 'dhw':
      return <LuDroplets size="1em" />;
    case 'boiler':
    case 'ahs':
    case 'hs':
      return <LuFlame size="1em" />;
    case 'heatpump':
      return <LuFan size="1em" />;
    case 'solar':
    case 'src':
      return <LuSun size="1em" />;
    case 'mixer':
      return <LuArrowLeftRight size="1em" />;
    case 'ventilation':
      return <LuWind size="1em" />;
    case 'pool':
      return <LuWaves size="1em" />;
    case 'service':
      return <LuWrench size="1em" />;
    case 'energy':
      return <LuZap size="1em" />;
    case 'thermostat':
      return <LuSlidersHorizontal size="1em" />;
    case 'fav':
      return <LuStar size="1em" fill="currentColor" />;
    default:
      return <LuBox size="1em" />;
  }
};

const NavItem = ({
  id,
  label,
  count,
  active,
  onClick
}: {
  id: string;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) => (
  <ButtonBase
    onClick={onClick}
    sx={{
      display: 'flex',
      width: '100%',
      justifyContent: 'flex-start',
      gap: 1.25,
      px: 1.25,
      py: 0.9,
      borderRadius: '10px',
      textAlign: 'left',
      fontSize: 15,
      fontWeight: active ? 700 : 500,
      color: active ? 'primary.main' : 'text.primary',
      bgcolor: active ? 'action.selected' : 'transparent',
      '&:hover': { bgcolor: active ? 'action.selected' : 'action.hover' }
    }}
  >
    <Box
      sx={{
        width: 28,
        height: 28,
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        fontSize: 16,
        borderRadius: '8px',
        bgcolor: active ? 'background.paper' : 'action.hover',
        color: id === 'fav' ? 'warning.main' : 'inherit'
      }}
    >
      {menuIcon(id)}
    </Box>
    <Box component="span" sx={{ flex: 1 }}>
      {label}
    </Box>
    <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
      {count}
    </Box>
  </ButtonBase>
);

const sectionName = (t: Texts, s: SectionId): string => {
  const names: Record<SectionId, string> = {
    mode: t('SEC_MODE'),
    temps: t('SEC_TEMPS'),
    status: t('SEC_STATUS'),
    service: t('SEC_SERVICE'),
    energy: t('SEC_ENERGY'),
    advanced: t('SEC_ADVANCED'),
    measure: t('SEC_MEASURE'),
    other: t('SEC_OTHER')
  };
  return names[s];
};

const SystemMenu = memo(() => {
  const t = useTexts();
  useLayoutTitle(t('SYSTEM'));
  const data = useSystemData();
  const edits = useEdits(data);
  const { menu } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const { level, q, setLevel, setQ } = useShell();
  const [favs, setFavs] = usePersistState<string[]>([], 'system-favs');

  const menus = useMemo(() => buildMenus(data.items), [data.items]);
  const current =
    menu === 'fav'
      ? 'fav'
      : (menus.find((m) => m.id === menu)?.id ?? menus[0]?.id ?? 'fav');

  const toggleFav = (id: string) =>
    setFavs(favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]);

  const visibleCount = (id: string) =>
    data.items.filter((i) => i.menu === id && (level === 2 || i.level === 1)).length;

  const searching = q.trim() !== '';
  let list: SysItem[];
  if (searching) {
    const needle = q.trim().toLowerCase();
    list = data.items.filter(
      (i) =>
        (level === 2 || i.level === 1) &&
        (i.label + ' ' + i.key + ' ' + (i.dv.c ?? '')).toLowerCase().includes(needle)
    );
  } else if (current === 'fav') {
    list = data.items.filter((i) => favs.includes(favoriteId(i)));
  } else {
    list = data.items.filter((i) => i.menu === current);
  }
  const { groups, hidden } = groupItems(
    list,
    searching || current === 'fav' ? 2 : level
  );

  const nav = mobile ? (
    <TextField
      select
      size="small"
      fullWidth
      value={current}
      onChange={(e) => {
        setQ('');
        void navigate(`/system/${e.target.value}`);
      }}
      sx={{ mb: 2 }}
    >
      <MenuItem value="fav">★ {t('FAVORITES')}</MenuItem>
      {menus.map((m) => (
        <MenuItem key={m.id} value={m.id}>
          {menuName(t, m.id)}
        </MenuItem>
      ))}
    </TextField>
  ) : (
    <Box
      sx={{
        width: 260,
        flex: 'none',
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 72,
        maxHeight: 'calc(100vh - 90px)',
        overflow: 'auto'
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <NavItem
          id="fav"
          label={t('FAVORITES')}
          count={favs.length}
          active={current === 'fav' && !searching}
          onClick={() => {
            setQ('');
            void navigate('/system/fav');
          }}
        />
      </Box>
      {(['heating', 'plant', 'overview'] as const).map((g) => {
        const ms = menus.filter((m) => m.group === g);
        if (!ms.length) return null;
        return (
          <Box key={g} sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                fontSize: 11,
                letterSpacing: '.8px',
                textTransform: 'uppercase',
                color: 'text.secondary',
                px: 1.25,
                py: 0.75
              }}
            >
              {g === 'heating'
                ? t('HEATING')
                : g === 'plant'
                  ? t('PLANT')
                  : t('OVERVIEW')}
            </Typography>
            {ms.map((m) => (
              <NavItem
                key={m.id}
                id={m.id}
                label={menuName(t, m.id)}
                count={visibleCount(m.id)}
                active={current === m.id && !searching}
                onClick={() => {
                  setQ('');
                  void navigate(`/system/${m.id}`);
                }}
              />
            ))}
          </Box>
        );
      })}
    </Box>
  );

  let body;
  if (data.loading && data.items.length === 0) {
    body = (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  } else if (data.error && data.items.length === 0) {
    body = <Alert severity="error">{data.error}</Alert>;
  } else if (data.items.length === 0) {
    body = <Alert severity="info">{t('NO_DATA')}</Alert>;
  } else {
    body = (
      <>
        {!searching && current === 'service' && <FaultPanel items={data.items} />}
        {groups.map((g) => (
          <Paper
            key={`${g.title}|${g.section}|${g.items[0]?.devId}`}
            sx={{
              mb: 2,
              overflow: 'hidden',
              borderRadius: '14px',
              border: 1,
              borderColor: 'divider'
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{
                display: 'block',
                px: 2,
                py: 1,
                borderBottom: 1,
                borderColor: 'divider'
              }}
            >
              {g.title ? `${g.title} · ` : ''}
              {sectionName(t, g.section)}
            </Typography>
            {g.items.map((i) => (
              <ValueRow
                key={i.uid}
                item={i}
                edits={edits}
                favorites={favs}
                onFavorite={toggleFav}
                {...(searching || current === 'fav'
                  ? { showMenu: menuName(t, i.menu) }
                  : {})}
              />
            ))}
          </Paper>
        ))}
        {groups.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searching
                ? t('NO_RESULTS')
                : current === 'fav'
                  ? t('NO_FAVORITES')
                  : t('NOTHING_HERE')}
            </Typography>
          </Paper>
        )}
        {hidden > 0 && !searching && current !== 'fav' && (
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ textAlign: 'center', mb: 2 }}
          >
            {t('HIDDEN_EXPERT', hidden)} ·{' '}
            <Button size="small" onClick={() => setLevel(2)}>
              {t('SHOW_ALL')}
            </Button>
          </Typography>
        )}
      </>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          flexDirection: mobile ? 'column' : 'row'
        }}
      >
        {nav}
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
            {searching ? t('SEARCH_RESULTS') : menuName(t, current)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {current === 'fav' && !searching ? t('FAVORITES_SUB') : t('SYSTEM_SUB')}
          </Typography>
          {body}
          <PendingBar edits={edits} items={data.items} />
        </Box>
      </Box>
    </Box>
  );
});

export default SystemMenu;
