import { useState, useEffect } from 'react';
import { Container, Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { ExpenseDialog } from '@/components/expenses/ExpenseDialog';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { Charts } from '@/components/charts/Charts';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { DashboardAppBar } from './layout/DashboardAppBar';
import { MobileDrawer } from './layout/MobileDrawer';
import { MobileDateControls } from './layout/MobileDateControls';
import { DatePickerPopover } from './navigation/DatePickerPopover';
import { UsdRatePopover } from './info/UsdRatePopover';
import { TemplateDialog } from './dialogs/TemplateDialog';
import type { Expense } from '@/types';

export const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Date and View State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState(0);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Popover Anchors
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [datePickerAnchor, setDatePickerAnchor] = useState<null | HTMLElement>(null);
  const [usdPopoverAnchor, setUsdPopoverAnchor] = useState<null | HTMLElement>(null);

  // Data State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [usdRates, setUsdRates] = useState({ compra: 0, venta: 0 });
  const [loadingUsd, setLoadingUsd] = useState(true);

  // Custom Hooks
  const {
    expenses,
    allExpenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    applyTemplate,
    clearMonth,
  } = useExpenses(selectedMonth, selectedYear);

  const { categories } = useCategories(user?.uid);

  // Fetch USD rate
  useEffect(() => {
    setLoadingUsd(true);
    fetch('https://dolarapi.com/v1/dolares/oficial')
      .then((res) => res.json())
      .then((data) => {
        if (data.compra && data.venta) {
          setUsdRates({ compra: data.compra, venta: data.venta });
        }
      })
      .catch(() => {
        console.log('Using default USD rate');
        setUsdRates({ compra: 1000, venta: 1020 });
      })
      .finally(() => {
        setLoadingUsd(false);
      });
  }, []);

  // Event Handlers - Expense CRUD
  const handleSaveExpense = async (expense: Partial<Expense>) => {
    try {
      if (editingExpense?.id) {
        await updateExpense(editingExpense.id, expense);
        enqueueSnackbar('Gasto actualizado exitosamente', { variant: 'success' });
      } else {
        await addExpense(expense);
        enqueueSnackbar('Gasto agregado exitosamente', { variant: 'success' });
      }
      setEditingExpense(null);
    } catch (error) {
      console.error('Error saving expense:', error);
      enqueueSnackbar('Error al guardar el gasto', { variant: 'error' });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleUpdate = async (expense: Expense, previousExpense?: Expense, silent?: boolean) => {
    if (!expense.id) return;
    try {
      await updateExpense(expense.id, expense);

      if (!silent) {
        const categoryChanged = previousExpense && previousExpense.category !== expense.category;

        if (categoryChanged) {
          enqueueSnackbar('Gasto trasladado de categoría', { variant: 'info' });
        } else {
          enqueueSnackbar('Gasto actualizado exitosamente', { variant: 'success' });
        }
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      if (!silent) {
        enqueueSnackbar('Error al actualizar el gasto', { variant: 'error' });
      }
    }
  };

  const handleDelete = async (id: string) => {
    setExpenseToDelete(id);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      try {
        await deleteExpense(expenseToDelete);
        enqueueSnackbar('Gasto eliminado exitosamente', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar('Error al eliminar el gasto', { variant: 'error' });
      }
    }
    setConfirmDialogOpen(false);
    setExpenseToDelete(null);
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => deleteExpense(id)));
      enqueueSnackbar(`${ids.length} gastos eliminados exitosamente`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al eliminar los gastos', { variant: 'error' });
    }
  };

  const handleOpenDialog = () => {
    setEditingExpense(null);
    setDialogOpen(true);
  };

  // Event Handlers - Navigation
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Event Handlers - Template
  const handleApplyTemplate = async (sourceMonth: number, sourceYear: number) => {
    try {
      await applyTemplate(sourceMonth, sourceYear, selectedMonth, selectedYear);
      enqueueSnackbar('Template aplicado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error applying template:', error);
      enqueueSnackbar('Error al aplicar el template', { variant: 'error' });
    }
  };

  const handleClearMonth = async () => {
    try {
      await clearMonth(selectedMonth, selectedYear);
      enqueueSnackbar('Gastos eliminados exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error clearing month:', error);
      enqueueSnackbar('Error al eliminar los gastos', { variant: 'error' });
    }
  };

  return (
    <>
      <DashboardAppBar
        isMobile={isMobile}
        user={user}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        usdRates={usdRates}
        loadingUsd={loadingUsd}
        activeTab={activeTab}
        userMenuAnchor={anchorEl}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onOpenDatePicker={(e) => setDatePickerAnchor(e.currentTarget)}
        onOpenTemplate={() => setTemplateDialogOpen(true)}
        onToggleTab={() => setActiveTab(activeTab === 0 ? 1 : 0)}
        onOpenExpenseDialog={handleOpenDialog}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        onOpenUsdPopover={(e) => setUsdPopoverAnchor(e.currentTarget)}
        onOpenUserMenu={(e) => setAnchorEl(e.currentTarget)}
        onCloseUserMenu={() => setAnchorEl(null)}
        onOpenSettings={() => {
          setCategoryManagerOpen(true);
          setAnchorEl(null);
        }}
        onLogout={logout}
      />

      <MobileDrawer
        open={mobileDrawerOpen}
        activeTab={activeTab}
        onClose={() => setMobileDrawerOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      <DatePickerPopover
        open={Boolean(datePickerAnchor)}
        anchorEl={datePickerAnchor}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onClose={() => setDatePickerAnchor(null)}
        onMonthChange={(month) => setSelectedMonth(month)}
        onYearChange={(year) => setSelectedYear(year)}
      />

      <UsdRatePopover
        open={Boolean(usdPopoverAnchor)}
        anchorEl={usdPopoverAnchor}
        compra={usdRates.compra}
        venta={usdRates.venta}
        onClose={() => setUsdPopoverAnchor(null)}
      />

      <Container maxWidth="xl" sx={{ py: isMobile ? 1 : 1.5, px: isMobile ? 1 : 2 }}>



        {isMobile && (
          <MobileDateControls
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
            onOpenDatePicker={(e) => setDatePickerAnchor(e.currentTarget)}
            onOpenExpenseDialog={handleOpenDialog}
            onOpenTemplate={() => setTemplateDialogOpen(true)}
          />
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === 0 && (
              <ExpenseTable
                expenses={expenses}
                categories={categories}
                onEdit={handleEdit}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onDeleteMultiple={handleDeleteMultiple}
              />
            )}
            {activeTab === 1 && (
              <Charts allExpenses={allExpenses} currentYear={selectedYear} currentMonth={selectedMonth} categories={categories} />
            )}
          </>
        )}
      </Container>

      <ExpenseDialog
        open={dialogOpen}
        expense={editingExpense}
        categories={categories}
        onClose={() => {
          setDialogOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      <TemplateDialog
        open={templateDialogOpen}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        hasExpenses={expenses.length > 0}
        onClose={() => setTemplateDialogOpen(false)}
        onApplyTemplate={handleApplyTemplate}
        onClearMonth={handleClearMonth}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        title="Confirmar eliminación"
        message="¿Estás seguro de que deseas eliminar este gasto?"
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmDialogOpen(false);
          setExpenseToDelete(null);
        }}
      />

      <CategoryManager
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
    </>
  );
};
