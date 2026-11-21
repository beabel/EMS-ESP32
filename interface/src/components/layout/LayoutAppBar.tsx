import { memo } from 'react';
import { LuArrowLeft, LuMenu } from 'react-icons/lu';
import { Link, useLocation, useNavigate } from 'react-router';

import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

import { useI18nContext } from 'i18n/i18n-react';

export const DRAWER_WIDTH = 210;

interface LayoutAppBarProps {
  title: string;
  onToggleDrawer: () => void;
}

// Extract static styles
const appBarStyles: SxProps<Theme> = {
  width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
  ml: { md: `${DRAWER_WIDTH}px` },
  boxShadow: 'none',
  backgroundImage: 'none',
  backgroundColor: 'background.default',
  color: 'text.primary',
  borderBottom: 1,
  borderColor: 'divider'
};

const menuButtonStyles: SxProps<Theme> = {
  mr: 2,
  display: { md: 'none' }
};

const backButtonStyles: SxProps<Theme> = {
  mr: 1,
  fontSize: 20,
  verticalAlign: 'middle'
};

const LayoutAppBarComponent = ({ title, onToggleDrawer }: LayoutAppBarProps) => {
  const { LL } = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();

  const pathnames = location.pathname.split('/').filter((x) => x);

  const handleBackClick = () => {
    void navigate('/' + pathnames[0]);
  };

  return (
    <AppBar position="fixed" sx={appBarStyles}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onToggleDrawer}
          sx={menuButtonStyles}
        >
          <LuMenu size={22} />
        </IconButton>

        {pathnames.length > 1 &&
          (pathnames[0] === 'status' || pathnames[0] === 'settings') && (
            <>
              <IconButton
                sx={backButtonStyles}
                color="primary"
                edge="start"
                onClick={handleBackClick}
              >
                <LuArrowLeft size={20} />
              </IconButton>

              <Link
                to={'/' + pathnames[0]}
                style={{ textDecoration: 'none', color: 'white' }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {pathnames[0] === 'status' ? LL.STATUS_OF('') : LL.SETTINGS(0)}
                  <span style={{ color: '#5aa9f5' }}>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
                </Typography>
              </Link>
            </>
          )}

        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

const LayoutAppBar = memo(LayoutAppBarComponent);

export default LayoutAppBar;
