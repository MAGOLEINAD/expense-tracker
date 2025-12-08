import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Stack,
} from '@mui/material';
import { useState, useEffect } from 'react';
import type { Expense, Currency, PaymentStatus, UserCategory } from '@/types';
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from '@/utils';
import { format } from 'date-fns';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (expense: Partial<Expense>) => void;
  expense?: Expense | null;
  selectedMonth: number;
  selectedYear: number;
  categories: UserCategory[];
}

const statusOptions: { value: PaymentStatus; label: string }[] = PAYMENT_STATUSES.map(status => ({
  value: status,
  label: PAYMENT_STATUS_LABELS[status],
}));


export const ExpenseDialog = ({
  open,
  onClose,
  onSave,
  expense,
  selectedMonth,
  selectedYear,
  categories,
}: ExpenseDialogProps) => {
  const defaultCategory = categories.length > 0 ? categories[0].id! : '';

  const [formData, setFormData] = useState<Partial<Expense>>({
    item: '',
    vto: format(new Date(), 'yyyy-MM-dd'),
    fechaPago: format(new Date(), 'yyyy-MM-dd'),
    importe: 0,
    currency: 'ARS',
    pagadoPor: '',
    status: 'pendiente',
    category: defaultCategory,
    month: selectedMonth,
    year: selectedYear,
  });

  useEffect(() => {
    if (expense) {
      // Si viene de template o tiene fechas vacías, setear a hoy
      const today = format(new Date(), 'yyyy-MM-dd');
      setFormData({
        ...expense,
        vto: expense.vto && expense.vto !== '' ? expense.vto : today,
        fechaPago: expense.fechaPago && expense.fechaPago !== '' ? expense.fechaPago : today,
      });
    } else {
      const newDefaultCategory = categories.length > 0 ? categories[0].id! : '';
      setFormData({
        item: '',
        vto: format(new Date(), 'yyyy-MM-dd'),
        fechaPago: format(new Date(), 'yyyy-MM-dd'),
        importe: 0,
        currency: 'ARS',
        pagadoPor: '',
        status: 'pendiente',
        category: newDefaultCategory,
        month: selectedMonth,
        year: selectedYear,
      });
    }
  }, [expense, selectedMonth, selectedYear, categories]);

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{expense ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            fullWidth
            label="Categoría"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Item"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
            />
            <TextField
              fullWidth
              label="Pagado Por"
              value={formData.pagadoPor}
              onChange={(e) => setFormData({ ...formData, pagadoPor: e.target.value })}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              type="date"
              label="Vencimiento"
              value={formData.vto}
              onChange={(e) => setFormData({ ...formData, vto: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="date"
              label="Fecha de Pago"
              value={formData.fechaPago}
              onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              fullWidth
              label="Estado"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentStatus })}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Importe"
              value={formData.importe}
              onChange={(e) => setFormData({ ...formData, importe: Number(e.target.value) })}
              inputProps={{ step: '0.01' }}
              sx={{ flex: 2 }}
            />
            <TextField
              select
              fullWidth
              label="Moneda"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
              sx={{ flex: 1 }}
            >
              <MenuItem value="ARS">$ ARS</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
            </TextField>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
