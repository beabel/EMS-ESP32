import { Box, ButtonBase } from '@mui/material';

interface SegmentedProps<T extends string | number> {
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

// Segmentschalter im Stil des Mockups: abgerundete Fläche, aktive Auswahl hebt sich ab
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  fullWidth = false,
  size = 'medium'
}: SegmentedProps<T>) {
  return (
    <Box
      role="group"
      sx={{
        display: fullWidth ? 'flex' : 'inline-flex',
        flexWrap: 'wrap',
        gap: '2px',
        p: '3px',
        borderRadius: '10px',
        bgcolor: 'action.hover'
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <ButtonBase
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            sx={{
              flex: fullWidth ? '1 1 auto' : undefined,
              px: size === 'small' ? 1.25 : 1.75,
              py: size === 'small' ? 0.5 : 0.75,
              borderRadius: '8px',
              fontSize: size === 'small' ? 13 : 14,
              fontWeight: active ? 700 : 600,
              color: active ? 'text.primary' : 'text.secondary',
              bgcolor: active ? 'background.paper' : 'transparent',
              boxShadow: active ? 1 : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                '&::first-letter': { textTransform: 'uppercase' }
              }}
            >
              {o.label}
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
