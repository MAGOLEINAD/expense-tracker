import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton,
  Avatar,
  Menu,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Popover,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BarChartIcon from '@mui/icons-material/BarChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpenseDialog } from '@/components/expenses/ExpenseDialog';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { Charts } from '@/components/charts/Charts';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { Expense } from '@/types';
import { MONTHS } from '@/utils';

export const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateSourceMonth, setTemplateSourceMonth] = useState(12);
  const [templateSourceYear, setTemplateSourceYear] = useState(new Date().getFullYear());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [datePickerAnchor, setDatePickerAnchor] = useState<null | HTMLElement>(null);
  const [usdRates, setUsdRates] = useState({ compra: 0, venta: 0 });
  const [usdPopoverAnchor, setUsdPopoverAnchor] = useState<null | HTMLElement>(null);

  const { expenses, allExpenses, loading, addExpense, updateExpense, deleteExpense, applyTemplate, clearMonth } = useExpenses(
    selectedMonth,
    selectedYear
  );

  // Fetch USD rate (Oficial)
  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares/oficial')
      .then(res => res.json())
      .then(data => {
        if (data.compra && data.venta) {
          setUsdRates({ compra: data.compra, venta: data.venta });
        }
      })
      .catch(() => {
        console.log('Using default USD rate');
        setUsdRates({ compra: 1000, venta: 1020 });
      });
  }, []);

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

  const handleUpdate = async (expense: Expense, previousExpense?: Expense) => {
    if (!expense.id) return;
    try {
      await updateExpense(expense.id, expense);

      // Detectar si fue un cambio de categoría
      const categoryChanged = previousExpense && previousExpense.category !== expense.category;

      if (categoryChanged) {
        enqueueSnackbar('Gasto trasladado de categoría', { variant: 'info' });
      } else {
        enqueueSnackbar('Gasto actualizado exitosamente', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      enqueueSnackbar('Error al actualizar el gasto', { variant: 'error' });
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
      await Promise.all(ids.map(id => deleteExpense(id)));
      enqueueSnackbar(`${ids.length} gastos eliminados exitosamente`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al eliminar los gastos', { variant: 'error' });
    }
  };

  const handleOpenDialog = () => {
    setEditingExpense(null);
    setDialogOpen(true);
  };

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


  const handleApplyTemplate = async () => {
    try {
      await applyTemplate(templateSourceMonth, templateSourceYear, selectedMonth, selectedYear);
      setTemplateDialogOpen(false);
      enqueueSnackbar('Template aplicado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error applying template:', error);
      enqueueSnackbar('Error al aplicar el template', { variant: 'error' });
    }
  };

  const handleClearMonth = async () => {
    try {
      await clearMonth(selectedMonth, selectedYear);
      setTemplateDialogOpen(false);
      enqueueSnackbar('Gastos eliminados exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error clearing month:', error);
      enqueueSnackbar('Error al eliminar los gastos', { variant: 'error' });
    }
  };

  return (
    <>
      {/* AppBar consolidado */}
      <AppBar
        position="sticky"
        elevation={3}
        sx={{
          background: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
        }}
      >
        <Toolbar sx={{ minHeight: 56, gap: 2, px: 3 }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {!isMobile && (
            <>
              {/* Izquierda: Avatar y Dólar */}
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                size="small"
                sx={{
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                  }
                }}
              >
                <Avatar src={user?.photoURL || ''} sx={{ width: 28, height: 28 }}>
                  {user?.displayName?.[0]}
                </Avatar>
              </IconButton>

              <Box
                onClick={(e) => setUsdPopoverAnchor(e.currentTarget)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1.5,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'white',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Typography variant="caption" sx={{ color: '#01579b', fontSize: '0.65rem', display: 'block', lineHeight: 1, fontWeight: 600 }}>
                  Dólar Oficial
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.3, color: '#00897b' }}>
                  $ {usdRates.venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1 }} />

              {/* Centro: Navegación de mes */}
              <IconButton
                onClick={handlePreviousMonth}
                size="small"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>

              <Box
                onClick={(e) => setDatePickerAnchor(e.currentTarget)}
                sx={{
                  px: 2,
                  py: 0.5,
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  color: '#01579b',
                  borderRadius: 1.5,
                  minWidth: 150,
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    bgcolor: 'white',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </Typography>
              </Box>

              <IconButton
                onClick={handleNextMonth}
                size="small"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>

              <Button
                variant="contained"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() => setTemplateDialogOpen(true)}
                size="small"
                sx={{
                  textTransform: 'none',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  ml: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                  boxShadow: 'none',
                }}
              >
                Template
              </Button>

              <Box sx={{ flexGrow: 1 }} />

              {/* Derecha: Análisis y Nuevo Gasto */}
              <Button
                variant="contained"
                startIcon={activeTab === 0 ? <BarChartIcon fontSize="small" /> : <ListAltIcon fontSize="small" />}
                onClick={() => setActiveTab(activeTab === 0 ? 1 : 0)}
                size="small"
                sx={{
                  textTransform: 'none',
                  color: 'white',
                  fontWeight: 600,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                  boxShadow: 'none',
                }}
              >
                {activeTab === 0 ? 'Análisis' : 'Gastos'}
              </Button>

              <Button
                variant="contained"
                startIcon={<AddIcon fontSize="small" />}
                onClick={handleOpenDialog}
                size="small"
                sx={{
                  textTransform: 'none',
                  bgcolor: 'white',
                  color: '#01579b',
                  fontWeight: 700,
                  '&:hover': {
                    bgcolor: '#f0f9ff',
                  },
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                Nuevo Gasto
              </Button>
            </>
          )}

          {isMobile && (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
                💰 Gastos
              </Typography>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                <Avatar src={user?.photoURL || ''} sx={{ width: 28, height: 28 }}>
                  {user?.displayName?.[0]}
                </Avatar>
              </IconButton>
            </>
          )}

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.displayName}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={logout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 18 }} /> Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)}>
        <Box sx={{ width: 250, pt: 1 }}>
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Menú
            </Typography>
          </Box>
          <Divider />
          <List dense>
            <ListItem component="div" onClick={() => { setActiveTab(0); setMobileDrawerOpen(false); }} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <ListAltIcon color={activeTab === 0 ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Gastos" />
            </ListItem>
            <ListItem component="div" onClick={() => { setActiveTab(1); setMobileDrawerOpen(false); }} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <BarChartIcon color={activeTab === 1 ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Análisis" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Popover para selector de fecha */}
      <Popover
        open={Boolean(datePickerAnchor)}
        anchorEl={datePickerAnchor}
        onClose={() => setDatePickerAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, minWidth: 280 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: 'text.secondary' }}>
            Seleccionar fecha
          </Typography>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Mes</InputLabel>
              <Select
                value={selectedMonth}
                label="Mes"
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setDatePickerAnchor(null);
                }}
              >
                {MONTHS.map((month, index) => (
                  <MenuItem key={month} value={index + 1}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Año</InputLabel>
              <Select
                value={selectedYear}
                label="Año"
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setDatePickerAnchor(null);
                }}
              >
                {[2023, 2024, 2025, 2026, 2027].map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Popover>

      {/* Popover para dólar oficial */}
      <Popover
        open={Boolean(usdPopoverAnchor)}
        anchorEl={usdPopoverAnchor}
        onClose={() => setUsdPopoverAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#01579b' }}>
            Dólar Oficial
          </Typography>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                Compra
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0288d1' }}>
                $ {usdRates.compra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                Venta
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#00897b' }}>
                $ {usdRates.venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Popover>

      <Container maxWidth="xl" sx={{ py: isMobile ? 1 : 1.5, px: isMobile ? 1 : 2 }}>
        {/* Mobile: controles compactos */}
        {isMobile && (
          <>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                bgcolor: 'background.paper',
                p: 1,
                borderRadius: 2,
                mb: 1.5,
                boxShadow: 1,
              }}
            >
              <IconButton onClick={handlePreviousMonth} size="small" color="primary">
                <ChevronLeftIcon />
              </IconButton>

              <Box
                onClick={(e) => setDatePickerAnchor(e.currentTarget)}
                sx={{
                  px: 2,
                  py: 0.5,
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: 1.5,
                  minWidth: 140,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </Typography>
              </Box>

              <IconButton onClick={handleNextMonth} size="small" color="primary">
                <ChevronRightIcon />
              </IconButton>

              <Box sx={{ flexGrow: 1 }} />

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Nuevo
              </Button>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => setTemplateDialogOpen(true)}
              fullWidth
              size="small"
              sx={{ mb: 1.5, textTransform: 'none' }}
            >
              Aplicar Template
            </Button>
          </>
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
                onEdit={handleEdit}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onDeleteMultiple={handleDeleteMultiple}
              />
            )}
            {activeTab === 1 && (
              <Charts allExpenses={allExpenses} currentYear={selectedYear} />
            )}
          </>
        )}
      </Container>

      {/* Dialogs */}
      <ExpenseDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        expense={editingExpense}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
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
                value={templateSourceMonth}
                label="Mes origen"
                onChange={(e) => setTemplateSourceMonth(Number(e.target.value))}
              >
                {MONTHS.map((month, index) => (
                  <MenuItem key={month} value={index + 1}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Año origen</InputLabel>
              <Select
                value={templateSourceYear}
                label="Año origen"
                onChange={(e) => setTemplateSourceYear(Number(e.target.value))}
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
            onClick={handleClearMonth}
            color="error"
            variant="outlined"
            disabled={expenses.length === 0}
          >
            Limpiar Mes Actual
          </Button>
          <Box>
            <Button onClick={() => setTemplateDialogOpen(false)} sx={{ mr: 1 }}>
              Cancelar
            </Button>
            <Button onClick={handleApplyTemplate} variant="contained" startIcon={<ContentCopyIcon />}>
              Aplicar
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialogOpen}
        title="Eliminar Gasto"
        message="¿Estás seguro de que deseas eliminar este gasto?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        severity="warning"
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmDialogOpen(false);
          setExpenseToDelete(null);
        }}
      />
    </>
  );
};
