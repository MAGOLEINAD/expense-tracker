import { useState } from 'react';
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
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { MONTHS } from '@/utils';

interface TemplateDialogProps {
  open: boolean;
  selectedMonth: number;
  selectedYear: number;
  hasExpenses: boolean;
  onClose: () => void;
  onApplyTemplate: (sourceMonth: number, sourceYear: number) => void;
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

  const handleApply = () => {
    onApplyTemplate(sourceMonth, sourceYear);
    onClose();
  };

  const handleClear = () => {
    onClearMonth();
    onClose();
  };

  return (
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
  );
};
