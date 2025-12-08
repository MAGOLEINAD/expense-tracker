import { Box, Button, Container, Paper, Typography, Alert, Stack, Fade, Chip, useMediaQuery, useTheme } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const Login = () => {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (err: any) {
      const errorMessage = err?.code === 'auth/popup-closed-by-user'
        ? 'Inicio de sesión cancelado'
        : err?.code === 'auth/unauthorized-domain'
        ? 'Dominio no autorizado. Por favor contacta al administrador.'
        : 'Error al iniciar sesión. Intenta nuevamente.';
      setError(errorMessage);
      console.error('Error completo:', err);
      setLoading(false);
    }
  };

  const features = [
    { icon: <TrendingUpIcon />, text: 'Organiza tus gastos' },
    { icon: <SecurityIcon />, text: 'Datos seguros' },
    { icon: <SpeedIcon />, text: 'Rápido y simple' },
  ];

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: isMobile ? 'relative' : 'fixed',
        top: 0,
        left: 0,
        overflow: isMobile ? 'auto' : 'hidden',
        overflowX: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-30%',
          left: '-5%',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite',
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, minHeight: '100%', display: 'flex', alignItems: 'center', py: isMobile ? 4 : 0, px: isMobile ? 2 : 3 }}>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Fade in timeout={800}>
            <Box sx={{ display: 'flex', gap: 4, width: '100%', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
              {/* Left side - Info */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: isMobile ? '100%' : '300px',
                  maxWidth: '500px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  color: 'white',
                  gap: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <AccountBalanceWalletIcon sx={{ fontSize: 50 }} />
                  <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Expense
                    <br />
                    Tracker
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 300, lineHeight: 1.6 }}>
                  Controla tus finanzas personales de manera inteligente y organizada
                </Typography>

                <Stack spacing={2} sx={{ mt: 2 }}>
                  {features.map((feature, index) => (
                    <Fade in timeout={1000 + index * 200} key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                          }}
                        >
                          {feature.icon}
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {feature.text}
                        </Typography>
                      </Box>
                    </Fade>
                  ))}
                </Stack>
              </Box>

              {/* Right side - Login Card */}
              <Box sx={{ flex: 1, minWidth: isMobile ? '100%' : '300px', maxWidth: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper
                  elevation={24}
                  sx={{
                    p: 5,
                    width: '100%',
                    borderRadius: 4,
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  }}
                >
                  <Stack spacing={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip
                        label="Bienvenido"
                        color="primary"
                        size="small"
                        sx={{ mb: 2, fontWeight: 600 }}
                      />
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: 'primary.main',
                          mb: 1
                        }}
                      >
                        Inicia Sesión
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Accede con tu cuenta de Google para comenzar
                      </Typography>
                    </Box>

                    {error && (
                      <Fade in>
                        <Alert
                          severity="error"
                          sx={{
                            borderRadius: 2,
                            '& .MuiAlert-message': {
                              width: '100%',
                            }
                          }}
                        >
                          {error}
                        </Alert>
                      </Fade>
                    )}

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading}
                      startIcon={<GoogleIcon />}
                      onClick={handleGoogleSignIn}
                      sx={{
                        py: 1.8,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        },
                        '&:active': {
                          transform: 'translateY(0px)',
                        },
                      }}
                    >
                      {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
                    </Button>

                    <Box sx={{ textAlign: 'center', pt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Al continuar, aceptas nuestros términos de uso
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Box>
          </Fade>
        </Box>
      </Container>
    </Box>
  );
};
