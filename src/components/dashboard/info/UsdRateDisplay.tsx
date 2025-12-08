import { Box, Typography, CircularProgress } from '@mui/material';

interface UsdRateDisplayProps {
  venta: number;
  loading: boolean;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const UsdRateDisplay = ({ venta, loading, onClick }: UsdRateDisplayProps) => {
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
        minWidth: 110,
      }}
    >
      <Typography variant="caption" sx={{ color: '#01579b', fontSize: '0.65rem', display: 'block', lineHeight: 1, fontWeight: 600 }}>
        Dólar Oficial
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
          <CircularProgress size={14} sx={{ color: '#00897b' }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#00897b' }}>
            Cargando...
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.3, color: '#00897b' }}>
          $ {venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </Typography>
      )}
    </Box>
  );
};
