import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  Collapse,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PaletteIcon from '@mui/icons-material/Palette';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import type { Expense, Category, PaymentStatus } from '@/types';
import { CATEGORY_LABELS, CATEGORIES } from '@/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onUpdate: (expense: Expense, previousExpense?: Expense) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => Promise<void>;
}

const getStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case 'pagado':
      return {
        bgcolor: '#16a34a',
        color: 'white',
      };
    case 'bonificado':
      return {
        bgcolor: '#0288d1',
        color: 'white',
      };
    case 'pendiente':
      return {
        bgcolor: '#f59e0b',
        color: 'white',
      };
    default:
      return {
        bgcolor: '#9ca3af',
        color: 'white',
      };
  }
};

const getCategoryIcon = (category: Category) => {
  switch (category) {
    case 'IMPUESTOS_SERVICIOS':
      return <ReceiptIcon />;
    case 'SERVICIOS_TARJETAS':
      return <CreditCardIcon />;
    case 'FORD_KA':
      return <DirectionsCarIcon />;
  }
};

const formatCurrency = (amount: number, currency: string) => {
  if (amount === 0) return '$ 0,00';
  const formatted = amount.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return currency === 'USD' ? `USD ${formatted}` : `$ ${formatted}`;
};

const DEFAULT_CATEGORY_COLORS = {
  IMPUESTOS_SERVICIOS: { from: '#0288d1', to: '#01579b' },
  SERVICIOS_TARJETAS: { from: '#8b5cf6', to: '#6d28d9' },
  FORD_KA: { from: '#14b8a6', to: '#0d9488' },
};

export const ExpenseTable = ({ expenses, onEdit, onUpdate, onDelete, onDeleteMultiple }: ExpenseTableProps) => {
  const [usdRate, setUsdRate] = useState<number>(1200);
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(
    new Set(['IMPUESTOS_SERVICIOS', 'SERVICIOS_TARJETAS', 'FORD_KA'])
  );
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [categoryColors, setCategoryColors] = useState(DEFAULT_CATEGORY_COLORS);
  const [editingColor, setEditingColor] = useState<Category | null>(null);
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares/blue')
      .then(res => res.json())
      .then(data => {
        if (data.venta) {
          setUsdRate(data.venta);
        }
      })
      .catch(() => {
        console.log('Using default USD rate');
      });
  }, []);

  const toggleCategory = (category: Category) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleCellDoubleClick = (expense: Expense, field: string) => {
    if (!expense.id) return;
    setEditingCell({ id: expense.id, field });

    let value = expense[field as keyof Expense];

    // Para fechas, convertir a formato YYYY-MM-DD para el input type="date"
    if ((field === 'vto' || field === 'fechaPago') && value && value !== 'Bonificado' && value !== '') {
      try {
        const date = new Date(value as string);
        value = date.toISOString().split('T')[0];
      } catch (e) {
        value = '';
      }
    }

    setEditValue(String(value || ''));
  };

  const handleCellBlur = (expense: Expense, event?: React.FocusEvent) => {
    if (!editingCell || !expense.id) return;

    // Prevenir que se propague el evento de blur
    if (event) {
      event.stopPropagation();
    }

    const updatedExpense = {
      ...expense,
      [editingCell.field]: editingCell.field === 'importe' ? Number(editValue) : editValue,
    };

    onUpdate(updatedExpense);
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, expense: Expense) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellBlur(expense);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const expenseId = active.id as string;
    const targetCategory = over.id as Category;

    const expense = expenses.find(exp => exp.id === expenseId);

    if (expense && expense.category !== targetCategory) {
      const previousExpense = { ...expense };
      const updatedExpense = {
        ...expense,
        category: targetCategory,
      };
      onUpdate(updatedExpense, previousExpense);
    }
  };

  // Obtener solo las categorías que tienen gastos
  const categoryTotals = CATEGORIES.map(category => {
    const categoryExpenses = expenses.filter(exp => exp.category === category);
    const totalARS = categoryExpenses
      .filter(exp => exp.currency === 'ARS')
      .reduce((sum, exp) => sum + exp.importe, 0);
    const totalUSD = categoryExpenses
      .filter(exp => exp.currency === 'USD')
      .reduce((sum, exp) => sum + exp.importe, 0);

    return {
      category,
      expenses: categoryExpenses,
      totalARS,
      totalUSD,
      totalInARS: totalARS + (totalUSD * usdRate)
    };
  }).filter(cat => cat.expenses.length > 0); // Solo mostrar categorías con gastos

  const grandTotalARS = categoryTotals.reduce((sum, cat) => sum + cat.totalARS, 0);
  const grandTotalUSD = categoryTotals.reduce((sum, cat) => sum + cat.totalUSD, 0);
  const grandTotalInARS = grandTotalARS + (grandTotalUSD * usdRate);

  // Componente para fila arrastrable
  const DraggableRow = ({ expense, children }: { expense: Expense; children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: expense.id || '',
      data: { expense },
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
        }
      : {};

    return (
      <TableRow
        ref={setNodeRef}
        style={style}
        hover
        sx={{
          bgcolor: 'inherit',
          '&:hover': {
            bgcolor: '#e0f2fe',
            transition: 'background-color 0.2s ease',
          },
          '& td': {
            py: 0.75,
            px: 1.5,
            fontSize: '0.875rem',
            borderBottom: '1px solid #e2e8f0',
          }
        }}
      >
        <TableCell sx={{ width: 40, p: 0 }}>
          <IconButton size="small" {...listeners} {...attributes}>
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        </TableCell>
        {children}
      </TableRow>
    );
  };

  // Componente para zona de drop
  const DroppableCategory = ({ category, children }: { category: Category; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: category,
    });

    return (
      <Box
        ref={setNodeRef}
        sx={{
          borderRadius: 1,
          border: isOver ? '2px solid #2196f3' : 'none',
          bgcolor: isOver ? 'rgba(33, 150, 243, 0.05)' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        {children}
      </Box>
    );
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Box>
      {categoryTotals.length === 0 ? (
        <Paper
          elevation={1}
          sx={{
            p: 8,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No hay gastos para este mes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Utiliza el botón "Nuevo Gasto" para agregar gastos o aplica un template desde otro mes
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
        {categoryTotals.map(({ category, expenses: catExpenses, totalARS, totalUSD, totalInARS }) => (
          <DroppableCategory key={category} category={category}>
            <Paper
              elevation={3}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
            {/* Category Header - Clickable */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                background: `linear-gradient(135deg, ${categoryColors[category].from} 0%, ${categoryColors[category].to} 100%)`,
                color: 'white',
                py: 0.75,
                px: 1.5,
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                onClick={() => toggleCategory(category)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexGrow: 1,
                  cursor: 'pointer',
                }}
              >
                <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
                  {getCategoryIcon(category)}
                </Box>
                <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 700, fontSize: '0.875rem' }}>
                  {CATEGORY_LABELS[category]}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', mr: 1 }}>
                  {totalARS > 0 && `$ ${totalARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                  {totalARS > 0 && totalUSD > 0 && ' '}
                  {totalUSD > 0 && (
                    <span style={{ color: '#4ade80' }}>
                      USD {totalUSD.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem', mr: 1 }}>
                  {catExpenses.length} {catExpenses.length === 1 ? 'item' : 'items'}
                </Typography>
                <IconButton size="small" sx={{ color: 'white', p: 0.5 }}>
                  {expandedCategories.has(category) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>

              {/* Category actions */}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingColor(category);
                }}
                sx={{ color: 'white', p: 0.5, ml: 0.5 }}
              >
                <PaletteIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteCategoryDialog(category);
                }}
                sx={{ color: 'white', p: 0.5 }}
              >
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Category Content - Collapsible */}
            <Collapse in={expandedCategories.has(category)} timeout="auto" unmountOnExit>
              <TableContainer sx={{ '& .MuiTable-root': { borderCollapse: 'separate' } }}>
                <Table size="small" sx={{ borderSpacing: 0 }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: '#f8fafc',
                        borderBottom: '2px solid #e2e8f0',
                        '& th': {
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          py: 1,
                          px: 1.5,
                          color: '#475569',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }
                      }}
                    >
                      <TableCell sx={{ width: 40 }}></TableCell>
                      <TableCell>Item</TableCell>
                      <TableCell>Vencimiento</TableCell>
                      <TableCell>Fecha de Pago</TableCell>
                      <TableCell align="right">Importe</TableCell>
                      <TableCell>Pagado Por</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {catExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          align="center"
                          sx={{
                            py: 4,
                            color: 'text.secondary',
                            fontStyle: 'italic',
                          }}
                        >
                          Sin gastos registrados en esta categoría
                        </TableCell>
                      </TableRow>
                    ) : (
                      catExpenses.map((expense) => (
                        <DraggableRow key={expense.id} expense={expense}>
                          <TableCell
                            sx={{ fontWeight: 500, cursor: 'pointer' }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleCellDoubleClick(expense, 'item');
                            }}
                          >
                            {editingCell?.id === expense.id && editingCell?.field === 'item' ? (
                              <TextField
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={(e) => handleCellBlur(expense, e)}
                                onKeyDown={(e) => handleKeyDown(e, expense)}
                                autoFocus
                                size="small"
                                fullWidth
                                variant="standard"
                              />
                            ) : (
                              expense.item
                            )}
                          </TableCell>
                          <TableCell
                            sx={{ cursor: 'pointer' }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleCellDoubleClick(expense, 'vto');
                            }}
                          >
                            {editingCell?.id === expense.id && editingCell?.field === 'vto' ? (
                              <TextField
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={(e) => handleCellBlur(expense, e)}
                                onKeyDown={(e) => handleKeyDown(e, expense)}
                                autoFocus
                                size="small"
                                type="date"
                                variant="standard"
                                sx={{ maxWidth: 140 }}
                                InputLabelProps={{ shrink: true }}
                              />
                            ) : expense.vto && expense.vto !== 'Bonificado' && expense.vto !== '' ? (
                              format(new Date(expense.vto), 'dd/MM/yyyy', { locale: es })
                            ) : (
                              expense.vto || '-'
                            )}
                          </TableCell>
                          <TableCell
                            sx={{ cursor: 'pointer' }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleCellDoubleClick(expense, 'fechaPago');
                            }}
                          >
                            {editingCell?.id === expense.id && editingCell?.field === 'fechaPago' ? (
                              <TextField
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={(e) => handleCellBlur(expense, e)}
                                onKeyDown={(e) => handleKeyDown(e, expense)}
                                autoFocus
                                size="small"
                                type="date"
                                variant="standard"
                                sx={{ maxWidth: 140 }}
                                InputLabelProps={{ shrink: true }}
                              />
                            ) : expense.fechaPago && expense.fechaPago !== 'Bonificado' && expense.fechaPago !== '' && !expense.fechaPago.includes('PAGO') ? (
                              format(new Date(expense.fechaPago), 'dd/MM/yyyy', { locale: es })
                            ) : (
                              expense.fechaPago || '-'
                            )}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 'medium', cursor: 'pointer' }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleCellDoubleClick(expense, 'importe');
                            }}
                          >
                            {editingCell?.id === expense.id && editingCell?.field === 'importe' ? (
                              <TextField
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={(e) => handleCellBlur(expense, e)}
                                onKeyDown={(e) => handleKeyDown(e, expense)}
                                autoFocus
                                size="small"
                                type="number"
                                variant="standard"
                                sx={{ maxWidth: 100 }}
                              />
                            ) : expense.importe > 0 ? (
                              <span style={{ color: expense.currency === 'USD' ? '#00897b' : 'inherit', fontWeight: expense.currency === 'USD' ? 600 : 'inherit' }}>
                                {formatCurrency(expense.importe, expense.currency)}
                              </span>
                            ) : (
                              expense.status === 'bonificado' ? 'Bonificado' : '$ 0,00'
                            )}
                          </TableCell>
                          <TableCell
                            sx={{ cursor: 'pointer' }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleCellDoubleClick(expense, 'pagadoPor');
                            }}
                          >
                            {editingCell?.id === expense.id && editingCell?.field === 'pagadoPor' ? (
                              <TextField
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={(e) => handleCellBlur(expense, e)}
                                onKeyDown={(e) => handleKeyDown(e, expense)}
                                autoFocus
                                size="small"
                                fullWidth
                                variant="standard"
                              />
                            ) : (
                              expense.pagadoPor
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={expense.status.toUpperCase()}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                ...getStatusColor(expense.status)
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => onEdit(expense)}
                              color="primary"
                              sx={{ mr: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => expense.id && onDelete(expense.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </DraggableRow>
                      ))
                    )}

                    {/* Category Subtotal */}
                    {catExpenses.length > 0 && (
                      <TableRow
                        sx={{
                          background: 'linear-gradient(to right, #f1f5f9, #e2e8f0)',
                          '& td': {
                            fontWeight: 700,
                            borderTop: '3px solid #cbd5e1',
                            borderBottom: 'none',
                            py: 1.5,
                          }
                        }}
                      >
                        <TableCell colSpan={7} align="right">
                          <strong>SUBTOTAL:</strong>
                        </TableCell>
                        <TableCell colSpan={2} align="right">
                          <Box>
                            {totalARS > 0 && (
                              <Typography variant="body2" fontWeight="bold">
                                $ {totalARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </Typography>
                            )}
                            {totalUSD > 0 && (
                              <Typography variant="body2" fontWeight="bold" sx={{ color: '#00897b' }}>
                                USD {totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </Typography>
                            )}
                            {totalUSD > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Total en ARS: $ {totalInARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Paper>
          </DroppableCategory>
        ))}

        {/* Grand Total Card */}
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
            color: 'white',
            p: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem', opacity: 0.95 }}>
              TOTAL GENERAL
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              {grandTotalARS > 0 && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.65rem', display: 'block' }}>
                    ARS
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.25rem', lineHeight: 1.2 }}>
                    $ {grandTotalARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
              )}
              {grandTotalUSD > 0 && (
                <Tooltip title={`USD ${grandTotalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} arrow>
                  <Box sx={{ textAlign: 'right', cursor: 'help' }}>
                    <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.65rem', display: 'block' }}>
                      USD
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#4ade80', fontSize: '1.25rem', lineHeight: 1.2 }}>
                      {grandTotalUSD.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </Typography>
                  </Box>
                </Tooltip>
              )}
              {grandTotalUSD > 0 && (
                <Box sx={{
                  textAlign: 'right',
                  pl: 2,
                  borderLeft: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <Typography variant="caption" sx={{ opacity: 0.75, fontSize: '0.65rem', display: 'block' }}>
                    Total en ARS
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
                    $ {grandTotalInARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Stack>
      )}

      {/* Dialog para editar color de categoría */}
      <Dialog open={Boolean(editingColor)} onClose={() => setEditingColor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Personalizar Color</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {editingColor && CATEGORY_LABELS[editingColor]}
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                Color Inicial
              </Typography>
              <TextField
                type="color"
                fullWidth
                value={editingColor ? categoryColors[editingColor].from : '#0288d1'}
                onChange={(e) => {
                  if (editingColor) {
                    setCategoryColors(prev => ({
                      ...prev,
                      [editingColor]: { ...prev[editingColor], from: e.target.value }
                    }));
                  }
                }}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                Color Final
              </Typography>
              <TextField
                type="color"
                fullWidth
                value={editingColor ? categoryColors[editingColor].to : '#01579b'}
                onChange={(e) => {
                  if (editingColor) {
                    setCategoryColors(prev => ({
                      ...prev,
                      [editingColor]: { ...prev[editingColor], to: e.target.value }
                    }));
                  }
                }}
              />
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                background: editingColor
                  ? `linear-gradient(135deg, ${categoryColors[editingColor].from} 0%, ${categoryColors[editingColor].to} 100%)`
                  : 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
                color: 'white',
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              Vista Previa
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (editingColor) {
                setCategoryColors(prev => ({
                  ...prev,
                  [editingColor]: DEFAULT_CATEGORY_COLORS[editingColor]
                }));
              }
            }}
          >
            Restaurar
          </Button>
          <Button onClick={() => setEditingColor(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar borrado de categoría */}
      <Dialog
        open={Boolean(deleteCategoryDialog)}
        onClose={() => !isDeletingCategory && setDeleteCategoryDialog(null)}
      >
        <DialogTitle>Eliminar Todos los Gastos</DialogTitle>
        <DialogContent>
          {isDeletingCategory ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <CircularProgress size={48} />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Eliminando gastos...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2">
                ¿Estás seguro de que deseas eliminar todos los gastos de{' '}
                <strong>{deleteCategoryDialog && CATEGORY_LABELS[deleteCategoryDialog]}</strong>?
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'error.main' }}>
                Esta acción no se puede deshacer.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!isDeletingCategory && (
            <>
              <Button onClick={() => setDeleteCategoryDialog(null)}>Cancelar</Button>
              <Button
                color="error"
                variant="contained"
                onClick={async () => {
                  if (deleteCategoryDialog) {
                    setIsDeletingCategory(true);
                    const expensesToDelete = expenses.filter(exp => exp.category === deleteCategoryDialog);
                    const idsToDelete = expensesToDelete.map(exp => exp.id).filter((id): id is string => id !== undefined);

                    try {
                      if (onDeleteMultiple) {
                        await onDeleteMultiple(idsToDelete);
                      } else {
                        // Fallback: eliminar uno por uno sin confirmación
                        for (const id of idsToDelete) {
                          onDelete(id);
                        }
                      }
                    } finally {
                      setIsDeletingCategory(false);
                      setDeleteCategoryDialog(null);
                    }
                  }
                }}
              >
                Eliminar Todos
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
    </DndContext>
  );
};
