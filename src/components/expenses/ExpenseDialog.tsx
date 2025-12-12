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
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Typography,
  Alert,
} from '@mui/material';
import { useState, useEffect } from 'react';
import type { Expense, Currency, PaymentStatus, UserCategory } from '@/types';
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  isCreditCard,
} from '@/utils';
import { format } from 'date-fns';
import { IconSelector } from './IconSelector';
import * as MuiIcons from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Tooltip } from '@mui/material';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (expense: Partial<Expense>) => void;
  expense?: Expense | null;
  selectedMonth: number;
  selectedYear: number;
  categories: UserCategory[];
  onOpenCategoryManager?: () => void;
  usdRate?: number;
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
  onOpenCategoryManager,
  usdRate = 1200,
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

  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);
  const [importeText, setImporteText] = useState('0');

  // Estados para TCs
  const [cardTotalARS, setCardTotalARS] = useState(0);
  const [cardTotalUSD, setCardTotalUSD] = useState(0);
  const [cardUSDRate, setCardUSDRate] = useState(usdRate);

  const isTC = formData.item ? isCreditCard({ ...formData, id: expense?.id } as Expense) : false;

  useEffect(() => {
    if (expense) {
      // Si viene de template o tiene fechas vacías, setear a hoy
      const today = format(new Date(), 'yyyy-MM-dd');
      setFormData({
        ...expense,
        vto: expense.vto && expense.vto !== '' ? expense.vto : today,
        fechaPago: expense.fechaPago && expense.fechaPago !== '' ? expense.fechaPago : today,
      });
      setImporteText(String(expense.importe || 0).replace('.', ','));

      // Cargar valores de TC si existe, sino usar default de la API
      setCardTotalARS(expense.cardTotalARS || 0);
      setCardTotalUSD(expense.cardTotalUSD || 0);
      // Si la TC ya tiene una cotización guardada, usarla; sino usar la de la API
      setCardUSDRate(expense.cardUSDRate || usdRate);
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
      setImporteText('0');
      setCardTotalARS(0);
      setCardTotalUSD(0);
      setCardUSDRate(usdRate);
    }
  }, [expense, selectedMonth, selectedYear, categories, usdRate]);

  const handleSelectIcon = (iconName: string) => {
    setFormData({ ...formData, icon: iconName });
  };

  // Obtener el componente de icono seleccionado
  const SelectedIconComponent = formData.icon ? (MuiIcons as any)[formData.icon] : null;

  const handleSubmit = () => {
    // Limpiar campos undefined antes de guardar
    // Firestore no acepta undefined, solo null o omitir el campo
    const cleanedData: Partial<Expense> = {};
    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof Partial<Expense>];
      if (value !== undefined) {
        (cleanedData as any)[key] = value;
      }
    });

    // Si es una TC, agregar los valores de TC y calcular el importe automáticamente
    if (isTC) {
      cleanedData.cardTotalARS = cardTotalARS;
      cleanedData.cardTotalUSD = cardTotalUSD;
      cleanedData.cardUSDRate = cardUSDRate;

      // Calcular el importe de la TC
      const cardFinalTotal = cardTotalARS + (cardTotalUSD * cardUSDRate);
      // Nota: No podemos calcular los gastos asociados aquí porque no tenemos acceso a la lista completa
      // El importe se calculará en el ExpenseTable
      cleanedData.importe = cardFinalTotal;
    }

    onSave(cleanedData);
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
            onChange={(e) => {
              if (e.target.value === '__add_new__') {
                if (onOpenCategoryManager) {
                  onOpenCategoryManager();
                }
              } else {
                setFormData({ ...formData, category: e.target.value });
              }
            }}
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
            {onOpenCategoryManager && (
              <MenuItem value="__add_new__" sx={{ color: 'primary.main', fontWeight: 600 }}>
                <ListItemIcon>
                  <AddIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Agregar nueva categoría" />
              </MenuItem>
            )}
          </TextField>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              label="Item"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              InputProps={{
                startAdornment: SelectedIconComponent && (
                  <InputAdornment position="start">
                    <SelectedIconComponent sx={{ color: formData.iconColor || '#2196f3' }} />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton
              onClick={() => setIconSelectorOpen(true)}
              color="primary"
              sx={{ flexShrink: 0 }}
            >
              <SearchIcon />
            </IconButton>
            {formData.icon && (
              <TextField
                type="color"
                value={formData.iconColor || '#2196f3'}
                onChange={(e) => setFormData({ ...formData, iconColor: e.target.value })}
                sx={{ width: 80, flexShrink: 0 }}
                InputLabelProps={{ shrink: true }}
              />
            )}
            <TextField
              fullWidth
              label="Pagado Por"
              value={formData.pagadoPor}
              onChange={(e) => setFormData({ ...formData, pagadoPor: e.target.value })}
            />
            {isTC && (
              <TextField
                select
                label="Moneda"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                sx={{ width: 120, flexShrink: 0 }}
              >
                <MenuItem value="ARS">$ ARS</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            )}
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

          {isTC ? (
            // Campos especiales para TCs
            <>
              <Alert severity="info" sx={{ mb: 1 }}>
                Para gastos de TC, el importe se calcula automáticamente. Use el icono de "Detalle" en la tabla para asociar gastos.
              </Alert>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField
                  label="Total ARS"
                  type="number"
                  value={cardTotalARS}
                  onChange={(e) => setCardTotalARS(Number(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography>,
                  }}
                />
                <TextField
                  label="Total USD"
                  type="number"
                  value={cardTotalUSD}
                  onChange={(e) => setCardTotalUSD(Number(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>USD</Typography>,
                  }}
                />
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <TextField
                    label="Cotización USD"
                    type="number"
                    fullWidth
                    value={cardUSDRate}
                    onChange={(e) => setCardUSDRate(Number(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography>,
                    }}
                  />
                  <Tooltip title="Recargar cotización de la API" arrow>
                    <IconButton
                      size="small"
                      onClick={() => setCardUSDRate(usdRate)}
                      color="primary"
                      sx={{ flexShrink: 0, mt: 0.5 }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Final de la TC:
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  $ {(cardTotalARS + (cardTotalUSD * cardUSDRate)).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  El importe final se calculará restando los gastos asociados
                </Typography>
              </Box>
            </>
          ) : (
            // Campos normales para gastos regulares
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Importe"
                value={importeText}
                onChange={(e) => {
                  let value = e.target.value;
                  // Reemplazar puntos por comas
                  value = value.replace(/\./g, ',');
                  // Solo permitir números, una coma y opcionalmente signo negativo
                  if (value === '' || value === '-' || /^-?\d*,?\d*$/.test(value)) {
                    setImporteText(value);
                    // Convertir a número para guardar en formData
                    const numValue = value.replace(',', '.');
                    const num = numValue === '' || numValue === '-' ? 0 : parseFloat(numValue);
                    if (!isNaN(num)) {
                      setFormData({ ...formData, importe: num });
                    }
                  }
                }}
                inputProps={{ inputMode: 'decimal' }}
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
          )}

          <TextField
            fullWidth
            type="number"
            label="Deuda pendiente (opcional)"
            value={formData.debt || ''}
            onChange={(e) => setFormData({ ...formData, debt: e.target.value ? Number(e.target.value) : undefined })}
            inputProps={{ step: '0.01', min: 0 }}
            helperText="Ingresa el monto que aún debes de este gasto"
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comentario (opcional)"
            value={formData.comment || ''}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value || undefined })}
            placeholder="Agrega un comentario sobre este gasto..."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">
          Guardar
        </Button>
      </DialogActions>

      <IconSelector
        open={iconSelectorOpen}
        selectedIcon={formData.icon}
        onClose={() => setIconSelectorOpen(false)}
        onSelect={handleSelectIcon}
      />
    </Dialog>
  );
};
