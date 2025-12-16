import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
  Box,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import type { Expense } from '@/types';
import { isCreditCard, getLinkedExpenses } from '@/utils/formatters';
import * as MuiIcons from '@mui/icons-material';

interface CardLinkDialogProps {
  open: boolean;
  creditCardExpense: Expense | null;
  allExpenses: Expense[];
  usdRate: number;
  onClose: () => void;
  onSave: (linkedIds: string[], unlinkedIds: string[]) => Promise<void>;
  onUpdateCard?: (updatedCard: Expense) => Promise<void>;
}

export const CardLinkDialog = ({
  open,
  creditCardExpense,
  allExpenses,
  usdRate,
  onClose,
  onSave,
  onUpdateCard,
}: CardLinkDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Estados para los totales de la TC
  const [cardTotalARS, setCardTotalARS] = useState<number>(0);
  const [cardTotalUSD, setCardTotalUSD] = useState<number>(0);
  const [cardUSDRate, setCardUSDRate] = useState<number>(usdRate);
  const [cardTax, setCardTax] = useState<number>(0);

  // Estados de texto para manejar el punto decimal como coma
  const [cardTotalARSText, setCardTotalARSText] = useState<string>('0');
  const [cardTotalUSDText, setCardTotalUSDText] = useState<string>('0');
  const [cardUSDRateText, setCardUSDRateText] = useState<string>(String(usdRate));
  const [cardTaxText, setCardTaxText] = useState<string>('0');

  // Inicializar selecciones y valores de TC cuando se abre el dialog
  useEffect(() => {
    if (open && creditCardExpense?.id) {
      const linked = getLinkedExpenses(creditCardExpense.id, allExpenses);
      setSelectedIds(new Set(linked.map(exp => exp.id!).filter(Boolean)));
      setSearchTerm('');
      setShowOnlySelected(false); // Siempre iniciar con el switch en OFF

      // Cargar valores de la TC si existen, sino usar default de la API
      const arsValue = creditCardExpense.cardTotalARS || 0;
      const usdValue = creditCardExpense.cardTotalUSD || 0;
      const rateValue = creditCardExpense.cardUSDRate || usdRate;
      const taxValue = creditCardExpense.cardTax || 0;

      setCardTotalARS(arsValue);
      setCardTotalUSD(usdValue);
      setCardUSDRate(rateValue);
      setCardTax(taxValue);

      // Inicializar estados de texto con comas
      setCardTotalARSText(String(arsValue).replace('.', ','));
      setCardTotalUSDText(String(usdValue).replace('.', ','));
      setCardUSDRateText(String(rateValue).replace('.', ','));
      setCardTaxText(String(taxValue).replace('.', ','));
    }
  }, [open, creditCardExpense, allExpenses, usdRate]);

  // Filtrar gastos elegibles
  const eligibleExpenses = useMemo(() => {
    if (!creditCardExpense) return [];

    return allExpenses.filter(exp => {
      // Excluir gastos con "TC" en el nombre
      if (isCreditCard(exp)) return false;

      // Excluir el propio gasto TC
      if (exp.id === creditCardExpense.id) return false;

      // Excluir gastos asociados a OTRA TC
      if (exp.linkedToCardId && exp.linkedToCardId !== creditCardExpense.id) {
        return false;
      }

      return true;
    });
  }, [allExpenses, creditCardExpense]);

  // Filtrar por búsqueda y selección
  const filteredExpenses = useMemo(() => {
    let filtered = eligibleExpenses;

    // Filtrar por seleccionados si el switch está activado
    if (showOnlySelected) {
      filtered = filtered.filter(exp => selectedIds.has(exp.id!));
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(exp =>
        exp.item.toLowerCase().includes(term) ||
        exp.pagadoPor.toLowerCase().includes(term) ||
        exp.importe.toString().includes(term)
      );
    }

    return filtered;
  }, [eligibleExpenses, searchTerm, showOnlySelected, selectedIds]);

  // Calcular totales
  const totals = useMemo(() => {
    const selected = eligibleExpenses.filter(exp => selectedIds.has(exp.id!));

    // Suma de gastos asociados seleccionados
    const totalARS = selected
      .filter(exp => exp.currency === 'ARS')
      .reduce((sum, exp) => sum + exp.importe, 0);

    const totalUSD = selected
      .filter(exp => exp.currency === 'USD')
      .reduce((sum, exp) => sum + exp.importe, 0);

    // Si la TC está en USD, calcular todo en USD
    if (creditCardExpense?.currency === 'USD') {
      // Total de gastos asociados en USD
      const linkedExpensesTotal = totalUSD + (totalARS / cardUSDRate);

      // Total final de la TC en USD (con impuesto en ARS convertido a USD)
      const cardFinalTotal = cardTotalUSD + (cardTotalARS / cardUSDRate) - (cardTax / cardUSDRate);

      // Importe calculado de la TC en USD
      const calculatedCardImporte = cardFinalTotal - linkedExpensesTotal;

      // Verificar si excede
      const exceeds = linkedExpensesTotal > cardFinalTotal;

      return {
        totalARS,
        totalUSD,
        linkedExpensesTotal,
        cardFinalTotal,
        calculatedCardImporte,
        exceeds
      };
    } else {
      // Si la TC está en ARS (o por defecto), calcular todo en ARS
      const linkedExpensesTotal = totalARS + (totalUSD * cardUSDRate);
      const cardFinalTotal = cardTotalARS + (cardTotalUSD * cardUSDRate) - cardTax;
      const calculatedCardImporte = cardFinalTotal - linkedExpensesTotal;
      const exceeds = linkedExpensesTotal > cardFinalTotal;

      return {
        totalARS,
        totalUSD,
        linkedExpensesTotal,
        cardFinalTotal,
        calculatedCardImporte,
        exceeds
      };
    }
  }, [selectedIds, eligibleExpenses, cardTotalARS, cardTotalUSD, cardUSDRate, cardTax, creditCardExpense?.currency]);

  const handleToggle = (expenseId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedIds(newSelected);
  };

  const handleSave = async () => {
    if (!creditCardExpense?.id) return;

    setSaving(true);
    try {
      // Determinar qué gastos se vincularon y cuáles se desvincularon
      const currentlyLinked = getLinkedExpenses(creditCardExpense.id, allExpenses).map(exp => exp.id!);
      const newlyLinked = Array.from(selectedIds).filter(id => !currentlyLinked.includes(id));
      const newlyUnlinked = currentlyLinked.filter(id => !selectedIds.has(id));

      // Actualizar la TC con los nuevos valores y el importe calculado
      if (onUpdateCard) {
        const updatedCard: Expense = {
          ...creditCardExpense,
          cardTotalARS,
          cardTotalUSD,
          cardUSDRate,
          cardTax,
          importe: totals.calculatedCardImporte,
        };
        await onUpdateCard(updatedCard);
      }

      // Guardar los links
      await onSave(newlyLinked, newlyUnlinked);
      onClose();
    } catch (error) {
      console.error('Error saving links:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!creditCardExpense) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Restar Gastos - {creditCardExpense.item}
        {isMobile && (
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="cerrar">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Inputs para totales de la TC */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.primary" sx={{ mb: 2, fontWeight: 600 }}>
              Totales de la Tarjeta
            </Typography>
            <Box sx={{
              display: { xs: 'flex', sm: 'grid' },
              flexDirection: { xs: 'column', sm: 'row' },
              gridTemplateColumns: { sm: 'repeat(4, 1fr)' },
              gap: 2
            }}>
              <TextField
                label="Total ARS"
                type="text"
                size="small"
                value={cardTotalARSText}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\./g, ',');
                  if (value === '' || value === '-' || /^-?\d*,?\d{0,2}$/.test(value)) {
                    setCardTotalARSText(value);
                    const numValue = value.replace(',', '.');
                    const num = numValue === '' || numValue === '-' ? 0 : parseFloat(numValue);
                    if (!isNaN(num)) {
                      setCardTotalARS(num);
                    }
                  }
                }}
                onFocus={(e) => e.target.select()}
                inputProps={{ inputMode: 'decimal' }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography>,
                }}
              />
              <TextField
                label="Total USD"
                type="text"
                size="small"
                value={cardTotalUSDText}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\./g, ',');
                  if (value === '' || value === '-' || /^-?\d*,?\d{0,2}$/.test(value)) {
                    setCardTotalUSDText(value);
                    const numValue = value.replace(',', '.');
                    const num = numValue === '' || numValue === '-' ? 0 : parseFloat(numValue);
                    if (!isNaN(num)) {
                      setCardTotalUSD(num);
                    }
                  }
                }}
                onFocus={(e) => e.target.select()}
                inputProps={{ inputMode: 'decimal' }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>USD</Typography>,
                }}
              />
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end' }}>
                <TextField
                  label="Cotización USD"
                  type="text"
                  size="small"
                  fullWidth
                  value={cardUSDRateText}
                  onChange={(e) => {
                    let value = e.target.value;
                    value = value.replace(/\./g, ',');
                    if (value === '' || value === '-' || /^-?\d*,?\d{0,2}$/.test(value)) {
                      setCardUSDRateText(value);
                      const numValue = value.replace(',', '.');
                      const num = numValue === '' || numValue === '-' ? 0 : parseFloat(numValue);
                      if (!isNaN(num)) {
                        setCardUSDRate(num);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  inputProps={{ inputMode: 'decimal' }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography>,
                  }}
                />
                <Tooltip title="Recargar cotización de la API" arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setCardUSDRate(usdRate);
                      setCardUSDRateText(String(usdRate).replace('.', ','));
                    }}
                    color="primary"
                    sx={{ flexShrink: 0, mb: 0.5 }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                label="Impuesto (Db.rg 5617 30%)"
                type="text"
                size="small"
                value={cardTaxText}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\./g, ',');
                  if (value === '' || value === '-' || /^-?\d*,?\d{0,2}$/.test(value)) {
                    setCardTaxText(value);
                    const numValue = value.replace(',', '.');
                    const num = numValue === '' || numValue === '-' ? 0 : parseFloat(numValue);
                    if (!isNaN(num)) {
                      setCardTax(num);
                    }
                  }
                }}
                onFocus={(e) => e.target.select()}
                inputProps={{ inputMode: 'decimal' }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography>,
                }}
              />
            </Box>

            {/* Total Final de la TC */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Total Final de la TC:
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {creditCardExpense?.currency === 'USD' ? 'USD ' : '$ '}
                {totals.cardFinalTotal.toLocaleString('es-AR', {
                  minimumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0
                })}
              </Typography>
            </Box>
          </Box>

          {/* Buscador y filtros */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar gastos"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, importe o pagado por..."
              autoFocus
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlySelected}
                  onChange={(e) => setShowOnlySelected(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Solo seleccionados ({selectedIds.size})
                </Typography>
              }
            />
          </Box>

          {/* Alerta si excede */}
          {totals.exceeds && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Los gastos seleccionados ({creditCardExpense?.currency === 'USD' ? 'USD ' : '$'}
              {totals.linkedExpensesTotal.toLocaleString('es-AR', {
                minimumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0,
                maximumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0
              })})
              exceden el total final de la TC ({creditCardExpense?.currency === 'USD' ? 'USD ' : '$'}
              {totals.cardFinalTotal.toLocaleString('es-AR', {
                minimumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0,
                maximumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0
              })})
            </Alert>
          )}

          {/* Lista de gastos */}
          <List sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            {filteredExpenses.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No hay gastos disponibles"
                  secondary={searchTerm ? "Intenta con otro término de búsqueda" : "No hay gastos para asociar"}
                />
              </ListItem>
            ) : (
              filteredExpenses.map((expense) => {
                const isSelected = selectedIds.has(expense.id!);
                const labelId = `checkbox-list-label-${expense.id}`;

                return (
                  <ListItem
                    key={expense.id}
                    disablePadding
                    sx={{
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' }
                    }}
                  >
                    <ListItemButton role={undefined} onClick={() => handleToggle(expense.id!)} dense>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={isSelected}
                          tabIndex={-1}
                          disableRipple
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        id={labelId}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {expense.icon && (() => {
                              const IconComponent = (MuiIcons as any)[expense.icon];
                              return IconComponent ? (
                                <IconComponent
                                  sx={{
                                    fontSize: 18,
                                    color: expense.iconColor || '#2196f3'
                                  }}
                                />
                              ) : null;
                            })()}
                            <span>{expense.item}</span>
                          </Box>
                        }
                        secondary={
                          <span>
                            ${expense.importe.toLocaleString('es-AR')} {expense.currency} - {expense.pagadoPor}
                          </span>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })
            )}
          </List>

          {/* Totales */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Resumen de gastos seleccionados */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gastos seleccionados: {selectedIds.size}
              </Typography>
              {totals.totalARS > 0 && (
                <Typography variant="body2">
                  • ARS: ${totals.totalARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </Typography>
              )}
              {totals.totalUSD > 0 && (
                <Typography variant="body2">
                  • USD: {totals.totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              )}
            </Box>

            {/* Comparación con la TC */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Gastos Asociados
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {creditCardExpense?.currency === 'USD' ? 'USD ' : '$ '}
                  {totals.linkedExpensesTotal.toLocaleString('es-AR', {
                    minimumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0,
                    maximumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0
                  })}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Total Final TC
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {creditCardExpense?.currency === 'USD' ? 'USD ' : '$ '}
                  {totals.cardFinalTotal.toLocaleString('es-AR', {
                    minimumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0,
                    maximumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0
                  })}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  Importe TC
                </Typography>
                <Typography variant="h6" fontWeight="bold" color={totals.calculatedCardImporte < 0 ? 'error' : 'success.main'}>
                  {creditCardExpense?.currency === 'USD' ? 'USD ' : '$ '}
                  {totals.calculatedCardImporte.toLocaleString('es-AR', {
                    minimumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0,
                    maximumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0
                  })}
                </Typography>
              </Box>
            </Box>

            {/* Mensaje de disponible/exceso */}
            {!totals.exceeds && totals.cardFinalTotal > 0 && (
              <Typography variant="caption" color="success.main" sx={{ display: 'block', textAlign: 'center' }}>
                ✓ El importe de la TC será: {creditCardExpense?.currency === 'USD' ? 'USD ' : '$'}
                {totals.calculatedCardImporte.toLocaleString('es-AR', {
                  minimumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: creditCardExpense?.currency === 'USD' ? 2 : 0
                })}
              </Typography>
            )}
            {cardTotalUSD > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', fontStyle: 'italic' }}>
                Cotización USD: ${cardUSDRate.toLocaleString('es-AR')}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
