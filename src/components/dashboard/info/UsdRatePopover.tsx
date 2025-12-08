import { Popover, Box, Typography, Stack, Divider } from '@mui/material';

interface UsdRatePopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  compra: number;
  venta: number;
  onClose: () => void;
}

export const UsdRatePopover = ({ open, anchorEl, compra, venta, onClose }: UsdRatePopoverProps) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Box sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#01579b' }}>
          Dólar Oficial
        </Typography>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
              Compra
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0288d1' }}>
              $ {compra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
              Venta
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#00897b' }}>
              $ {venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Popover>
  );
};
