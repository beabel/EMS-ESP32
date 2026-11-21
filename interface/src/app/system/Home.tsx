import { memo } from 'react';
import type { ReactNode } from 'react';
import { LuDroplets, LuFlame, LuHeater, LuWrench } from 'react-icons/lu';
import { Link } from 'react-router';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography
} from '@mui/material';

import { useLayoutTitle } from 'components';

import { faultSummary, useFaultCards } from './Faults';
import { PendingBar, ValueControl, useFormat } from './ValueRow';
import { findItem, str } from './model';
import type { SysItem } from './model';
import { useTexts } from './texts';
import type { Texts } from './texts';
import { useEdits, useSystemData } from './useSystemData';
import type { Edits } from './useSystemData';

type DotColor = 'warm' | 'ok' | 'idle';

const Dot = ({ color }: { color: DotColor }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      width: 9,
      height: 9,
      borderRadius: '50%',
      mr: 0.75,
      bgcolor:
        color === 'warm'
          ? 'warning.main'
          : color === 'ok'
            ? 'success.main'
            : 'text.disabled'
    }}
  />
);

const isOn = (item: SysItem | undefined): boolean =>
  !!item && /^(1|on|an|true|ein)$/i.test(str(item.dv.v).trim());

const Tile = ({
  icon,
  title,
  sub,
  children
}: {
  icon: ReactNode;
  title: string;
  sub?: ReactNode;
  children: ReactNode;
}) => (
  <Box
    sx={{
      bgcolor: 'background.paper',
      border: 1,
      borderColor: 'divider',
      borderRadius: '18px',
      p: 2.25,
      boxShadow: 1
    }}
  >
    <Typography
      component="div"
      sx={{
        fontSize: 17,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <Box component="span" sx={{ display: 'inline-flex', color: 'primary.main' }}>
        {icon}
      </Box>
      {title}
    </Typography>
    <Typography
      component="div"
      sx={{ fontSize: 13, color: 'text.secondary', mb: 1.5, minHeight: 20 }}
    >
      {sub}
    </Typography>
    {children}
  </Box>
);

// große Zahl mit kleiner Einheit, z. B. 19,4 °C
const Big = ({ item }: { item: SysItem | undefined }) => {
  const format = useFormat();
  const text = item ? format(item.dv.v, item.dv.u) : '';
  const m = /^(.*?)\s+(\S+)$/.exec(text);
  return (
    <Typography
      component="div"
      sx={{
        fontSize: 40,
        fontWeight: 700,
        lineHeight: 1.05,
        fontVariantNumeric: 'tabular-nums'
      }}
    >
      {text === '' ? '–' : m ? m[1] : text}
      {m && (
        <Box
          component="span"
          sx={{ fontSize: 17, fontWeight: 500, color: 'text.secondary', ml: 0.5 }}
        >
          {m[2]}
        </Box>
      )}
    </Typography>
  );
};

const Caption = ({ children }: { children: ReactNode }) => (
  <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.5 }}>
    {children}
  </Typography>
);

const Line = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 1.5,
      mb: 1.5
    }}
  >
    <Typography>{label}</Typography>
    {children}
  </Box>
);

const Kv = ({ label, item }: { label: string; item: SysItem | undefined }) => {
  const format = useFormat();
  const t = useTexts();
  if (!item) return null;
  return (
    <>
      <Typography sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography
        sx={{
          textAlign: 'right',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {(format(item.dv.v, item.dv.u) || '–').replace(
          /\s*-\s*now$/i,
          ' ' + t('FAULT_UNTIL_NOW')
        )}
      </Typography>
    </>
  );
};

const Control = ({
  item,
  edits,
  t
}: {
  item: SysItem | undefined;
  edits: Edits;
  t: Texts;
}) =>
  item ? (
    <ValueControl
      variant="tile"
      item={item}
      value={edits.value(item)}
      onChange={(v) => edits.set(item, v)}
      onRun={() => void edits.run(item, t('SENT'))}
      t={t}
    />
  ) : null;

const Home = memo(() => {
  const t = useTexts();
  useLayoutTitle(t('HOME'));
  const data = useSystemData();
  const edits = useEdits(data);
  const { cards } = useFaultCards(data.items);
  const it = data.items;
  const f = (key: string, tag?: string) => findItem(it, key, tag);

  const hcTags = [
    ...new Set(
      it
        .filter((i) => /^hc\d$/.test(i.tag) && i.key.startsWith('thermostat:hc/'))
        .map((i) => i.tag)
    )
  ].sort();

  if (data.loading && it.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (it.length === 0) {
    return (
      <Alert severity={data.error ? 'error' : 'info'}>
        {data.error ?? t('NO_DATA')}
      </Alert>
    );
  }

  const burner = f('boiler:burngas');
  const last = faultSummary(cards);
  const dhwCur = f('boiler:dhw/curtemp');
  const dhwSet = f('thermostat:dhw/settemp') ?? f('boiler:dhw/seltemp');
  const dhwMode = f('thermostat:dhw/mode');
  const dhwCharge = f('thermostat:dhw/charge');

  return (
    <Box>
      <Typography sx={{ fontSize: 24, fontWeight: 700 }}>{t('HOME')}</Typography>
      <Typography sx={{ color: 'text.secondary', mb: 2 }}>
        {t('HOME_SUB')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          alignItems: 'start'
        }}
      >
        {hcTags.map((tag) => {
          const modeType = f('thermostat:hc/modetype', tag);
          const eco = /eco|abgesenkt|night|nacht/i.test(str(modeType?.dv.v));
          const sel = f('thermostat:hc/seltemp', tag);
          return (
            <Tile
              key={tag}
              icon={<LuHeater size={20} />}
              title={t('HC', tag.slice(2))}
              sub={
                modeType && (
                  <>
                    <Dot color={eco ? 'idle' : 'warm'} />
                    {str(modeType.dv.v)}
                  </>
                )
              }
            >
              <Big item={f('thermostat:hc/currtemp', tag)} />
              <Caption>{t('ROOM_TEMP')}</Caption>
              {sel && (
                <Line label={t('WISH')}>
                  <Control item={sel} edits={edits} t={t} />
                </Line>
              )}
              <Control item={f('thermostat:hc/mode', tag)} edits={edits} t={t} />
            </Tile>
          );
        })}

        {(dhwMode ?? dhwCur) && (
          <Tile
            icon={<LuDroplets size={20} />}
            title={t('DHW')}
            sub={
              isOn(f('boiler:tapwateractive')) ? (
                <>
                  <Dot color="warm" />
                  {t('DHW_HEATING')}
                </>
              ) : (
                <>
                  <Dot color="ok" />
                  {t('READY')}
                </>
              )
            }
          >
            <Big item={dhwCur ?? dhwSet} />
            <Caption>{t('CURRENT')}</Caption>
            {dhwSet && (
              <Line label={t('WISH')}>
                <Control item={dhwSet} edits={edits} t={t} />
              </Line>
            )}
            <Control item={dhwMode} edits={edits} t={t} />
            {dhwCharge && (
              <Box sx={{ mt: 1.5 }}>
                <Line label={t('ONE_TIME')}>
                  <Control item={dhwCharge} edits={edits} t={t} />
                </Line>
              </Box>
            )}
          </Tile>
        )}

        {f('boiler:curflowtemp') && (
          <Tile
            icon={<LuFlame size={20} />}
            title={t('HEATING')}
            sub={
              <>
                <Dot color={isOn(burner) ? 'warm' : 'ok'} />
                {isOn(burner) ? t('BURNER_ON') : t('BURNER_OFF')}
              </>
            }
          >
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 0.75 }}
            >
              <Kv label={t('OUTDOOR')} item={f('boiler:outdoortemp')} />
              <Kv label={t('FLOW')} item={f('boiler:curflowtemp')} />
              <Kv label={t('RETURN')} item={f('boiler:rettemp')} />
              <Kv label={t('PRESSURE')} item={f('boiler:syspress')} />
              <Kv label={t('POWER')} item={f('boiler:curburnpow')} />
            </Box>
          </Tile>
        )}

        <Tile icon={<LuWrench size={20} />} title={t('NOTES')} sub={t('NOTES_SUB')}>
          {last && (
            <Box
              sx={{
                borderLeft: 4,
                borderColor: last.entry ? 'warning.main' : 'divider',
                pl: 1.5,
                py: 0.5,
                mb: 1.5
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                {last.entry && (
                  <Chip
                    size="small"
                    color="warning"
                    label={t(`SEV_${last.entry.severity}`)}
                  />
                )}
                <Typography sx={{ fontWeight: 700 }}>
                  {last.code}
                  {last.add ? `(${last.add})` : ''}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13 }}>
                {last.entry
                  ? last.entry.title
                  : last.applies
                    ? t('FAULT_UNKNOWN')
                    : ''}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              rowGap: 0.75,
              mb: 1.5
            }}
          >
            <Kv label={t('LAST_FAULT')} item={f('boiler:lastcode')} />
            <Kv label={t('MAINT_MSG')} item={f('boiler:maintenancemessage')} />
            <Kv label={t('NEXT_MAINT')} item={f('boiler:maintenancedate')} />
          </Box>
          <Button
            component={Link}
            to="/system/service"
            size="small"
            variant="outlined"
          >
            {t('GOTO_SERVICE')}
          </Button>
        </Tile>
      </Box>
      <PendingBar edits={edits} items={it} />
    </Box>
  );
});

export default Home;
