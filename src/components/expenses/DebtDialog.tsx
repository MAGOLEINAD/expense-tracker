import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  InputAdornment,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CloseIcon from '@mui/icons-material/Close';

interface DebtDialogProps {
  open: boolean;
  initialDebt?: number;
  onClose: () => void;
  onSave: (debt: number) => void;
}

export const DebtDialog = ({ open, initialDebt = 0, onClose, onSave }: DebtDialogProps) => {
  const [debt, setDebt] = useState(initialDebt.toString());
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setDebt(initialDebt > 0 ? initialDebt.toString() : '');
    setError('');
  }, [initialDebt, open]);

  const handleSave = () => {
    const debtValue = parseFloat(debt);

    if (isNaN(debtValue) || debtValue < 0) {
      setError('Ingresa un valor válido mayor o igual a 0');
      return;
    }

    onSave(debtValue);
    onClose();
  };

  const handleDelete = () => {
    onSave(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {initialDebt ? 'Editar Deuda' : 'Agregar Deuda'}
        {isMobile && (
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="cerrar">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {initialDebt > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Deuda actual: <strong>${initialDebt.toLocaleString('es-AR')}</strong>
            </Alert>
          )}
          <TextField
            fullWidth
            type="number"
            label="Monto de la deuda"
            value={debt}
            onChange={(e) => {
              setDebt(e.target.value);
              setError('');
            }}
            error={!!error}
            helperText={error || 'Ingresa el monto que aún debes'}
            autoFocus
            slotProps={{
              htmlInput: { min: 0, step: 0.01 },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyIcon sx={{ color: '#ef4444' }} />
                  </InputAdornment>
                ),
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        {initialDebt > 0 && (
          <Button onClick={handleDelete} color="error" sx={{ mr: 'auto' }}>
            Eliminar Deuda
          </Button>
        )}
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="error">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
