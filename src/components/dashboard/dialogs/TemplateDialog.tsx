import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { MONTHS } from '@/utils';

interface TemplateDialogProps {
  open: boolean;
  selectedMonth: number;
  selectedYear: number;
  hasExpenses: boolean;
  onClose: () => void;
  onApplyTemplate: (
    sourceMonth: number,
    sourceYear: number,
    keepCardLinks: boolean,
    keepRecurringExpenses: boolean,
    keepPagoAnual: boolean,
    keepBonificado: boolean
  ) => void;
  onClearMonth: () => void;
}

export const TemplateDialog = ({
  open,
  selectedMonth,
  selectedYear,
  hasExpenses,
  onClose,
  onApplyTemplate,
  onClearMonth,
}: TemplateDialogProps) => {
  const [sourceMonth, setSourceMonth] = useState(12);
  const [sourceYear, setSourceYear] = useState(new Date().getFullYear());
  const [keepCardLinks, setKeepCardLinks] = useState(true);
  const [keepRecurringExpenses, setKeepRecurringExpenses] = useState(false);
  const [keepPagoAnual, setKeepPagoAnual] = useState(true);
  const [keepBonificado, setKeepBonificado] = useState(true);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Resetear switches cada vez que se abre el modal
  useEffect(() => {
    if (open) {
      setKeepCardLinks(true);
      setKeepRecurringExpenses(false);
      setKeepPagoAnual(true);
      setKeepBonificado(true);
    }
  }, [open]);

  const handleApply = () => {
    onApplyTemplate(sourceMonth, sourceYear, keepCardLinks, keepRecurringExpenses, keepPagoAnual, keepBonificado);
    onClose();
  };

  const handleClear = () => {
    setConfirmClearOpen(true);
  };

  const handleConfirmClear = () => {
    onClearMonth();
    setConfirmClearOpen(false);
    onClose();
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ContentCopyIcon color="primary" />
          <Typography variant="h6">Aplicar Template</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Los gastos se copiarán como "pendientes" sin valores.
        </Alert>
        <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Copiar gastos desde:
        </Typography>
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Mes origen</InputLabel>
            <Select
              value={sourceMonth}
              label="Mes origen"
              onChange={(e) => setSourceMonth(Number(e.target.value))}
            >
              {MONTHS.map((month, index) => (
                <MenuItem key={month} value={index + 1}>{month}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Año origen</InputLabel>
            <Select
              value={sourceYear}
              label="Año origen"
              onChange={(e) => setSourceYear(Number(e.target.value))}
            >
              {[2023, 2024, 2025, 2026, 2027].map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={keepCardLinks}
                onChange={(e) => setKeepCardLinks(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                Mantener gastos asociados a TCs
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={keepRecurringExpenses}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setKeepRecurringExpenses(checked);
                  // Si se desactiva el master switch, desactivar los específicos
                  if (!checked) {
                    setKeepPagoAnual(false);
                    setKeepBonificado(false);
                  } else {
                    // Si se activa el master switch, activar ambos por defecto
                    setKeepPagoAnual(true);
                    setKeepBonificado(true);
                  }
                }}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" fontWeight={600}>
                Mantener gastos recurrentes (Pago Anual y Bonificado)
              </Typography>
            }
          />
          {keepRecurringExpenses && (
            <Box sx={{ pl: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={keepPagoAnual}
                    onChange={(e) => setKeepPagoAnual(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Mantener gastos con estado "Pago Anual"
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={keepBonificado}
                    onChange={(e) => setKeepBonificado(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Mantener gastos con estado "Bonificado"
                  </Typography>
                }
              />
            </Box>
          )}
          <Alert severity="success">
            Destino: <strong>{MONTHS[selectedMonth - 1]} {selectedYear}</strong>
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={handleClear}
          color="error"
          variant="outlined"
          disabled={!hasExpenses}
        >
          Limpiar Mes Actual
        </Button>
        <Box>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button onClick={handleApply} variant="contained" startIcon={<ContentCopyIcon />}>
            Aplicar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>

    {/* Dialog de confirmación para limpiar mes */}
    <Dialog
      open={confirmClearOpen}
      onClose={() => setConfirmClearOpen(false)}
      maxWidth="sm"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" component="span" sx={{ color: 'error.main', fontWeight: 700 }}>
          ⚠️ Confirmar Eliminación
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body1">
            Estás a punto de <strong>eliminar TODOS los gastos</strong> de:
          </Typography>
          <Alert severity="warning" sx={{ fontWeight: 600 }}>
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </Alert>
          <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
            ⚠️ Esta acción NO se puede deshacer.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Se eliminarán permanentemente todos los gastos, incluidos:
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Gastos pendientes y pagados
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Gastos asociados a tarjetas de crédito
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Comentarios y archivos adjuntos
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Todas las categorías del mes
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 600, pt: 1 }}>
            ¿Estás seguro de que deseas continuar?
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={() => setConfirmClearOpen(false)}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmClear}
          color="error"
          variant="contained"
          sx={{ fontWeight: 600 }}
        >
          Sí, Eliminar Todo
        </Button>
      </DialogActions>
    </Dialog>
  </>
  );
};
