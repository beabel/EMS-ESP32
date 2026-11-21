import { memo } from 'react';
import type { FC } from 'react';

import {
  CssBaseline,
  ThemeProvider,
  responsiveFontSizes,
  tooltipClasses
} from '@mui/material';
import { createTheme } from '@mui/material/styles';

import type { RequiredChildrenProps } from 'utils';

export const dialogStyle = {
  '& .MuiDialog-paper': {
    borderRadius: '18px',
    borderColor: '#2f3945',
    borderStyle: 'solid',
    borderWidth: '1px',
    backgroundImage: 'none'
  }
} as const;

const theme = responsiveFontSizes(
  createTheme({
    typography: {
      fontSize: 13,
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    },
    shape: { borderRadius: 12 },
    palette: {
      mode: 'dark',
      primary: { main: '#5aa9f5', contrastText: '#06121f' },
      background: { default: '#12161b', paper: '#1b2128' },
      divider: '#2f3945',
      action: { active: '#9aa8b6', hover: '#242c35', selected: '#1b2c40' },
      secondary: {
        main: '#2196f3' // blue[500]
      },
      info: {
        main: '#607d8b' // blueGrey[500]
      },
      text: {
        primary: '#e8edf2',
        secondary: '#9aa8b6',
        disabled: '#eee' // white
      }
    },
    components: {
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } }
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            fontSize: 14
          },
          secondary: {
            color: '#9e9e9e' // grey[500]
          }
        }
      },
      MuiTooltip: {
        defaultProps: {
          placement: 'top',
          arrow: true
        },
        styleOverrides: {
          tooltip: {
            padding: '4px 8px',
            fontSize: 10,
            color: 'rgba(0, 0, 0, 0.87)',
            backgroundColor: '#4caf50', // MUI success.main default color
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
            [`& .${tooltipClasses.arrow}`]: {
              color: '#4caf50'
            }
          }
        }
      }
    }
  })
);

const CustomTheme: FC<RequiredChildrenProps> = memo(({ children }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
));

export default CustomTheme;
