import { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor, useDroppable, DragOverlay, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import SortIcon from '@mui/icons-material/Sort';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LinkIcon from '@mui/icons-material/Link';
import type { Expense, Category, PaymentStatus, UserCategory } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { useStatusColors } from '@/hooks/useStatusColors';
import { CommentDialog } from './CommentDialog';
import { DebtDialog } from './DebtDialog';
import { CardLinkDialog } from './CardLinkDialog';
import * as MuiIcons from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatDateInput, isCreditCard, getLinkedExpenses } from '@/utils';

interface ExpenseTableProps {
  expenses: Expense[];
  categories: UserCategory[];
  onEdit: (expense: Expense) => void;
  onUpdate: (expense: Expense, previousExpense?: Expense, silent?: boolean) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => Promise<void>;
  onAdd?: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  linkExpensesToCard?: (cardId: string, expenseIds: string[]) => Promise<void>;
  unlinkExpensesFromCard?: (expenseIds: string[]) => Promise<void>;
  selectedMonth: number;
  selectedYear: number;
}

const STATUS_OPTIONS: PaymentStatus[] = ['pendiente', 'pagado', 'bonificado', 'pago anual', 'sin cargo'];

type SortType = 'manual' | 'alfabetico' | 'estado' | 'importe' | 'vencimiento';

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: 'manual', label: 'Manual (Arrastrar)' },
  { value: 'alfabetico', label: 'Alfabético' },
  { value: 'estado', label: 'Estado (Pendientes primero)' },
  { value: 'importe', label: 'Importe (Mayor a menor)' },
  { value: 'vencimiento', label: 'Vencimiento (Más cercano)' },
];

const getCategoryIcon = (category: UserCategory | undefined, categoryIndex: number) => {
  // Si la categoría tiene un icono personalizado, usarlo
  if (category?.icon) {
    const IconComponent = (MuiIcons as any)[category.icon];
    if (IconComponent) {
      return <IconComponent sx={{ color: 'white' }} />;
    }
  }

  // Si no, usar iconos por defecto según índice
  const defaultIcons = [<ReceiptIcon />, <CreditCardIcon />, <DirectionsCarIcon />, <PaletteIcon />];
  return defaultIcons[categoryIndex % defaultIcons.length];
};

const formatCurrency = (amount: number, currency: string) => {
  if (amount === 0) return '$ 0,00';
  const formatted = amount.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return currency === 'USD' ? `USD ${formatted}` : `$ ${formatted}`;
};

const DEFAULT_CATEGORY_COLORS = [
  { from: '#0288d1', to: '#01579b' },
  { from: '#8b5cf6', to: '#6d28d9' },
  { from: '#14b8a6', to: '#0d9488' },
  { from: '#f59e0b', to: '#dc2626' },
  { from: '#10b981', to: '#059669' },
];

const getCategoryColor = (category: UserCategory | undefined, categoryIndex: number) => {
  // Si la categoría tiene colores personalizados, usarlos
  if (category?.colorFrom && category?.colorTo) {
    return { from: category.colorFrom, to: category.colorTo };
  }
  // Si no, usar color por defecto según índice
  return DEFAULT_CATEGORY_COLORS[categoryIndex % DEFAULT_CATEGORY_COLORS.length];
};

export const ExpenseTable = ({ expenses, categories, onEdit, onUpdate, onDelete, onDeleteMultiple, onAdd, linkExpensesToCard, unlinkExpensesFromCard, selectedMonth, selectedYear }: ExpenseTableProps) => {
  const { user } = useAuth();
  const { updateCategoryColors, toggleIncludeInTotals } = useCategories(user?.uid);
  const { getStatusColor } = useStatusColors();
  const { enqueueSnackbar } = useSnackbar();
  const [usdRate, setUsdRate] = useState<number>(1200);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [tempColorFrom, setTempColorFrom] = useState<string>('');
  const [tempColorTo, setTempColorTo] = useState<string>('');
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<string | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [cardLinkDialogOpen, setCardLinkDialogOpen] = useState(false);
  const [selectedCreditCard, setSelectedCreditCard] = useState<Expense | null>(null);
  const [unlinkConfirmDialogOpen, setUnlinkConfirmDialogOpen] = useState(false);
  const [expenseToUnlink, setExpenseToUnlink] = useState<Expense | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusMenuExpense, setStatusMenuExpense] = useState<Expense | null>(null);
  const [statusMenuPosition, setStatusMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [sortType, setSortType] = useState<SortType>('manual');
  const [sortMenuPosition, setSortMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [optimisticIncludeInTotals, setOptimisticIncludeInTotals] = useState<Record<string, boolean>>({});

  // Refs para controlar la posición del cursor
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);
  const shouldRestoreCursor = useRef<boolean>(false);

  // useEffect para restaurar la posición del cursor después de cambios de estado
  useEffect(() => {
    if (inputRef.current && cursorPositionRef.current !== null && shouldRestoreCursor.current) {
      inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
      cursorPositionRef.current = null;
      shouldRestoreCursor.current = false;
    }
  }, [editValue]);

  // Función helper para manejar cambios de input preservando la posición del cursor
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const input = e.target as HTMLInputElement;
    cursorPositionRef.current = input.selectionStart;
    shouldRestoreCursor.current = true;
    setEditValue(e.target.value);
  };

  // Inicializar expandedCategories con todas las categorías
  useEffect(() => {
    setExpandedCategories(new Set(categories.map(cat => cat.id!)));
  }, [categories]);

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

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCellDoubleClick = (expense: Expense, field: string) => {
    if (!expense.id) return;
    setEditingCell({ id: expense.id, field });

    let value = expense[field as keyof Expense];

    // Para fechas, convertir de AAAA-MM-DD a DD/MM/AAAA
    // Excluir valores especiales como '-', 'Bonificado', etc.
    if ((field === 'vto' || field === 'fechaPago') && value && value !== 'Bonificado' && value !== '' && value !== '-' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      try {
        const dateStr = value as string;
        const [year, month, day] = dateStr.split('-');
        if (year && month && day) {
          value = `${day}/${month}/${year}`;
        }
      } catch (e) {
        value = '';
      }
    }

    // Evitar que aparezca "undefined" como texto
    setEditValue(value != null ? String(value) : '');
  };

  const handleCellBlur = (expense: Expense, event?: React.FocusEvent) => {
    if (!editingCell || !expense.id) return;

    // Prevenir que se propague el evento de blur
    if (event) {
      event.stopPropagation();
    }

    let newValue: string | number = editValue;

    // Convertir fecha de DD/MM/AAAA a AAAA-MM-DD si es un campo de fecha
    if (editingCell.field === 'vto' || editingCell.field === 'fechaPago') {
      // Intentar obtener la fecha en formato ISO
      const { isoDate } = formatDateInput(editValue);

      if (isoDate) {
        // Si formatDateInput devuelve una fecha válida (ya sea auto-completada o completa)
        newValue = isoDate;
      } else if (editValue.includes('/') && editValue.length === 10) {
        // Fallback para fechas completas que no fueron procesadas
        const parts = editValue.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          // Validar que sean números
          if (!isNaN(Number(day)) && !isNaN(Number(month)) && !isNaN(Number(year))) {
            newValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
      } else {
        // Si no es una fecha válida, guardar el texto tal cual (para '-', 'Bonificado', etc.)
        newValue = editValue;
      }
    } else if (editingCell.field === 'importe') {
      newValue = Number(editValue);
    }

    const oldValue = expense[editingCell.field as keyof Expense];

    // Solo actualizar si el valor cambió
    if (newValue !== oldValue) {
      const updatedExpense = {
        ...expense,
        [editingCell.field]: newValue,
      };

      onUpdate(updatedExpense);
    }

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) return;

    const expenseId = active.id as string;
    const expense = expenses.find(exp => exp.id === expenseId);

    if (!expense) return;

    // Check if we're dropping on a category (moving between categories)
    const isDroppableCategory = categories.some(cat => cat.id === over.id);

    if (isDroppableCategory) {
      const targetCategory = over.id as Category;

      if (expense.category !== targetCategory) {
        const previousExpense = { ...expense };
        const updatedExpense = {
          ...expense,
          category: targetCategory,
          order: 0, // Reset order when moving to new category
        };
        onUpdate(updatedExpense, previousExpense);
      }
    } else {
      // We're reordering within the same category
      const overId = over.id as string;

      if (active.id !== overId) {
        const category = expense.category;
        const categoryExpenses = expenses
          .filter(exp => exp.category === category)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const oldIndex = categoryExpenses.findIndex(exp => exp.id === active.id);
        const newIndex = categoryExpenses.findIndex(exp => exp.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedExpenses = arrayMove(categoryExpenses, oldIndex, newIndex);

          // Update order for all affected expenses silently
          const updatePromises = reorderedExpenses.map((exp, index) => {
            if (exp.id) {
              const updatedExpense = {
                ...exp,
                order: index,
              };
              return onUpdate(updatedExpense, undefined, true); // silent = true
            }
            return Promise.resolve();
          });

          // Wait for all updates and show a single message
          await Promise.all(updatePromises);
          enqueueSnackbar('Gastos reordenados exitosamente', { variant: 'success' });
        }
      }
    }
  };

  const handleOpenCommentDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setCommentDialogOpen(true);
  };

  const handleSaveComment = async (comment: string) => {
    if (!selectedExpense?.id) return;

    try {
      const { updateCategoryColors, ...expenseData } = selectedExpense as any;

      const updatedExpense = {
        ...expenseData,
        comment: comment || null, // null para indicar que se debe eliminar
      };

      await onUpdate(updatedExpense);
    } catch (error) {
      console.error('Error saving comment:', error);
    }
  };

  const handleOpenDebtDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setDebtDialogOpen(true);
  };

  const handleSaveDebt = async (debt: number) => {
    if (!selectedExpense?.id) return;

    try {
      const { updateCategoryColors, ...expenseData } = selectedExpense as any;

      const updatedExpense = {
        ...expenseData,
        debt: debt > 0 ? debt : null, // null para indicar que se debe eliminar
      };

      await onUpdate(updatedExpense);
    } catch (error) {
      console.error('Error saving debt:', error);
    }
  };

  const handleOpenCardLinkDialog = (creditCardExpense: Expense) => {
    setSelectedCreditCard(creditCardExpense);
    setCardLinkDialogOpen(true);
  };

  const handleSaveCardLinks = async (linkedIds: string[], unlinkedIds: string[]) => {
    if (!selectedCreditCard?.id || !linkExpensesToCard || !unlinkExpensesFromCard) return;

    try {
      if (linkedIds.length > 0) {
        await linkExpensesToCard(selectedCreditCard.id, linkedIds);
      }
      if (unlinkedIds.length > 0) {
        await unlinkExpensesFromCard(unlinkedIds);
      }
      enqueueSnackbar('Asociaciones actualizadas', { variant: 'success' });
    } catch (error) {
      console.error('Error updating links:', error);
      enqueueSnackbar('Error al actualizar asociaciones', { variant: 'error' });
    }
  };

  const handleUnlinkFromCard = (expense: Expense) => {
    if (!expense.linkedToCardId || !expense.id || !unlinkExpensesFromCard) return;
    setExpenseToUnlink(expense);
    setUnlinkConfirmDialogOpen(true);
  };

  const confirmUnlinkFromCard = async () => {
    if (!expenseToUnlink?.id || !unlinkExpensesFromCard) return;

    try {
      await unlinkExpensesFromCard([expenseToUnlink.id]);
      enqueueSnackbar('Gasto desasociado', { variant: 'success' });
      setUnlinkConfirmDialogOpen(false);
      setExpenseToUnlink(null);
    } catch (error) {
      console.error('Error unlinking:', error);
      enqueueSnackbar('Error al desasociar gasto', { variant: 'error' });
    }
  };

  const handleStatusClick = (expense: Expense, event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setStatusMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
    setStatusMenuExpense(expense);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuExpense(null);
    setStatusMenuPosition(null);
  };

  const handleStatusChange = (newStatus: PaymentStatus) => {
    if (statusMenuExpense) {
      const updatedExpense = {
        ...statusMenuExpense,
        status: newStatus,
      };
      onUpdate(updatedExpense);
    }
    handleStatusMenuClose();
  };

  const handleQuickAdd = (categoryId: string) => {
    if (!onAdd || !user) return;

    const newExpense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.uid,
      item: '-',
      vto: '-',
      fechaPago: '-',
      importe: 0,
      currency: 'ARS',
      pagadoPor: '-',
      status: 'pendiente',
      category: categoryId,
      month: selectedMonth,
      year: selectedYear,
      order: expenses.filter(exp => exp.category === categoryId).length,
    };

    onAdd(newExpense);
  };

  // Helper para obtener el valor de includeInTotals (optimistic o real)
  const getIncludeInTotals = (categoryId: string, category: UserCategory | undefined): boolean => {
    if (categoryId in optimisticIncludeInTotals) {
      return optimisticIncludeInTotals[categoryId];
    }
    return category?.includeInTotals ?? true;
  };

  const handleToggleIncludeInTotals = async (categoryId: string, currentValue: boolean) => {
    const newValue = !currentValue;

    // Optimistic update
    setOptimisticIncludeInTotals(prev => ({ ...prev, [categoryId]: newValue }));

    try {
      if (toggleIncludeInTotals) {
        await toggleIncludeInTotals(categoryId, newValue);
      }
    } catch (error) {
      // Revertir en caso de error
      setOptimisticIncludeInTotals(prev => {
        const newState = { ...prev };
        delete newState[categoryId];
        return newState;
      });
      enqueueSnackbar('Error al actualizar la categoría', { variant: 'error' });
    } finally {
      // Limpiar el estado optimistic después de que Firebase actualice
      setTimeout(() => {
        setOptimisticIncludeInTotals(prev => {
          const newState = { ...prev };
          delete newState[categoryId];
          return newState;
        });
      }, 500);
    }
  };

  // Función para ordenar gastos según el criterio seleccionado
  const sortExpenses = (expenses: Expense[], sortType: SortType): Expense[] => {
    const sorted = [...expenses];

    switch (sortType) {
      case 'alfabetico':
        return sorted.sort((a, b) => {
          // Los gastos con item "-" van al final
          const aIsEmpty = a.item === '-';
          const bIsEmpty = b.item === '-';

          if (aIsEmpty && !bIsEmpty) return 1;
          if (!aIsEmpty && bIsEmpty) return -1;
          if (aIsEmpty && bIsEmpty) {
            // Si ambos tienen "-", ordenar por order
            return (a.order || 0) - (b.order || 0);
          }

          // Ordenamiento alfabético normal
          return a.item.localeCompare(b.item);
        });

      case 'estado':
        // Orden: pendiente, pago anual, pagado, bonificado, sin cargo
        const statusOrder: Record<PaymentStatus, number> = {
          'pendiente': 0,
          'pago anual': 1,
          'pagado': 2,
          'bonificado': 3,
          'sin cargo': 4,
        };
        return sorted.sort((a, b) => {
          const statusDiff = statusOrder[a.status] - statusOrder[b.status];
          // Si tienen el mismo estado, ordenar por order
          if (statusDiff === 0) {
            return (a.order || 0) - (b.order || 0);
          }
          return statusDiff;
        });

      case 'importe':
        return sorted.sort((a, b) => {
          // Los gastos con importe 0 van al final
          if (a.importe === 0 && b.importe !== 0) return 1;
          if (a.importe !== 0 && b.importe === 0) return -1;
          // Si ambos tienen importe 0, ordenar por order (más nuevos al final)
          if (a.importe === 0 && b.importe === 0) {
            return (a.order || 0) - (b.order || 0);
          }
          // Si ambos son > 0, ordenar por importe (mayor a menor)
          return b.importe - a.importe;
        });

      case 'vencimiento':
        return sorted.sort((a, b) => {
          // Manejar casos especiales (vacío, guión, "Bonificado", etc.)
          const aVto = a.vto && a.vto !== '-' && a.vto !== 'Bonificado' && a.vto !== '' ? a.vto : null;
          const bVto = b.vto && b.vto !== '-' && b.vto !== 'Bonificado' && b.vto !== '' ? b.vto : null;

          // Los que no tienen fecha van al final
          if (!aVto && !bVto) {
            // Si ambos no tienen fecha, ordenar por order (más nuevos al final)
            return (a.order || 0) - (b.order || 0);
          }
          if (!aVto) return 1;
          if (!bVto) return -1;

          // Comparar fechas (formato YYYY-MM-DD)
          return aVto.localeCompare(bVto);
        });

      case 'manual':
      default:
        return sorted.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  };

  // Obtener solo las categorías que tienen gastos
  const categoryTotals = categories.map((userCategory, index) => {
    const categoryExpenses = sortExpenses(
      expenses.filter(exp => exp.category === userCategory.id),
      sortType
    );

    // Filtrar solo gastos que NO están pendientes, sin cargo, o asociados a TC para los totales
    const paidExpenses = categoryExpenses.filter(exp => {
      // Excluir pendientes y sin cargo
      if (exp.status === 'pendiente' || exp.status === 'sin cargo') return false;

      // Excluir gastos asociados a tarjetas de crédito
      if (exp.linkedToCardId && exp.linkedToCardId.trim() !== '') return false;

      return true;
    });

    const totalARS = paidExpenses
      .filter(exp => exp.currency === 'ARS')
      .reduce((sum, exp) => sum + exp.importe, 0);
    const totalUSD = paidExpenses
      .filter(exp => exp.currency === 'USD')
      .reduce((sum, exp) => sum + exp.importe, 0);

    return {
      categoryId: userCategory.id!,
      categoryName: userCategory.name,
      categoryIndex: index,
      expenses: categoryExpenses,
      totalARS,
      totalUSD,
      totalInARS: totalARS + (totalUSD * usdRate)
    };
  }).filter(cat => cat.expenses.length > 0); // Solo mostrar categorías con gastos

  // Filtrar categorías que se incluyen en totales
  const includedCategories = categoryTotals.filter(cat => {
    const category = categories.find(c => c.id === cat.categoryId);
    return getIncludeInTotals(cat.categoryId, category);
  });

  const excludedCategories = categoryTotals.filter(cat => {
    const category = categories.find(c => c.id === cat.categoryId);
    return !getIncludeInTotals(cat.categoryId, category);
  });

  const grandTotalARS = includedCategories.reduce((sum, cat) => sum + cat.totalARS, 0);
  const grandTotalUSD = includedCategories.reduce((sum, cat) => sum + cat.totalUSD, 0);
  const grandTotalInARS = grandTotalARS + (grandTotalUSD * usdRate);

  // Calcular totales de gastos excluidos
  const excludedTotalARS = excludedCategories.reduce((sum, cat) => sum + cat.totalARS, 0);
  const excludedTotalUSD = excludedCategories.reduce((sum, cat) => sum + cat.totalUSD, 0);
  const excludedTotalInARS = excludedTotalARS + (excludedTotalUSD * usdRate);

  // Calcular total de deudas
  const totalDebt = expenses.reduce((sum, exp) => sum + (exp.debt || 0), 0);

  // Calcular total de gastos asociados a TCs
  const linkedExpenses = expenses.filter(exp => exp.linkedToCardId);
  const linkedTotalARS = linkedExpenses
    .filter(exp => exp.currency === 'ARS')
    .reduce((sum, exp) => sum + exp.importe, 0);
  const linkedTotalUSD = linkedExpenses
    .filter(exp => exp.currency === 'USD')
    .reduce((sum, exp) => sum + exp.importe, 0);
  const linkedTotalInARS = linkedTotalARS + (linkedTotalUSD * usdRate);

  // Componente para fila arrastrable
  const SortableRow = ({ expense, children, disabled }: { expense: Expense; children: React.ReactNode; disabled?: boolean }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: expense.id || '',
      data: { expense },
      disabled: disabled || false,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1 : 0,
    };

    return (
      <TableRow
        ref={setNodeRef}
        style={style}
        hover
        {...listeners}
        {...attributes}
        sx={{
          bgcolor: 'inherit',
          cursor: isDragging ? 'move' : 'pointer',
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
          <DragIndicatorIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </TableCell>
        {children}
      </TableRow>
    );
  };

  // Componente para zona de drop
  const DroppableCategory = ({ categoryId, children }: { categoryId: string; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: categoryId,
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
        {categoryTotals.map(({ categoryId, categoryName, categoryIndex, expenses: catExpenses, totalARS, totalUSD, totalInARS }) => {
          const category = categories.find(c => c.id === categoryId);
          // Si estamos editando esta categoría, usar colores temporales
          const colors = editingColor === categoryId
            ? { from: tempColorFrom, to: tempColorTo }
            : getCategoryColor(category, categoryIndex);
          return (
          <DroppableCategory key={categoryId} categoryId={categoryId}>
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
                background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                color: 'white',
                py: 0.75,
                px: 1.5,
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                onClick={() => toggleCategory(categoryId)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexGrow: 1,
                  cursor: 'pointer',
                }}
              >
                <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
                  {getCategoryIcon(category, categoryIndex)}
                </Box>
                <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 700, fontSize: '0.875rem' }}>
                  {categoryName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                  {totalARS > 0 && (
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      $ {totalARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </Typography>
                  )}
                  {totalARS > 0 && totalUSD > 0 && (
                    <Typography variant="body2" sx={{ opacity: 0.6, fontWeight: 'bold', fontSize: '0.875rem' }}>
                      •
                    </Typography>
                  )}
                  {totalUSD > 0 && (
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#4ade80' }}>
                      USD {totalUSD.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem', mr: 1 }}>
                  {catExpenses.length} {catExpenses.length === 1 ? 'item' : 'items'}
                </Typography>
                <IconButton size="small" sx={{ color: 'white', p: 0.5 }}>
                  {expandedCategories.has(categoryId) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>

              {/* Category actions */}
              <Tooltip title="Agregar gasto rápido" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAdd(categoryId);
                  }}
                  sx={{
                    color: 'white',
                    p: 0.5,
                    ml: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  <MuiIcons.Add fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ordenar gastos" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setSortMenuPosition({
                      top: rect.bottom,
                      left: rect.left,
                    });
                  }}
                  sx={{
                    color: 'white',
                    p: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  <SortIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cambiar colores" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingColor(categoryId);
                    // Inicializar colores temporales
                    setTempColorFrom(category?.colorFrom || colors.from);
                    setTempColorTo(category?.colorTo || colors.to);
                  }}
                  sx={{ color: 'white', p: 0.5 }}
                >
                  <PaletteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar todos los gastos" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteCategoryDialog(categoryId);
                  }}
                  sx={{ color: 'white', p: 0.5 }}
                >
                  <DeleteSweepIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Category Content - Collapsible */}
            <Collapse in={expandedCategories.has(categoryId)} timeout="auto" unmountOnExit>
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
                    <SortableContext
                      items={catExpenses.map(exp => exp.id || '')}
                      strategy={verticalListSortingStrategy}
                    >
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
                        <SortableRow key={expense.id} expense={expense} disabled={editingCell !== null}>
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
                                onChange={handleInputChange}
                                onBlur={(e) => handleCellBlur(expense, e)}
                                onKeyDown={(e) => handleKeyDown(e, expense)}
                                onDoubleClick={(e) => e.stopPropagation()}
                                inputRef={inputRef}
                                autoFocus
                                size="small"
                                fullWidth
                                variant="standard"
                              />
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {expense.icon && (() => {
                                  const IconComponent = (MuiIcons as any)[expense.icon];
                                  return IconComponent ? (
                                    <IconComponent
                                      sx={{
                                        fontSize: 20,
                                        color: expense.iconColor || '#2196f3'
                                      }}
                                    />
                                  ) : null;
                                })()}
                                <span>{expense.item}</span>
                                {/* Badge para TCs con gastos asociados */}
                                {isCreditCard(expense) && (() => {
                                  const linkedCount = getLinkedExpenses(expense.id || '', expenses).length;
                                  return linkedCount > 0 ? (
                                    <Chip
                                      label={`${linkedCount} gasto${linkedCount === 1 ? '' : 's'}`}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        bgcolor: '#7c3aed',
                                        color: 'white',
                                      }}
                                    />
                                  ) : null;
                                })()}
                              </Box>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TextField
                                  value={editValue}
                                  onChange={(e) => {
                                    const input = e.target.value;
                                    // Si el usuario está borrando, permitir
                                    if (input.length < editValue.length) {
                                      setEditValue(input);
                                      return;
                                    }
                                    // Usar formatDateInput para auto-formatear y auto-completar
                                    const { formatted } = formatDateInput(input);
                                    setEditValue(formatted);
                                  }}
                                  onBlur={(e) => handleCellBlur(expense, e)}
                                  onKeyDown={(e) => handleKeyDown(e, expense)}
                                  onDoubleClick={(e) => e.stopPropagation()}
                                  inputRef={inputRef}
                                  autoFocus
                                  size="small"
                                  variant="standard"
                                  sx={{ maxWidth: 140 }}
                                  placeholder="DD/MM/AAAA"
                                  helperText="Escribe DD/MM para auto-completar año"
                                />
                                <Tooltip title="Limpiar">
                                  <IconButton
                                    size="small"
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevenir que se pierda el foco del TextField
                                      e.stopPropagation();
                                      setEditValue('-');
                                    }}
                                    sx={{ p: 0.25 }}
                                  >
                                    <CancelIcon fontSize="small" sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : expense.vto && expense.vto !== 'Bonificado' && expense.vto !== '' && expense.vto !== '-' && /^\d{4}-\d{2}-\d{2}$/.test(expense.vto) ? (
                              format(new Date(expense.vto + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TextField
                                  value={editValue}
                                  onChange={(e) => {
                                    const input = e.target.value;
                                    // Si el usuario está borrando, permitir
                                    if (input.length < editValue.length) {
                                      setEditValue(input);
                                      return;
                                    }
                                    // Usar formatDateInput para auto-formatear y auto-completar
                                    const { formatted } = formatDateInput(input);
                                    setEditValue(formatted);
                                  }}
                                  onBlur={(e) => handleCellBlur(expense, e)}
                                  onKeyDown={(e) => handleKeyDown(e, expense)}
                                  onDoubleClick={(e) => e.stopPropagation()}
                                  inputRef={inputRef}
                                  autoFocus
                                  size="small"
                                  variant="standard"
                                  sx={{ maxWidth: 140 }}
                                  placeholder="DD/MM/AAAA"
                                  helperText="Escribe DD/MM para auto-completar año"
                                />
                                <Tooltip title="Limpiar">
                                  <IconButton
                                    size="small"
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevenir que se pierda el foco del TextField
                                      e.stopPropagation();
                                      setEditValue('-');
                                    }}
                                    sx={{ p: 0.25 }}
                                  >
                                    <CancelIcon fontSize="small" sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : expense.fechaPago && expense.fechaPago !== 'Bonificado' && expense.fechaPago !== '' && expense.fechaPago !== '-' && !expense.fechaPago.includes('PAGO') && /^\d{4}-\d{2}-\d{2}$/.test(expense.fechaPago) ? (
                              format(new Date(expense.fechaPago + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })
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
                                onChange={handleInputChange}
                                onBlur={(e) => handleCellBlur(expense, e)}
                                onKeyDown={(e) => handleKeyDown(e, expense)}
                                onDoubleClick={(e) => e.stopPropagation()}
                                inputRef={inputRef}
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
                                onChange={handleInputChange}
                                onBlur={(e) => handleCellBlur(expense, e)}
                                onKeyDown={(e) => handleKeyDown(e, expense)}
                                onDoubleClick={(e) => e.stopPropagation()}
                                inputRef={inputRef}
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                onClick={(e) => handleStatusClick(expense, e)}
                                sx={{
                                  display: 'inline-block',
                                  cursor: 'pointer',
                                }}
                              >
                                <Chip
                                  label={expense.status.toUpperCase()}
                                  size="small"
                                  sx={{
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    pointerEvents: 'none',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    },
                                    ...getStatusColor(expense.status)
                                  }}
                                />
                              </Box>

                              {/* Indicador de gasto asociado a TC */}
                              {expense.linkedToCardId && (
                                <Tooltip title="Clic para desasociar de TC" arrow>
                                  <CreditCardIcon
                                    fontSize="small"
                                    sx={{
                                      color: '#7c3aed',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleUnlinkFromCard(expense)}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {/* Ícono para asociar gastos a TC */}
                            {isCreditCard(expense) && (
                              <Tooltip
                                title={`Asociar gastos (${getLinkedExpenses(expense.id || '', expenses).length})`}
                                arrow
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenCardLinkDialog(expense)}
                                  color={getLinkedExpenses(expense.id || '', expenses).length > 0 ? 'primary' : 'default'}
                                  sx={{ mr: 0.5 }}
                                >
                                  <LinkIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title={expense.comment || ''} arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenCommentDialog(expense)}
                                  color={expense.comment ? 'info' : 'default'}
                                  sx={{ mr: 0.5, opacity: expense.comment ? 1 : 0.5 }}
                                >
                                  {expense.comment ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={expense.debt ? `Deuda: $${expense.debt.toLocaleString('es-AR')}` : ''} arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDebtDialog(expense)}
                                  sx={{
                                    mr: 0.5,
                                    color: expense.debt ? '#ef4444' : '#9ca3af',
                                    opacity: expense.debt ? 1 : 0.5
                                  }}
                                >
                                  <MoneyOffIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
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
                        </SortableRow>
                      ))
                    )}
                    </SortableContext>

                    {/* Category Subtotal */}
                    {catExpenses.length > 0 && (() => {
                      const includeInTotals = getIncludeInTotals(categoryId, category);
                      return (
                      <TableRow
                        onClick={() => {
                          if (category?.id) {
                            handleToggleIncludeInTotals(category.id, includeInTotals);
                          }
                        }}
                        sx={{
                          background: 'linear-gradient(to right, #f1f5f9, #e2e8f0)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: 'linear-gradient(to right, #e2e8f0, #cbd5e1)',
                          },
                          '& td': {
                            fontWeight: 700,
                            borderTop: '3px solid #cbd5e1',
                            borderBottom: 'none',
                            py: 1.5,
                          }
                        }}
                      >
                        <TableCell colSpan={7} align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.3s ease',
                                animation: categoryId in optimisticIncludeInTotals ? 'pulse 0.3s ease-in-out' : 'none',
                                '@keyframes pulse': {
                                  '0%, 100%': { transform: 'scale(1)' },
                                  '50%': { transform: 'scale(1.2)' },
                                },
                              }}
                            >
                              {includeInTotals ? (
                                <CheckCircleIcon
                                  sx={{
                                    color: '#16a34a',
                                    fontSize: 20,
                                    transition: 'all 0.3s ease',
                                  }}
                                />
                              ) : (
                                <CancelIcon
                                  sx={{
                                    color: '#dc2626',
                                    fontSize: 20,
                                    transition: 'all 0.3s ease',
                                  }}
                                />
                              )}
                            </Box>
                            <strong>SUBTOTAL:</strong>
                          </Box>
                        </TableCell>
                        <TableCell colSpan={2} align="right">
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {totalARS > 0 && totalUSD > 0 ? (
                              // Cuando hay ambas monedas, mostrar con separador
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  $ {totalARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.4, fontWeight: 'bold' }}>
                                  •
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" sx={{ color: '#00897b' }}>
                                  USD {totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </Typography>
                              </Box>
                            ) : (
                              // Cuando hay solo una moneda
                              <>
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
                              </>
                            )}
                            {totalUSD > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                                Total: $ {totalInARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Paper>
          </DroppableCategory>
          );
        })}

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
              {totalDebt > 0 && (
                <Box sx={{
                  textAlign: 'right',
                  pl: 2,
                  borderLeft: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.65rem', display: 'block', color: '#fca5a5' }}>
                    Deuda Total
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#ef4444', fontSize: '1.25rem', lineHeight: 1.2 }}>
                    $ {totalDebt.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
              )}
              {excludedTotalInARS > 0 && (
                <Box sx={{
                  textAlign: 'right',
                  pl: 2,
                  borderLeft: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.65rem', display: 'block', color: '#fbbf24' }}>
                    Gastos ajenos
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#f59e0b', fontSize: '1.25rem', lineHeight: 1.2 }}>
                    $ {excludedTotalInARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
              )}
              {linkedTotalInARS > 0 && (
                <Box sx={{
                  textAlign: 'right',
                  pl: 2,
                  borderLeft: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <Typography variant="caption" sx={{
                    opacity: 0.95,
                    fontSize: '0.65rem',
                    display: 'block',
                    color: '#f0e7ff'
                  }}>
                    Asociados a TC
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{
                    color: '#e9d5ff',
                    fontSize: '1.25rem',
                    lineHeight: 1.2
                  }}>
                    $ {linkedTotalInARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
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
            {editingColor && categories.find(c => c.id === editingColor)?.name}
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                Color Inicial
              </Typography>
              <TextField
                type="color"
                fullWidth
                value={tempColorFrom}
                onChange={(e) => setTempColorFrom(e.target.value)}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                Color Final
              </Typography>
              <TextField
                type="color"
                fullWidth
                value={tempColorTo}
                onChange={(e) => setTempColorTo(e.target.value)}
              />
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                background: `linear-gradient(135deg, ${tempColorFrom} 0%, ${tempColorTo} 100%)`,
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
                const categoryIndex = categories.findIndex(c => c.id === editingColor);
                const category = categories[categoryIndex];
                const defaultColors = getCategoryColor(category, categoryIndex);
                setTempColorFrom(defaultColors.from);
                setTempColorTo(defaultColors.to);
              }
            }}
          >
            Restaurar
          </Button>
          <Button
            onClick={async () => {
              if (editingColor && updateCategoryColors) {
                try {
                  await updateCategoryColors(editingColor, tempColorFrom, tempColorTo);
                } catch (error) {
                  console.error('Error saving colors:', error);
                }
              }
              setEditingColor(null);
            }}
          >
            Guardar
          </Button>
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
                <strong>{deleteCategoryDialog && categories.find(c => c.id === deleteCategoryDialog)?.name}</strong>?
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
                        // Fallback: eliminar uno por uno
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

      {/* Dialog para comentarios */}
      <CommentDialog
        open={commentDialogOpen}
        initialComment={selectedExpense?.comment}
        onClose={() => {
          setCommentDialogOpen(false);
          setSelectedExpense(null);
        }}
        onSave={handleSaveComment}
      />

      {/* Dialog para deudas */}
      <DebtDialog
        open={debtDialogOpen}
        initialDebt={selectedExpense?.debt}
        onClose={() => {
          setDebtDialogOpen(false);
          setSelectedExpense(null);
        }}
        onSave={handleSaveDebt}
      />

      {/* Dialog para asociar gastos a TC */}
      <CardLinkDialog
        open={cardLinkDialogOpen}
        creditCardExpense={selectedCreditCard}
        allExpenses={expenses}
        usdRate={usdRate}
        onClose={() => {
          setCardLinkDialogOpen(false);
          setSelectedCreditCard(null);
        }}
        onSave={handleSaveCardLinks}
      />

      {/* Dialog de confirmación para desasociar gasto */}
      <Dialog
        open={unlinkConfirmDialogOpen}
        onClose={() => {
          setUnlinkConfirmDialogOpen(false);
          setExpenseToUnlink(null);
        }}
        maxWidth="sm"
      >
        <DialogTitle>Desasociar Gasto de Tarjeta</DialogTitle>
        <DialogContent sx={{ pr: 3 }}>
          <Typography>
            ¿Estás seguro de que deseas desasociar el gasto <strong>{expenseToUnlink?.item}</strong> de la tarjeta de crédito?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Este gasto volverá a sumarse al total general.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setUnlinkConfirmDialogOpen(false);
              setExpenseToUnlink(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmUnlinkFromCard}
            variant="contained"
            color="primary"
            sx={{ px: 3, py: 1 }}
          >
            Desasociar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DragOverlay para mostrar el elemento que se está arrastrando */}
      <DragOverlay>
        {activeId ? (
          <Box
            sx={{
              bgcolor: 'white',
              p: 1.5,
              borderRadius: 1,
              boxShadow: 3,
              opacity: 0.9,
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {expenses.find(exp => exp.id === activeId)?.item || 'Moviendo...'}
            </Typography>
          </Box>
        ) : null}
      </DragOverlay>

      {/* Status Menu */}
      <Menu
        open={Boolean(statusMenuPosition)}
        onClose={handleStatusMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          statusMenuPosition
            ? { top: statusMenuPosition.top, left: statusMenuPosition.left }
            : undefined
        }
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
            },
          },
        }}
      >
        {STATUS_OPTIONS.map((status) => (
          <MenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            selected={statusMenuExpense?.status === status}
            sx={{
              minWidth: 150,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                ...getStatusColor(status),
              }}
            />
            <Typography variant="body2">
              {status === 'pago anual' ? 'Pago Anual' : status === 'sin cargo' ? 'Sin Cargo' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Sort Menu */}
      <Menu
        open={Boolean(sortMenuPosition)}
        onClose={() => setSortMenuPosition(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          sortMenuPosition
            ? { top: sortMenuPosition.top, left: sortMenuPosition.left }
            : undefined
        }
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
            },
          },
        }}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              setSortType(option.value);
              setSortMenuPosition(null);
            }}
            selected={sortType === option.value}
            sx={{
              minWidth: 220,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SortIcon fontSize="small" sx={{ color: sortType === option.value ? 'primary.main' : 'text.secondary' }} />
            <Typography variant="body2">
              {option.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
    </DndContext>
  );
};
