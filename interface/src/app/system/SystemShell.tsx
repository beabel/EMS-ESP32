import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';

import {
  Box,
  Button,
  InputAdornment,
  TextField,
  ThemeProvider
} from '@mui/material';

import { usePersistState } from 'utils';

import { Segmented } from './Segmented';
import { systemTheme } from './systemTheme';
import { useTexts } from './texts';

interface ShellState {
  level: 1 | 2; // 1 = Normal, 2 = Alle Werte
  q: string; // Suchbegriff
  setLevel: (l: 1 | 2) => void;
  setQ: (q: string) => void;
}

const ShellContext = createContext<ShellState>({
  level: 1,
  q: '',
  setLevel: () => undefined,
  setQ: () => undefined
});

export const useShell = () => useContext(ShellContext);

// Gemeinsamer Rahmen für Start und Systemmenü: Umschalter, Suche und Detailstufe
// stehen auf beiden Seiten an derselben Stelle.
const SystemShell = () => {
  const t = useTexts();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [level, setLevel] = usePersistState<1 | 2>(1, 'system-level');
  const [q, setQ] = useState('');
  const onHome = pathname.startsWith('/home');

  // Suche von der Startseite aus öffnet das Systemmenü mit den Treffern
  useEffect(() => {
    if (q.trim() && onHome) void navigate('/system');
  }, [q, onHome, navigate]);

  const state = useMemo(() => ({ level, q, setLevel, setQ }), [level, q, setLevel]);

  return (
    <ShellContext.Provider value={state}>
      <ThemeProvider theme={systemTheme}>
        <Box
          sx={{
            bgcolor: 'background.default',
            color: 'text.primary',
            minHeight: 'calc(100vh - 64px)',
            p: { xs: 1.5, md: 3 }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
              mb: 2.5
            }}
          >
            <Segmented
              value={onHome ? 'home' : 'system'}
              options={[
                { value: 'home', label: t('HOME') },
                { value: 'system', label: t('SYSTEM') }
              ]}
              onChange={(v) => {
                setQ('');
                void navigate(v === 'home' ? '/home' : '/system');
              }}
            />
            <TextField
              size="small"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('SEARCH')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LuSearch size={18} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px' }
                }
              }}
              sx={{ flex: 1, minWidth: 180, maxWidth: 420 }}
            />
            <Box sx={{ flex: 1 }} />
            <Segmented
              value={level}
              options={[
                { value: 1, label: t('LEVEL_NORMAL') },
                { value: 2, label: t('LEVEL_ALL') }
              ]}
              onChange={setLevel}
            />
            <Button component={Link} to="/devices" size="small">
              {t('CLASSIC_UI')}
            </Button>
          </Box>
          <Outlet />
        </Box>
      </ThemeProvider>
    </ShellContext.Provider>
  );
};

export default SystemShell;
