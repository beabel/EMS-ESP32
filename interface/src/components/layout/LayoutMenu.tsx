import { memo, useContext, useState } from 'react';
import {
  LuCalendarClock,
  LuChartColumn,
  LuChevronDown,
  LuCircleHelp,
  LuCircleUser,
  LuCpu,
  LuHouse,
  LuLayoutDashboard,
  LuListPlus,
  LuSettings,
  LuSlidersHorizontal,
  LuTerminal,
  LuThermometer,
  LuWrench
} from 'react-icons/lu';

import { Box, ButtonBase, List, Typography } from '@mui/material';

import { useTexts } from 'app/system/texts';
import LayoutMenuItem from 'components/layout/LayoutMenuItem';
import { AuthenticatedContext } from 'contexts/authentication';
import { useI18nContext } from 'i18n/i18n-react';

const GroupHeader = ({
  label,
  open,
  onToggle
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) => (
  <ButtonBase
    onClick={onToggle}
    sx={{
      display: 'flex',
      width: 'calc(100% - 16px)',
      mx: 1,
      mt: 1.5,
      px: 1.25,
      py: 0.75,
      borderRadius: '8px',
      justifyContent: 'space-between',
      color: 'text.secondary',
      '&:hover': { bgcolor: 'action.hover' }
    }}
  >
    <Typography
      sx={{
        fontSize: 11,
        letterSpacing: '.8px',
        textTransform: 'uppercase',
        fontWeight: 600
      }}
    >
      {label}
    </Typography>
    <Box
      sx={{
        display: 'flex',
        transform: open ? 'rotate(0)' : 'rotate(-90deg)',
        transition: '0.2s'
      }}
    >
      <LuChevronDown size={14} />
    </Box>
  </ButtonBase>
);

const LayoutMenuComponent = () => {
  const { me, versions } = useContext(AuthenticatedContext);
  const { LL } = useI18nContext();
  const t = useTexts();
  const [menuOpen, setMenuOpen] = useState(true);

  const upgradeAvailable = versions?.current?.upgradeable ?? false;

  return (
    <>
      <List component="nav" sx={{ px: 0.5 }}>
        <LayoutMenuItem icon={LuHouse} label={t('HOME')} to={`/home`} />
        <LayoutMenuItem
          icon={LuSlidersHorizontal}
          label={t('SYSTEM')}
          to={`/system`}
        />
        <LayoutMenuItem
          icon={LuLayoutDashboard}
          label="Dashboard"
          to={`/dashboard`}
        />
        <LayoutMenuItem icon={LuCpu} label={LL.DEVICES()} to={`/devices`} />

        <GroupHeader
          label={LL.MODULES()}
          open={menuOpen}
          onToggle={() => setMenuOpen((prev) => !prev)}
        />
        {menuOpen && (
          <>
            <LayoutMenuItem
              icon={LuThermometer}
              label={LL.SENSORS()}
              to={`/sensors`}
            />
            <LayoutMenuItem
              icon={LuWrench}
              label={LL.CUSTOMIZATIONS()}
              disabled={!me.admin}
              to={`/customizations`}
            />
            <LayoutMenuItem
              icon={LuTerminal}
              label={LL.COMMANDS()}
              disabled={!me.admin}
              to={`/commands`}
            />
            <LayoutMenuItem
              icon={LuCalendarClock}
              label={LL.SCHEDULER()}
              disabled={!me.admin}
              to={`/scheduler`}
            />
            <LayoutMenuItem
              icon={LuListPlus}
              label={LL.CUSTOM_ENTITIES(0)}
              disabled={!me.admin}
              to={`/customentities`}
            />
          </>
        )}
      </List>
      <List sx={{ mt: 'auto', px: 0.5, borderTop: 1, borderColor: 'divider' }}>
        <LayoutMenuItem icon={LuChartColumn} label={LL.STATUS_OF('')} to="/status" />
        <LayoutMenuItem
          icon={LuSettings}
          label={LL.SETTINGS(0)}
          disabled={!me.admin}
          to="/settings"
          badge={upgradeAvailable}
        />
        <LayoutMenuItem icon={LuCircleHelp} label={LL.HELP()} to={`/help`} />
        <LayoutMenuItem icon={LuCircleUser} label={me.username} to={`/user`} />
      </List>
    </>
  );
};

const LayoutMenu = memo(LayoutMenuComponent);

export default LayoutMenu;
