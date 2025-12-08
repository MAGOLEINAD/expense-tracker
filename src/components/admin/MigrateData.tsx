import { Button, Paper, Typography, Alert } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const MigrateData = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Solo mostrar para el usuario específico
  if (user?.email !== 'leinadser@gmail.com') {
    return null;
  }

  const expensesDecember2025 = [
    // IMPUESTOS, SERVICIOS E INVERSIONES
    {
      item: "EXPENSAS ZUVIRIA",
      vto: "2025-12-10",
      fechaPago: "2025-11-28",
      importe: 214985.03,
      currency: "ARS" as const,
      pagadoPor: "SRIO SER A ESPASANDIN BCIUDAD",
      status: "pagado" as const,
      category: "IMPUESTOS_SERVICIOS" as const,
    },
    {
      item: "GASROGAS ZUVIRIA",
      vto: "2025-12-03",
      fechaPago: "2025-11-28",
      importe: 7412.31,
      currency: "ARS" as const,
      pagadoPor: "MPAGO",
      status: "pagado" as const,
      category: "IMPUESTOS_SERVICIOS" as const,
    },
    {
      item: "EDESUR ZUVIRIA",
      vto: "2025-11-28",
      fechaPago: "2025-11-28",
      importe: 18024.77,
      currency: "ARS" as const,
      pagadoPor: "MPAGO",
      status: "pagado" as const,
      category: "IMPUESTOS_SERVICIOS" as const,
    },
    {
      item: "FIBERTEL ZUVIRIA",
      vto: "Bonificado",
      fechaPago: "Bonificado",
      importe: 0,
      currency: "ARS" as const,
      pagadoPor: "SANTANDER RIO SER",
      status: "bonificado" as const,
      category: "IMPUESTOS_SERVICIOS" as const,
    },
    {
      item: "ABL ZUVIRIA - PAGO TOTAL 2025",
      vto: "",
      fechaPago: "PAGO Total Abril",
      importe: 0,
      currency: "ARS" as const,
      pagadoPor: "SANTANDER RIO SER",
      status: "pagado" as const,
      category: "IMPUESTOS_SERVICIOS" as const,
    },
    {
      item: "OSDE SERGIO",
      vto: "Bonificado",
      fechaPago: "Bonificado",
      importe: 0,
      currency: "ARS" as const,
      pagadoPor: "PS -SRIO-SER",
      status: "bonificado" as const,
      category: "IMPUESTOS_SERVICIOS" as const,
    },
    // SERVICIOS Y TARJETAS
    {
      item: "TC VISA ST.RIO CIERRE 28/11/2024",
      vto: "2025-12-05",
      fechaPago: "2025-12-06",
      importe: 18.6,
      currency: "USD" as const,
      pagadoPor: "SRIO-SER",
      status: "pagado" as const,
      category: "SERVICIOS_TARJETAS" as const,
    },
    {
      item: "TARJETA SANTANDER AMEX 21852",
      vto: "2025-12-09",
      fechaPago: "2025-12-06",
      importe: 40,
      currency: "USD" as const,
      pagadoPor: "SRIO-SER",
      status: "pagado" as const,
      category: "SERVICIOS_TARJETAS" as const,
    },
    {
      item: "PERSONAL SERGIO Ref Pago 1002999049610001",
      vto: "Bonificado",
      fechaPago: "Bonificado",
      importe: 0,
      currency: "ARS" as const,
      pagadoPor: "PPAY-SER",
      status: "bonificado" as const,
      category: "SERVICIOS_TARJETAS" as const,
    },
    // FORD KA
    {
      item: "SEGURO MENSUAL FED. PATRONAL (VISA ICBC FER) 20/01/22",
      vto: "",
      fechaPago: "",
      importe: 0,
      currency: "ARS" as const,
      pagadoPor: "FER VISA ICBC (DEB AUT 20/01/22)",
      status: "pendiente" as const,
      category: "FORD_KA" as const,
    },
    {
      item: "PATENTE (BIMESTRAL MESES PARES) VTO : 17/02/22",
      vto: "2022-02-17",
      fechaPago: "",
      importe: 0,
      currency: "ARS" as const,
      pagadoPor: "PMC-ICBC FER (05/2/22)",
      status: "pendiente" as const,
      category: "FORD_KA" as const,
    },
    {
      item: "LAVADOS ENE 2022 (31/01/22)",
      vto: "2022-01-31",
      fechaPago: "",
      importe: 0,
      currency: "ARS" as const,
      pagadoPor: "FER EFECTIVO",
      status: "pendiente" as const,
      category: "FORD_KA" as const,
    },
    {
      item: "MANTENIMIENTO",
      vto: "",
      fechaPago: "",
      importe: 0,
      currency: "ARS" as const,
      pagadoPor: "VISA ICBC FER",
      status: "pendiente" as const,
      category: "FORD_KA" as const,
    },
    {
      item: "NAFTA",
      vto: "",
      fechaPago: "",
      importe: 0,
      currency: "ARS" as const,
      pagadoPor: "APP YPF FER Y QR SERGIO",
      status: "pendiente" as const,
      category: "FORD_KA" as const,
    },
    {
      item: "IMPLEMENTOS",
      vto: "",
      fechaPago: "",
      importe: 0,
      currency: "ARS" as const,
      pagadoPor: "N/A",
      status: "pendiente" as const,
      category: "FORD_KA" as const,
    },
  ];

  const handleMigrate = async () => {
    if (!user) return;

    setStatus('migrating');
    setMessage('Migrando datos...');

    try {
      let count = 0;
      for (const expense of expensesDecember2025) {
        const expenseData = {
          userId: user.uid,
          item: expense.item,
          vto: expense.vto,
          fechaPago: expense.fechaPago,
          importe: expense.importe,
          currency: expense.currency,
          pagadoPor: expense.pagadoPor,
          status: expense.status,
          category: expense.category,
          month: 12,
          year: 2025,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await addDoc(collection(db, 'expenses'), expenseData);
        count++;
        setMessage(`Migrados ${count} de ${expensesDecember2025.length}...`);
      }

      setStatus('success');
      setMessage(`¡Migración completada! ${expensesDecember2025.length} gastos agregados para Diciembre 2025.`);
    } catch (error) {
      console.error('Error en migración:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light' }}>
      <Typography variant="h6" gutterBottom>
        🔧 Panel de Administración
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Importar datos de Diciembre 2025 desde Excel
      </Typography>

      {status === 'idle' && (
        <Button variant="contained" color="warning" onClick={handleMigrate}>
          Migrar Datos de Diciembre 2025
        </Button>
      )}

      {status === 'migrating' && (
        <Alert severity="info">{message}</Alert>
      )}

      {status === 'success' && (
        <Alert severity="success">
          {message}
          <br />
          <strong>Recarga la página para ver los datos.</strong>
        </Alert>
      )}

      {status === 'error' && (
        <Alert severity="error">{message}</Alert>
      )}
    </Paper>
  );
};
