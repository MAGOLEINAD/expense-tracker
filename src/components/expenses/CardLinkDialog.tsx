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
} from '@mui/material';
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
}

export const CardLinkDialog = ({
  open,
  creditCardExpense,
  allExpenses,
  usdRate,
  onClose,
  onSave,
}: CardLinkDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Inicializar selecciones cuando se abre el dialog
  useEffect(() => {
    if (open && creditCardExpense?.id) {
      const linked = getLinkedExpenses(creditCardExpense.id, allExpenses);
      setSelectedIds(new Set(linked.map(exp => exp.id!).filter(Boolean)));
      setSearchTerm('');
    }
  }, [open, creditCardExpense, allExpenses]);

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

    const totalARS = selected
      .filter(exp => exp.currency === 'ARS')
      .reduce((sum, exp) => sum + exp.importe, 0);

    const totalUSD = selected
      .filter(exp => exp.currency === 'USD')
      .reduce((sum, exp) => sum + exp.importe, 0);

    const cardTotal = creditCardExpense?.importe || 0;
    const cardCurrency = creditCardExpense?.currency || 'ARS';

    // Convertir todo a la moneda de la TC para comparar
    let totalInCardCurrency: number;
    if (cardCurrency === 'ARS') {
      totalInCardCurrency = totalARS + (totalUSD * usdRate);
    } else {
      totalInCardCurrency = totalUSD + (totalARS / usdRate);
    }

    const exceeds = totalInCardCurrency > cardTotal;

    return { totalARS, totalUSD, cardTotal, cardCurrency, totalInCardCurrency, exceeds };
  }, [selectedIds, eligibleExpenses, creditCardExpense, usdRate]);

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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Asociar Gastos a {creditCardExpense.item}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Información de la TC */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Importe de la tarjeta:
            </Typography>
            <Typography variant="h6" color="primary">
              {totals.cardCurrency === 'USD' ? 'USD ' : '$'}
              {creditCardExpense.importe.toLocaleString('es-AR', { maximumFractionDigits: totals.cardCurrency === 'USD' ? 2 : 0 })}
            </Typography>
          </Box>

          {/* Buscador y filtros */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
              El total seleccionado ({totals.cardCurrency === 'USD' ? 'USD ' : '$'}
              {totals.totalInCardCurrency.toLocaleString('es-AR', { maximumFractionDigits: totals.cardCurrency === 'USD' ? 2 : 0 })})
              excede el importe de la TC
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total en {totals.cardCurrency}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {totals.cardCurrency === 'USD' ? 'USD ' : '$'}
                  {totals.totalInCardCurrency.toLocaleString('es-AR', { maximumFractionDigits: totals.cardCurrency === 'USD' ? 2 : 0 })}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ mx: 2, opacity: 0.5 }}>
                /
              </Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  Importe TC
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {totals.cardCurrency === 'USD' ? 'USD ' : '$'}
                  {totals.cardTotal.toLocaleString('es-AR', { maximumFractionDigits: totals.cardCurrency === 'USD' ? 2 : 0 })}
                </Typography>
              </Box>
            </Box>

            {/* Mensaje de disponible/exceso */}
            {!totals.exceeds && selectedIds.size > 0 && (
              <Typography variant="caption" color="success.main" sx={{ display: 'block', textAlign: 'center' }}>
                ✓ Quedan {totals.cardCurrency === 'USD' ? 'USD ' : '$'}
                {(totals.cardTotal - totals.totalInCardCurrency).toLocaleString('es-AR', { maximumFractionDigits: totals.cardCurrency === 'USD' ? 2 : 0 })} disponibles
              </Typography>
            )}
            {totals.cardCurrency !== 'ARS' && (totals.totalARS > 0 || totals.totalUSD > 0) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', fontStyle: 'italic' }}>
                Tasa: 1 USD = ${usdRate.toLocaleString('es-AR')}
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
          {saving ? 'Guardando...' : 'Guardar Asociaciones'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
