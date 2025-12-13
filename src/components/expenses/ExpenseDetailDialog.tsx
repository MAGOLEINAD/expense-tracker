import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Stack,
  Box,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import * as MuiIcons from '@mui/icons-material';
import type { Expense, UserCategory, PaymentStatus } from '@/types';
import { formatCurrency, isCreditCard, getLinkedExpenses } from '@/utils';

interface ExpenseDetailDialogProps {
  open: boolean;
  expense: Expense | null;
  categories: UserCategory[];
  allExpenses: Expense[];
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onOpenComment: (expense: Expense) => void;
  onOpenDebt: (expense: Expense) => void;
  onOpenCardLink: (expense: Expense) => void;
  onUnlinkFromCard: (expense: Expense) => void;
  onStatusChange: (expense: Expense, newStatus: PaymentStatus) => void;
  statusColors: Record<PaymentStatus, string>;
  usdRate: number;
}

const STATUS_OPTIONS: PaymentStatus[] = ['pendiente', 'pagado', 'bonificado', 'pago anual', 'sin cargo'];

export const ExpenseDetailDialog = ({
  open,
  expense,
  categories,
  allExpenses,
  onClose,
  onEdit,
  onDelete,
  onOpenComment,
  onOpenDebt,
  onOpenCardLink,
  onUnlinkFromCard,
  onStatusChange,
  statusColors,
  usdRate,
}: ExpenseDetailDialogProps) => {
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);

  if (!expense) return null;

  const category = categories.find(c => c.id === expense.category);
  const categoryName = category?.name || expense.category;
  const isCard = isCreditCard(expense);
  const linkedExpenses = isCard && expense.id ? getLinkedExpenses(expense.id, allExpenses) : [];

  // Obtener ícono del gasto
  const ExpenseIcon = expense.icon ? (MuiIcons as any)[expense.icon] : null;

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  const handleStatusChange = (newStatus: PaymentStatus) => {
    onStatusChange(expense, newStatus);
    handleStatusMenuClose();
  };

  return (
    <>
      <Dialog fullScreen open={open} onClose={onClose}>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Detalle del Gasto
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={onClose}
              aria-label="cerrar"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {/* Categoría */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                Categoría
              </Typography>
              <Typography variant="body1">{categoryName}</Typography>
            </Box>

            {/* Item con ícono */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                Item
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {ExpenseIcon && (
                  <ExpenseIcon sx={{ color: expense.iconColor || 'action.active', fontSize: 24 }} />
                )}
                <Typography variant="body1" fontWeight={500}>
                  {expense.item}
                </Typography>
              </Stack>
            </Box>

            <Divider />

            {/* Importe destacado */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                Importe
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                color={expense.currency === 'USD' ? 'success.main' : 'primary.main'}
              >
                {formatCurrency(expense.importe, expense.currency)}
              </Typography>
              {expense.currency === 'USD' && (
                <Typography variant="caption" color="text.secondary">
                  ≈ {formatCurrency(expense.importe * usdRate, 'ARS')} (cotización: ${usdRate.toFixed(2)})
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Fechas */}
            <Stack direction="row" spacing={2}>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Vencimiento
                </Typography>
                <Typography variant="body1">{expense.vto || '-'}</Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Fecha de Pago
                </Typography>
                <Typography variant="body1">{expense.fechaPago || '-'}</Typography>
              </Box>
            </Stack>

            {/* Pagado Por */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                Pagado Por
              </Typography>
              <Typography variant="body1">{expense.pagadoPor || '-'}</Typography>
            </Box>

            {/* Estado clickeable */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                Estado
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={expense.status}
                  onClick={handleStatusMenuOpen}
                  sx={{
                    bgcolor: statusColors[expense.status],
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Comment si existe */}
            {expense.comment && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Comentario
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {expense.comment}
                </Typography>
              </Box>
            )}

            {/* Debt si existe */}
            {expense.debt && expense.debt > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Deuda Pendiente
                </Typography>
                <Typography variant="body1" color="warning.main" fontWeight="bold">
                  {formatCurrency(expense.debt, 'ARS')}
                </Typography>
              </Box>
            )}

            {/* Gastos asociados (si es TC) */}
            {isCard && linkedExpenses.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Gastos Asociados ({linkedExpenses.length})
                </Typography>
                <List dense sx={{ bgcolor: 'background.default', borderRadius: 1, mt: 1 }}>
                  {linkedExpenses.map(exp => (
                    <ListItem key={exp.id} divider>
                      <ListItemText
                        primary={exp.item}
                        secondary={`${exp.status} - ${exp.pagadoPor}`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(exp.importe, exp.currency)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Información de enlace a TC */}
            {expense.linkedToCardId && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Enlace
                </Typography>
                <Typography variant="body2" color="info.main">
                  Este gasto está asociado a una tarjeta de crédito
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Botones de acción */}
            <Stack direction="column" spacing={1.5}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CommentIcon />}
                onClick={() => {
                  onClose();
                  onOpenComment(expense);
                }}
              >
                {expense.comment ? 'Editar Comentario' : 'Agregar Comentario'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<MoneyOffIcon />}
                onClick={() => {
                  onClose();
                  onOpenDebt(expense);
                }}
              >
                {expense.debt && expense.debt > 0 ? 'Editar Deuda' : 'Agregar Deuda'}
              </Button>

              {isCard && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  onClick={() => {
                    onClose();
                    onOpenCardLink(expense);
                  }}
                >
                  Asociar Gastos ({linkedExpenses.length})
                </Button>
              )}

              {expense.linkedToCardId && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  startIcon={<LinkOffIcon />}
                  onClick={() => {
                    onClose();
                    onUnlinkFromCard(expense);
                  }}
                >
                  Desasociar de TC
                </Button>
              )}
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => {
              onClose();
              onEdit(expense);
            }}
            startIcon={<EditIcon />}
            variant="contained"
            fullWidth
            size="large"
          >
            Editar
          </Button>
          <Button
            onClick={() => {
              onClose();
              onDelete(expense);
            }}
            color="error"
            startIcon={<DeleteIcon />}
            variant="outlined"
            fullWidth
            size="large"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu de estado */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        {STATUS_OPTIONS.map(status => (
          <MenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            selected={expense.status === status}
          >
            <Chip
              label={status}
              size="small"
              sx={{
                bgcolor: statusColors[status],
                color: 'white',
                fontWeight: 'bold',
                mr: 1,
              }}
            />
            {status}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
