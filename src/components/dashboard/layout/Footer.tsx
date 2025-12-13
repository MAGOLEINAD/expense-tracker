import { Box, Typography, Divider, Stack } from '@mui/material';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        mb: 2,
        textAlign: 'center',
      }}
    >
      <Divider sx={{ mb: 2, opacity: 0.3 }} />

      <Stack spacing={0.5} alignItems="center">
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          Administrador de Gastos
        </Typography>

        <Typography
          variant="caption"
          sx={{
            background: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: 0.5,
          }}
        >
          LEINAD
        </Typography>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontSize: '0.7rem', mt: 0.5 }}
        >
          © {currentYear}
        </Typography>
      </Stack>
    </Box>
  );
};
