import { Button, Paper, Typography, Alert, CircularProgress, Box, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';

interface OrphanedExpense {
  id: string;
  item: string;
  category: string;
  importe: number;
  month: number;
  year: number;
}

export const CleanupOrphanedExpenses = () => {
  const { user } = useAuth();
  const { categories, findOrphanedExpenses, cleanupOrphanedExpenses } = useCategories(user?.uid);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'cleaning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [orphanedExpenses, setOrphanedExpenses] = useState<OrphanedExpense[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const analyzeData = async () => {
    setStatus('analyzing');
    setMessage('Buscando gastos huérfanos...');

    try {
      const orphaned = await findOrphanedExpenses();
      setOrphanedExpenses(orphaned as OrphanedExpense[]);

      if (orphaned.length === 0) {
        setMessage('¡Excelente! No se encontraron gastos huérfanos.');
        setStatus('success');
      } else {
        setMessage(`Se encontraron ${orphaned.length} gasto(s) huérfano(s).`);
        setStatus('idle');
      }
    } catch (error) {
      console.error('Error al analizar:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const cleanupData = async () => {
    setStatus('cleaning');
    setMessage('Eliminando gastos huérfanos...');

    try {
      const count = await cleanupOrphanedExpenses();
      setStatus('success');
      setMessage(`¡Limpieza completada! Se eliminaron ${count} gasto(s) huérfano(s).`);
      setOrphanedExpenses([]);
    } catch (error) {
      console.error('Error en limpieza:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light', border: '2px solid #ff9800' }}>
        <Typography variant="h6" gutterBottom>
          🔍 Limpieza de Gastos Huérfanos
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Los gastos huérfanos son aquellos que están asociados a categorías que ya no existen.
          Esta herramienta los detecta y te permite eliminarlos de forma segura.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>
            Categorías válidas actuales:
          </Typography>
          {categories.map(cat => (
            <Typography key={cat.id} variant="caption" sx={{ display: 'block', ml: 2 }}>
              • {cat.name}
            </Typography>
          ))}
        </Box>

        {status === 'idle' && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" color="warning" onClick={analyzeData}>
              1. Buscar Gastos Huérfanos
            </Button>
            {orphanedExpenses.length > 0 && (
              <>
                <Button variant="outlined" color="info" onClick={() => setShowDetailsDialog(true)}>
                  Ver Detalles ({orphanedExpenses.length})
                </Button>
                <Button variant="contained" color="error" onClick={cleanupData}>
                  2. Eliminar {orphanedExpenses.length} gasto(s)
                </Button>
              </>
            )}
          </Box>
        )}

        {status === 'analyzing' && (
          <Alert severity="info" icon={<CircularProgress size={20} />}>
            {message}
          </Alert>
        )}

        {status === 'cleaning' && (
          <Alert severity="info" icon={<CircularProgress size={20} />}>
            {message}
          </Alert>
        )}

        {status === 'success' && (
          <Alert severity="success">
            {message}
          </Alert>
        )}

        {status === 'error' && (
          <Alert severity="error">{message}</Alert>
        )}

        {orphanedExpenses.length > 0 && status === 'idle' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Atención:</strong> Se encontraron {orphanedExpenses.length} gasto(s) con categorías que ya no existen.
            Estos gastos pueden estar causando que aparezcan categorías fantasma en tus análisis.
          </Alert>
        )}
      </Paper>

      {/* Diálogo de detalles */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Gastos Huérfanos Encontrados</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Estos gastos están asociados a categorías que ya no existen:
          </Typography>
          <List dense>
            {orphanedExpenses.map((expense) => (
              <ListItem key={expense.id} sx={{ borderBottom: '1px solid #e0e0e0' }}>
                <ListItemText
                  primary={`${expense.item} - $${expense.importe.toLocaleString('es-AR')}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="error">
                        Categoría inválida: {expense.category}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption">
                        {expense.month}/{expense.year}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
