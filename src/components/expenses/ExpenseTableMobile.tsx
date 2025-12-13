import { Box, Collapse, List, ListItem, ListItemIcon, ListItemText, Paper, Stack, Typography, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import * as MuiIcons from '@mui/icons-material';
import type { Expense, UserCategory } from '@/types';
import { isCreditCard, getLinkedExpenses } from '@/utils';

interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  categoryIndex: number;
  expenses: Expense[];
  subtotalARS: number;
  subtotalUSD: number;
  totalARS: number;
  totalUSD: number;
  totalInARS: number;
  linkedARS: number;
  linkedUSD: number;
  linkedTotal: number;
}

interface ExpenseTableMobileProps {
  categoryTotals: CategoryTotal[];
  expandedCategories: Set<string>;
  onToggleCategory: (categoryId: string) => void;
  onOpenDetail: (expense: Expense) => void;
  getCategoryIcon: (category: UserCategory | undefined, index: number) => React.JSX.Element;
  getCategoryColor: (category: UserCategory | undefined, index: number) => { from: string; to: string };
  categories: UserCategory[];
  excludedCategories: CategoryTotal[];
  grandTotalARS: number;
  grandTotalUSD: number;
  grandTotalInARS: number;
  excludedTotalARS: number;
  excludedTotalUSD: number;
  excludedTotalInARS: number;
  totalDebt: number;
  linkedTotalInARS: number;
  calculateCardImporte: (expense: Expense) => number;
}

const formatCurrency = (amount: number, currency: string) => {
  if (amount === 0) return '$ 0,00';
  const formatted = amount.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return currency === 'USD' ? `USD ${formatted}` : `$ ${formatted}`;
};

export const ExpenseTableMobile = ({
  categoryTotals,
  expandedCategories,
  onToggleCategory,
  onOpenDetail,
  getCategoryIcon,
  getCategoryColor,
  categories,
  excludedCategories,
  grandTotalARS,
  grandTotalUSD,
  grandTotalInARS,
  excludedTotalARS,
  excludedTotalUSD,
  excludedTotalInARS,
  totalDebt,
  linkedTotalInARS,
  calculateCardImporte,
}: ExpenseTableMobileProps) => {

  // Función helper para obtener el ícono del gasto
  const getExpenseIcon = (expense: Expense, categoryIcon: React.JSX.Element, _categoryIndex: number) => {
    if (expense.icon) {
      const IconComponent = (MuiIcons as any)[expense.icon];
      if (IconComponent) {
        return <IconComponent sx={{ color: expense.iconColor || '#2196f3', fontSize: 20 }} />;
      }
    }
    return categoryIcon;
  };

  return (
    <Stack spacing={1.5}>
      {/* Categorías con gastos */}
      {categoryTotals.map(({ categoryId, categoryName, categoryIndex, expenses: catExpenses, subtotalARS, subtotalUSD }) => {
        const category = categories.find(c => c.id === categoryId);
        const color = getCategoryColor(category, categoryIndex);
        const categoryIcon = getCategoryIcon(category, categoryIndex);
        const isExpanded = expandedCategories.has(categoryId);

        return (
          <Paper key={categoryId} elevation={2}>
            {/* Header de categoría */}
            <Box
              onClick={() => onToggleCategory(categoryId)}
              sx={{
                background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                color: 'white',
                p: 1.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                userSelect: 'none',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {categoryIcon}
                <Typography fontWeight="bold" fontSize="0.95rem">
                  {categoryName}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Stack direction="column" alignItems="flex-end" sx={{ mr: 0.5 }}>
                  {subtotalARS > 0 && (
                    <Typography variant="body2" fontSize="0.85rem">
                      {formatCurrency(subtotalARS, 'ARS')}
                    </Typography>
                  )}
                  {subtotalUSD > 0 && (
                    <Typography variant="body2" fontSize="0.85rem">
                      {formatCurrency(subtotalUSD, 'USD')}
                    </Typography>
                  )}
                </Stack>
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Stack>
            </Box>

            {/* Lista de gastos colapsable */}
            <Collapse in={isExpanded}>
              <List sx={{ py: 0 }}>
                {catExpenses.map((expense, index) => {
                  const isCard = isCreditCard(expense);
                  const linkedCount = isCard && expense.id ? getLinkedExpenses(expense.id, catExpenses).length : 0;

                  return (
                    <ListItem
                      key={expense.id}
                      onClick={() => onOpenDetail(expense)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderBottom: index < catExpenses.length - 1 ? 1 : 0,
                        borderColor: 'divider',
                        py: 1.5,
                        px: 2,
                      }}
                    >
                      {/* IZQUIERDA: Ícono personalizado del gasto (o de categoría) */}
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getExpenseIcon(expense, categoryIcon, categoryIndex)}
                      </ListItemIcon>

                      {/* CENTRO: Nombre del item truncado */}
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {expense.item}
                            </Typography>
                            {/* Badge de gastos asociados si es TC */}
                            {isCard && linkedCount > 0 && (
                              <Chip
                                label={linkedCount}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.7rem',
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  '& .MuiChip-label': { px: 0.75 },
                                }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {expense.status}
                          </Typography>
                        }
                      />

                      {/* DERECHA: Monto */}
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={expense.currency === 'USD' ? 'success.main' : 'inherit'}
                        sx={{ ml: 1, flexShrink: 0 }}
                      >
                        {formatCurrency(
                          isCreditCard(expense) ? calculateCardImporte(expense) : expense.importe,
                          expense.currency
                        )}
                      </Typography>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </Paper>
        );
      })}

      {/* Grand Total Card */}
      {categoryTotals.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: 'white',
            p: 2,
            mt: 1,
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Total General
          </Typography>

          <Stack spacing={1}>
            {/* Total en ARS */}
            {grandTotalARS > 0 && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">ARS:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(grandTotalARS, 'ARS')}
                </Typography>
              </Stack>
            )}

            {/* Total en USD */}
            {grandTotalUSD > 0 && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">USD:</Typography>
                <Typography variant="body1" fontWeight="bold" color="success.light">
                  {formatCurrency(grandTotalUSD, 'USD')}
                </Typography>
              </Stack>
            )}

            {/* Total en ARS (convertido) */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ pt: 1, borderTop: 1, borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <Typography variant="body1" fontWeight="bold">
                Total en ARS:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(grandTotalInARS, 'ARS')}
              </Typography>
            </Stack>

            {/* Gastos asociados a TC */}
            {linkedTotalInARS > 0 && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="rgba(255,255,255,0.7)">
                  Gastos asociados a TC:
                </Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.7)">
                  {formatCurrency(linkedTotalInARS, 'ARS')}
                </Typography>
              </Stack>
            )}

            {/* Deudas */}
            {totalDebt > 0 && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="warning.light">
                  Deudas pendientes:
                </Typography>
                <Typography variant="caption" color="warning.light" fontWeight="bold">
                  {formatCurrency(totalDebt, 'ARS')}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {/* Gastos excluidos (externalidades) */}
      {excludedCategories.length > 0 && (
        <Paper
          elevation={2}
          sx={{
            background: 'linear-gradient(135deg, #64748b, #475569)',
            color: 'white',
            p: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Externalidades (no incluido en total)
          </Typography>

          <Stack spacing={0.5}>
            {excludedTotalARS > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">ARS:</Typography>
                <Typography variant="caption">
                  {formatCurrency(excludedTotalARS, 'ARS')}
                </Typography>
              </Stack>
            )}
            {excludedTotalUSD > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">USD:</Typography>
                <Typography variant="caption">
                  {formatCurrency(excludedTotalUSD, 'USD')}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" fontWeight="bold">
                Total en ARS:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(excludedTotalInARS, 'ARS')}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Mensaje si no hay gastos */}
      {categoryTotals.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No hay gastos en este mes
          </Typography>
        </Paper>
      )}
    </Stack>
  );
};
