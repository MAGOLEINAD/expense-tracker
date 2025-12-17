import { Popover, Box, Typography, Stack, Divider, Chip } from '@mui/material';

interface UsdRatePopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  oficialCompra: number;
  oficialVenta: number;
  blueCompra: number;
  blueVenta: number;
  onClose: () => void;
}

export const UsdRatePopover = ({ open, anchorEl, oficialCompra, oficialVenta, blueCompra, blueVenta, onClose }: UsdRatePopoverProps) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      disableRestoreFocus
      disableEnforceFocus
      slotProps={{
        root: {
          slotProps: {
            backdrop: {
              invisible: false,
            },
          },
        },
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Box sx={{ p: 2.5, minWidth: 280 }}>
        {/* Dólar Oficial */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#01579b' }}>
              Dólar Oficial
            </Typography>
            <Chip label="BNA" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#e3f2fd', color: '#01579b', fontWeight: 600 }} />
          </Box>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                Compra
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0288d1' }}>
                $ {oficialCompra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                Venta
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#00897b' }}>
                $ {oficialVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Dólar Blue */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#6d28d9' }}>
              Dólar Blue
            </Typography>
            <Chip label="Informal" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#f3e8ff', color: '#6d28d9', fontWeight: 600 }} />
          </Box>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                Compra
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                $ {blueCompra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                Venta
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#7c3aed' }}>
                $ {blueVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Nota sobre el uso del blue */}
        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fef3c7', borderRadius: 1, border: '1px solid #fbbf24' }}>
          <Typography variant="caption" sx={{ color: '#92400e', fontSize: '0.7rem', display: 'block', fontWeight: 500 }}>
            💡 Los subtotales de la tabla usan el <strong>dólar blue</strong> para conversiones
          </Typography>
        </Box>
      </Box>
    </Popover>
  );
};
