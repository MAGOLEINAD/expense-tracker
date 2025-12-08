import { Box, Typography } from '@mui/material';

interface UsdRateDisplayProps {
  venta: number;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const UsdRateDisplay = ({ venta, onClick }: UsdRateDisplayProps) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        px: 1.5,
        py: 0.5,
        borderRadius: 1.5,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'white',
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        },
        transition: 'all 0.2s',
      }}
    >
      <Typography variant="caption" sx={{ color: '#01579b', fontSize: '0.65rem', display: 'block', lineHeight: 1, fontWeight: 600 }}>
        Dólar Oficial
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.3, color: '#00897b' }}>
        $ {venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </Typography>
    </Box>
  );
};
