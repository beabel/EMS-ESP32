import { createTheme } from '@mui/material/styles';

// Eigenes Design für Zuhause und Systemmenü (Farben und Rundungen aus dem Mockup).
// Gilt nur für diese Seiten, die übrigen Seiten behalten das Standard-Theme.
export const systemTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#5aa9f5', contrastText: '#06121f' },
    secondary: { main: '#5aa9f5' },
    info: { main: '#5aa9f5' },
    success: { main: '#4cc27d' },
    warning: { main: '#e6a23c', contrastText: '#101418' },
    error: { main: '#ef7b6e' },
    background: { default: '#12161b', paper: '#1b2128' },
    text: { primary: '#e8edf2', secondary: '#9aa8b6', disabled: '#6b7a89' },
    divider: '#2f3945',
    action: {
      active: '#9aa8b6',
      hover: '#242c35',
      selected: '#1b2c40',
      disabledBackground: '#242c35'
    }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 14.5,
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } }
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: 10 } }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: '#242c35' }
      }
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 700 } }
    }
  }
});
