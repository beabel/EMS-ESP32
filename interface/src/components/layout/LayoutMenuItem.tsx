import { memo } from 'react';
import type { IconType } from 'react-icons';
import { Link, useLocation } from 'react-router';

import { Box, ListItemButton, ListItemText } from '@mui/material';

import { routeMatches } from 'utils';

interface LayoutMenuItemProps {
  icon: IconType;
  label: string;
  to: string;
  disabled?: boolean;
  badge?: boolean;
}

const LayoutMenuItemComponent = ({
  icon: Icon,
  label,
  to,
  disabled,
  badge
}: LayoutMenuItemProps) => {
  const { pathname } = useLocation();
  const selected = routeMatches(to, pathname);

  return (
    <ListItemButton
      component={Link}
      to={to}
      disabled={disabled || false}
      selected={selected}
      sx={{
        gap: 1.25,
        mx: 1,
        my: '2px',
        px: 1.25,
        py: 0.9,
        borderRadius: '10px',
        color: selected ? 'primary.main' : 'text.primary',
        bgcolor: selected ? 'action.selected' : 'transparent',
        '&:hover': { bgcolor: selected ? 'action.selected' : 'action.hover' },
        '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'action.selected' }
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          flex: 'none',
          display: 'grid',
          placeItems: 'center',
          borderRadius: '8px',
          bgcolor: selected ? 'background.paper' : 'action.hover'
        }}
      >
        <Icon size={16} />
      </Box>
      <ListItemText
        primary={label}
        sx={{ m: 0 }}
        slotProps={{
          primary: {
            sx: { fontSize: 14, fontWeight: selected ? 700 : 500, lineHeight: 1.3 }
          }
        }}
      />
      {badge && (
        <Box
          aria-label="update available"
          sx={{
            width: 8,
            height: 8,
            ml: 1,
            borderRadius: '50%',
            backgroundColor: '#ffeb3b',
            boxShadow: '0 0 6px rgba(255, 235, 59, 0.8)',
            flexShrink: 0
          }}
        />
      )}
    </ListItemButton>
  );
};

const LayoutMenuItem = memo(LayoutMenuItemComponent);

export default LayoutMenuItem;
