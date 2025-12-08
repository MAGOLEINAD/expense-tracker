import { useState } from 'react';
import { Button, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export const MigrateDataFernando = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const TARGET_USER_EMAIL = 'feradan56@gmail.com';
  const MONTH = 12; // Diciembre
  const YEAR = 2025;

  // Datos de migración extraídos del Excel
  const categories = [
    { id: 'gastos-comunes', name: 'Gastos de Fer y Any' },
    { id: 'ford-ka', name: 'Gastos Auto Ford Ka' },
  ];

  const expenses = [
    // GASTOS DE FER Y ANY
    {
      item: 'EDESUR BERTRES',
      vto: '2025-12-15',
      fechaPago: '2025-12-15',
      importe: 0,
      currency: 'ARS',
      pagadoPor: 'PMC-ICBC FER',
      status: 'pendiente',
      category: 'gastos-comunes',
    },
    {
      item: 'TC-VISA-SRIO-ANY-FER-ARI 27/11/25',
      vto: '2025-12-05',
      fechaPago: '2025-12-02',
      importe: 876310.10,
      currency: 'ARS',
      pagadoPor: 'SRIO-ANY',
      status: 'pagado',
      category: 'gastos-comunes',
      comment: 'SE PAGO EL 02/12/25 $ 1.147.462,42 + usd 509,18 (de Ariel) + usd 15,87 (de Fer) - SE HIZO EL STOP DEBIT EL 02/12/25 - RESTAR: 1) FED PAT (20/11) $186287 + 2) Flow $ 27477,42 + 3) NAFTA $ 70016+ LA CAJA $ 10383,4 -- TOTAL A REGISTRAR: $ 853298,6 + USD 15,87 (Aprox $ 23011) -- TOTAL EN PESOS + EQ DOLARES: $ 876310,1',
    },
    {
      item: 'TC-AMEX-SRIO-ANY',
      vto: '2025-12-05',
      fechaPago: '',
      importe: 0,
      currency: 'ARS',
      pagadoPor: 'DA-SRIO-ANY',
      status: 'pendiente',
      category: 'gastos-comunes',
      comment: 'cierre 27/11/25',
    },
    {
      item: 'TC-MC-ICBC-FER',
      vto: '2025-12-03',
      fechaPago: '2025-12-02',
      importe: 7084.00,
      currency: 'ARS',
      pagadoPor: 'PT-ICBC-FER',
      status: 'pagado',
      category: 'gastos-comunes',
      comment: 'cierre 20/11/25',
    },
    {
      item: 'TC-VISA-ICBC-FER',
      vto: '2025-12-10',
      fechaPago: '',
      importe: 0,
      currency: 'ARS',
      pagadoPor: 'PT-ICBC-FER',
      status: 'pendiente',
      category: 'gastos-comunes',
      comment: 'cierre 27/11/25',
    },
    {
      item: 'AYSA BERTRES',
      vto: '2025-12-22',
      fechaPago: '2025-12-02',
      importe: 29405.27,
      currency: 'ARS',
      pagadoPor: 'PMC-ICBC-FER',
      status: 'pagado',
      category: 'gastos-comunes',
    },
    {
      item: 'METROGAS BERTRES',
      vto: '2025-12-15',
      fechaPago: '2025-12-15',
      importe: 16883.09,
      currency: 'ARS',
      pagadoPor: 'PMC-ICBC-FER',
      status: 'pendiente',
      category: 'gastos-comunes',
    },
    {
      item: 'ABL BERTRES-C-12',
      vto: '2025-12-09',
      fechaPago: '2025-12-02',
      importe: 17455.12,
      currency: 'ARS',
      pagadoPor: 'PMC-ICBC-FER',
      status: 'pagado',
      category: 'gastos-comunes',
    },
    {
      item: 'PERSONAL-FLOW (ABONOS de diciembre 2025)',
      vto: '2025-12-05',
      fechaPago: '2025-12-02',
      importe: 27477.42,
      currency: 'ARS',
      pagadoPor: 'DA TC VISA SRIO FER',
      status: 'pagado',
      category: 'gastos-comunes',
      comment: 'PERIODOS DEL ABONO: 21/11 al 20/12 (SIN "CONSUMOS") DEBITADO EN TC: EL 25/11/25',
    },
    {
      item: 'OMINT (ANY Y FER) NOVIEMBRE 2025',
      vto: '2025-12-05',
      fechaPago: '2025-12-02',
      importe: 439500.00,
      currency: 'ARS',
      pagadoPor: 'SRIO-ANY',
      status: 'pagado',
      category: 'gastos-comunes',
      comment: 'AHORA COBRAN POR MES VENCIDO DESDE EL MES DE JULIO 2024 - CUOTA $ 447732,64 -- ACREDITARON SALDO ANTERIOR DE $ 141507,86 Y $ 45932,66 (OBRA SOCIAL), NETO $ 260292,12',
    },
    {
      item: 'CLARO FER',
      vto: '2025-12-09',
      fechaPago: '2025-12-02',
      importe: 20184.98,
      currency: 'ARS',
      pagadoPor: 'PMC-ICBC-FER',
      status: 'pagado',
      category: 'gastos-comunes',
    },
    {
      item: 'CLARO ANY & DISNEY+',
      vto: '2025-12-09',
      fechaPago: '2025-12-02',
      importe: 38583.99,
      currency: 'ARS',
      pagadoPor: 'PMC-ICBC-FER',
      status: 'pagado',
      category: 'gastos-comunes',
    },
    {
      item: 'UTEDYC DICIEMBRE 2025',
      vto: '2025-12-10',
      fechaPago: '2025-12-02',
      importe: 1000.00,
      currency: 'ARS',
      pagadoPor: 'TRA SRIO ANY',
      status: 'pagado',
      category: 'gastos-comunes',
      comment: 'ALIAS: PASADO.TIEMPO.ALGA -- ENVIAR CPTE A CELU: 11-5927-3451 (INDICANDO NyAp) - VALOR DE CUOTA HASTA DICIEMBRE 2025 = $1000',
    },
    {
      item: 'DIAZ VELEZ (LUZ, GAS, AYSA, ABL)',
      vto: '2025-12-15',
      fechaPago: '2025-12-22',
      importe: 0,
      currency: 'ARS',
      pagadoPor: 'PMC-ICBC-FER',
      status: 'pendiente',
      category: 'gastos-comunes',
      comment: 'IMP Y SERVICIOS NOVIEMBRE: LOCATARIOS ABONARON EL 01/12/25: LUZ: $ _____; GAS $25136,25; AYSA $23890,39; ABL $33553,54; SEGURO $0 ---',
    },
    {
      item: 'EXPENSAS NOVIEMBRE 2025 D.VELEZ 3960 (VTO DICIEMBRE 2025)',
      vto: '2025-12-15',
      fechaPago: '2025-12-15',
      importe: 0,
      currency: 'ARS',
      pagadoPor: 'TRA SRIO-FER A CUENTA DE CONSORCIO (SRIO)',
      status: 'pendiente',
      category: 'gastos-comunes',
      comment: 'EXPENSAS DE NOVIEMBRE 2025: ORDINARIAS ($ ,70) -- EXTRAORD: ($0) -- -- FER PAGA EL __/12/25: ($,70) -- INQUILINOS PAGARON ORDINARIAS EL __/12/25',
    },

    // GASTOS AUTO FORD Ka
    {
      item: 'PATENTE ANUAL 2025 FORD KA',
      vto: '2025-02-24',
      fechaPago: '2025-02-18',
      importe: 180997.56,
      currency: 'ARS',
      pagadoPor: 'PMC ICBC FER',
      status: 'pagado',
      category: 'ford-ka',
      comment: 'SERGIO PAGÓ CUOTA ANUAL DE 2025 EL 18/02/2025',
    },
    {
      item: 'SEGURO DEL FORD KA',
      vto: '2025-11-20',
      fechaPago: '2025-11-18',
      importe: 186287.19,
      currency: 'ARS',
      pagadoPor: 'TC VISA SRIO FER',
      status: 'pagado',
      category: 'ford-ka',
      comment: 'CUOTA N° 3 /12 DEL 17/9/2025 AL 17/9/2026 - COBERTURA AL DIA 17 DE CADA MES',
    },
    {
      item: 'LAVADOS NOVIEMBRE 2025',
      vto: '2025-11-30',
      fechaPago: '2025-11-01',
      importe: 20000.00,
      currency: 'ARS',
      pagadoPor: 'TD SRIO FER',
      status: 'pagado',
      category: 'ford-ka',
      comment: '1 LAVADO EN DOBLAS Y DIRECTORIO',
    },
    {
      item: 'NAFTA NOVIEMBRE (1 CARGA)',
      vto: '2025-11-30',
      fechaPago: '2025-11-22',
      importe: 70015.98,
      currency: 'ARS',
      pagadoPor: 'TC VISA SRIO FER (APP YPF SERVICLUB)',
      status: 'pagado',
      category: 'ford-ka',
      comment: 'NAFTA DE NOVIEMBRE 2025: CARGO 1 TANQUE FER TOTAL GASTADO: $ 70015,98',
    },
    {
      item: 'MANTENIMIENTO',
      vto: '2025-11-30',
      fechaPago: '',
      importe: 0,
      currency: 'ARS',
      pagadoPor: 'TC VISA ICBC FER',
      status: 'pendiente',
      category: 'ford-ka',
    },
    {
      item: 'IMPLEMENTOS - ARREGLOS',
      vto: '2025-11-30',
      fechaPago: '',
      importe: 0,
      currency: 'ARS',
      pagadoPor: 'TC VISA ICBC FER',
      status: 'pendiente',
      category: 'ford-ka',
    },
  ];

  const handleMigrate = async () => {
    if (!user) {
      setResult({
        success: false,
        message: '❌ Error: Usuario no autenticado',
      });
      return;
    }

    if (user.email !== TARGET_USER_EMAIL) {
      setResult({
        success: false,
        message: `❌ Error: Debes estar autenticado como ${TARGET_USER_EMAIL} para ejecutar esta migración. Usuario actual: ${user.email}`,
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 1. Crear las categorías primero
      for (const category of categories) {
        await setDoc(doc(db, 'categories', `${user.uid}_${category.id}`), {
          id: category.id,
          name: category.name,
          userId: user.uid,
          createdAt: new Date(),
          order: categories.indexOf(category),
        });
      }

      // 2. Crear los gastos
      let successCount = 0;
      for (const expense of expenses) {
        await addDoc(collection(db, 'expenses'), {
          userId: user.uid,
          item: expense.item,
          vto: expense.vto,
          fechaPago: expense.fechaPago || '',
          importe: expense.importe,
          currency: expense.currency,
          pagadoPor: expense.pagadoPor,
          status: expense.status,
          category: expense.category,
          month: MONTH,
          year: YEAR,
          comment: expense.comment || '',
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        successCount++;
      }

      setResult({
        success: true,
        message: `✅ Migración exitosa! Se crearon ${categories.length} categorías y ${successCount} gastos para ${TARGET_USER_EMAIL} en ${MONTH}/${YEAR}`,
      });
    } catch (error) {
      console.error('Error en migración:', error);
      setResult({
        success: false,
        message: `❌ Error en la migración: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const isCorrectUser = user?.email === TARGET_USER_EMAIL;

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3, bgcolor: isCorrectUser ? 'background.paper' : 'warning.light' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Migración de Datos - Fernando
      </Typography>

      {!isCorrectUser && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>⚠️ Atención:</strong> Para ejecutar esta migración debes estar autenticado como <strong>{TARGET_USER_EMAIL}</strong>.
          <br />
          Usuario actual: <strong>{user?.email || 'No autenticado'}</strong>
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Usuario destino: <strong>{TARGET_USER_EMAIL}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Período: <strong>Diciembre {YEAR}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Categorías a crear: <strong>{categories.length}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Gastos a importar: <strong>{expenses.length}</strong>
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Categorías:
        </Typography>
        {categories.map((cat) => (
          <Typography key={cat.id} variant="caption" sx={{ display: 'block', ml: 2 }}>
            • {cat.name}
          </Typography>
        ))}
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleMigrate}
        disabled={loading || !isCorrectUser}
        fullWidth
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Iniciar Migración'}
      </Button>

      {result && (
        <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 2 }}>
          {result.message}
        </Alert>
      )}
    </Paper>
  );
};
