import { Button, Paper, Typography, Alert, CircularProgress, Box } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCategories } from '@/hooks/useCategories';

export const CleanupOldCategories = () => {
  const { user } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories(user?.uid);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'cleaning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [foundIssues, setFoundIssues] = useState<number>(0);

  // Solo mostrar para el usuario específico
  if (user?.email !== 'leinadser@gmail.com') {
    return null;
  }

  const analyzeData = async () => {
    if (!user) return;

    setStatus('analyzing');
    setMessage('Analizando gastos...');

    try {
      // Obtener todos los gastos del usuario
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid)
      );
      const expensesSnapshot = await getDocs(expensesQuery);

      // Obtener IDs de categorías válidas
      const validCategoryIds = new Set(
        categories.map(cat => cat.id).filter((id): id is string => id !== undefined)
      );

      // Contar gastos con categorías inválidas
      let invalidCount = 0;
      expensesSnapshot.forEach(doc => {
        const data = doc.data();
        if (!validCategoryIds.has(data.category)) {
          invalidCount++;
        }
      });

      setFoundIssues(invalidCount);
      setMessage(`Encontrados ${invalidCount} gastos con categorías antiguas/inválidas.`);
      setStatus('idle');
    } catch (error) {
      console.error('Error al analizar:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const cleanupData = async () => {
    if (!user) return;

    setStatus('cleaning');
    setMessage('Limpiando datos...');

    try {
      // Crear mapeo de nombres antiguos a IDs nuevos
      const categoryMapping: Record<string, string> = {
        'IMPUESTOS_SERVICIOS': '',
        'SERVICIOS_TARJETAS': '',
        'FORD_KA': '',
      };

      // Buscar IDs de las categorías actuales
      const impuestosCategory = categories.find(cat =>
        cat.name === 'Impuestos, Servicios e Inversiones'
      );
      const serviciosCategory = categories.find(cat =>
        cat.name === 'Servicios y Tarjetas'
      );
      const fordCategory = categories.find(cat =>
        cat.name === 'Ford Ka + SEL AT'
      );

      if (!impuestosCategory?.id || !serviciosCategory?.id || !fordCategory?.id) {
        throw new Error('No se encontraron todas las categorías necesarias. Asegúrate de tener las 3 categorías creadas.');
      }

      categoryMapping['IMPUESTOS_SERVICIOS'] = impuestosCategory.id;
      categoryMapping['SERVICIOS_TARJETAS'] = serviciosCategory.id;
      categoryMapping['FORD_KA'] = fordCategory.id;

      // Obtener todos los gastos del usuario
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid)
      );
      const expensesSnapshot = await getDocs(expensesQuery);

      // Obtener IDs de categorías válidas
      const validCategoryIds = new Set(
        categories.map(cat => cat.id).filter((id): id is string => id !== undefined)
      );

      // Procesar en lotes (Firestore permite máximo 500 operaciones por batch)
      const batchSize = 500;
      let updateCount = 0;
      let currentBatch = writeBatch(db);
      let operationsInBatch = 0;

      for (const docSnapshot of expensesSnapshot.docs) {
        const data = docSnapshot.data();

        // Si la categoría no es válida, intentar mapearla
        if (!validCategoryIds.has(data.category)) {
          const newCategoryId = categoryMapping[data.category];

          if (newCategoryId) {
            // Actualizar el documento
            const docRef = doc(db, 'expenses', docSnapshot.id);
            currentBatch.update(docRef, {
              category: newCategoryId,
              updatedAt: new Date(),
            });

            updateCount++;
            operationsInBatch++;

            // Si llegamos al límite del batch, ejecutarlo y crear uno nuevo
            if (operationsInBatch >= batchSize) {
              await currentBatch.commit();
              currentBatch = writeBatch(db);
              operationsInBatch = 0;
              setMessage(`Actualizados ${updateCount} gastos...`);
            }
          } else {
            console.warn(`No se encontró mapeo para categoría: ${data.category} en gasto ${docSnapshot.id}`);
          }
        }
      }

      // Ejecutar el último batch si tiene operaciones pendientes
      if (operationsInBatch > 0) {
        await currentBatch.commit();
      }

      setStatus('success');
      setMessage(`¡Limpieza completada! Se actualizaron ${updateCount} gastos.`);
      setFoundIssues(0);
    } catch (error) {
      console.error('Error en limpieza:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  if (categoriesLoading) {
    return (
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.light' }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Cargando categorías...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.light', border: '2px solid #2196f3' }}>
      <Typography variant="h6" gutterBottom>
        🧹 Limpieza de Categorías Antiguas
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Este proceso actualizará todos los gastos que tengan categorías hardcodeadas antiguas
        (IMPUESTOS_SERVICIOS, SERVICIOS_TARJETAS, FORD_KA) y las reemplazará con los IDs
        de las categorías actuales de tu base de datos.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>
          Categorías actuales encontradas:
        </Typography>
        {categories.map(cat => (
          <Typography key={cat.id} variant="caption" sx={{ display: 'block', ml: 2 }}>
            • {cat.name} (ID: {cat.id})
          </Typography>
        ))}
      </Box>

      {status === 'idle' && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="primary" onClick={analyzeData}>
            1. Analizar Datos
          </Button>
          {foundIssues > 0 && (
            <Button variant="contained" color="primary" onClick={cleanupData}>
              2. Limpiar {foundIssues} gastos
            </Button>
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
          <br />
          <strong>Recarga la página para ver los cambios en los gráficos.</strong>
        </Alert>
      )}

      {status === 'error' && (
        <Alert severity="error">{message}</Alert>
      )}

      {foundIssues > 0 && status === 'idle' && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Atención:</strong> Se encontraron {foundIssues} gastos con categorías antiguas.
          Haz clic en "Limpiar" para actualizarlos.
        </Alert>
      )}
    </Paper>
  );
};
