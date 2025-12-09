import { useMemo, useState, useEffect } from 'react';
import { Paper, Typography, Box, useMediaQuery, useTheme, Stack, CircularProgress } from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import type { Expense, UserCategory } from '@/types';
import { MONTHS } from '@/utils';

interface ChartsProps {
  allExpenses: Expense[];
  currentYear: number;
  currentMonth: number;
  categories: UserCategory[];
}

const COLORS = ['#2196f3', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#f97316'];

export const Charts = ({ allExpenses, currentYear, currentMonth, categories }: ChartsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [inflationData, setInflationData] = useState({ monthly: 0, annual: 0 });
  const [usdRate, setUsdRate] = useState<number>(1200);
  const [loadingInflation, setLoadingInflation] = useState(true);

  // Fetch USD rate
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

  // Fetch inflation data from API
  useEffect(() => {
    setLoadingInflation(true);
    fetch('https://api.argentinadatos.com/v1/finanzas/indices/inflacion')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // Get the latest inflation data
          const latest = data[data.length - 1];
          setInflationData({
            monthly: latest.valor || 0,
            annual: data.slice(-12).reduce((sum: number, item: any) => sum + (item.valor || 0), 0),
          });
        }
      })
      .catch(() => {
        console.log('Could not fetch inflation data');
      })
      .finally(() => {
        setLoadingInflation(false);
      });
  }, []);

  // Helper function to convert expense to ARS
  const expenseToARS = (expense: Expense): number => {
    return expense.currency === 'USD' ? expense.importe * usdRate : expense.importe;
  };

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <Paper elevation={3} sx={{ p: 1.5, bgcolor: 'white', border: '1px solid #e5e7eb' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
            {label || data.name || data.category || data.mes}
          </Typography>

          {/* For multi-line charts, show each category's value */}
          {payload.length > 1 || !data.value ? (
            payload.map((entry: any, index: number) => (
              <Typography key={index} variant="body2" sx={{ fontSize: '0.75rem', color: entry.color }}>
                {entry.name}: <strong>${entry.value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</strong>
              </Typography>
            ))
          ) : (
            <>
              {/* Show ARS if exists */}
              {data.ars !== undefined && data.ars > 0 && (
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  ARS: <strong>${data.ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</strong>
                </Typography>
              )}

              {/* Show USD if exists with ARS equivalent */}
              {data.usd !== undefined && data.usd > 0 && (
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#00897b' }}>
                  USD: <strong>{data.usd.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</strong>
                  <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#64748b' }}>
                    (${(data.usd * usdRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })})
                  </Typography>
                </Typography>
              )}

              {/* Show total */}
              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700, mt: 0.5, pt: 0.5, borderTop: '1px solid #e5e7eb' }}>
                Total: <strong>${(data.value || data.monto || data.total || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</strong>
              </Typography>
            </>
          )}
        </Paper>
      );
    }
    return null;
  };

  // Crear un mapa de categoryId -> categoryName
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(cat => {
      if (cat.id) {
        map[cat.id] = cat.name;
      }
    });
    return map;
  }, [categories]);

  // Obtener categorías únicas dinámicamente
  const activeCategories = useMemo(() => {
    const categoriesInUse = new Set(
      allExpenses
        .filter(exp => exp.year === currentYear)
        .map(exp => exp.category)
    );
    return Array.from(categoriesInUse);
  }, [allExpenses, currentYear]);

  // Filtrar categorías incluidas en totales
  const includedCategoryIds = useMemo(() => {
    return new Set(
      categories
        .filter(cat => cat.includeInTotals ?? true)
        .map(cat => cat.id)
        .filter((id): id is string => id !== undefined)
    );
  }, [categories]);

  // 1️⃣ Distribución de gastos por categoría (mes actual)
  const categoryDistributionData = useMemo(() => {
    const monthExpenses = allExpenses.filter(
      exp => exp.month === currentMonth && exp.year === currentYear && exp.status !== 'pendiente' && exp.status !== 'sin cargo'
    );

    const categoryTotals: Record<string, { ars: number; usd: number; totalARS: number }> = {};

    monthExpenses.forEach(exp => {
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = { ars: 0, usd: 0, totalARS: 0 };
      }
      if (exp.currency === 'USD') {
        categoryTotals[exp.category].usd += exp.importe;
        categoryTotals[exp.category].totalARS += exp.importe * usdRate;
      } else {
        categoryTotals[exp.category].ars += exp.importe;
        categoryTotals[exp.category].totalARS += exp.importe;
      }
    });

    return Object.entries(categoryTotals)
      .map(([category, data]) => ({
        name: categoryMap[category] || category,
        value: data.totalARS,
        ars: data.ars,
        usd: data.usd,
      }))
      .filter(item => item.value > 0);
  }, [allExpenses, currentMonth, currentYear, categoryMap, usdRate]);

  // 2️⃣ Comparación de categorías (mes actual)
  const categoryComparisonData = useMemo(() => {
    const monthExpenses = allExpenses.filter(
      exp => exp.month === currentMonth && exp.year === currentYear && exp.status !== 'pendiente' && exp.status !== 'sin cargo'
    );

    const categoryTotals: Record<string, { ars: number; usd: number; totalARS: number }> = {};

    monthExpenses.forEach(exp => {
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = { ars: 0, usd: 0, totalARS: 0 };
      }
      if (exp.currency === 'USD') {
        categoryTotals[exp.category].usd += exp.importe;
        categoryTotals[exp.category].totalARS += exp.importe * usdRate;
      } else {
        categoryTotals[exp.category].ars += exp.importe;
        categoryTotals[exp.category].totalARS += exp.importe;
      }
    });

    return Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category: categoryMap[category] || category,
        monto: data.totalARS,
        ars: data.ars,
        usd: data.usd,
      }))
      .filter(item => item.monto > 0)
      .sort((a, b) => b.monto - a.monto);
  }, [allExpenses, currentMonth, currentYear, categoryMap, usdRate]);

  // 3️⃣ Evolución de gastos mes a mes (total)
  const monthlyEvolutionData = useMemo(() => {
    return MONTHS.map((month, index) => {
      const monthExpenses = allExpenses.filter(
        exp => exp.month === index + 1 && exp.year === currentYear && exp.status !== 'pendiente' && exp.status !== 'sin cargo' && includedCategoryIds.has(exp.category)
      );

      const total = monthExpenses.reduce((sum, exp) => sum + expenseToARS(exp), 0);

      return {
        mes: isMobile ? month.slice(0, 3) : month,
        total,
      };
    });
  }, [allExpenses, currentYear, isMobile, usdRate, includedCategoryIds]);

  // 4️⃣ Evolución por categoría en el tiempo
  const categoryEvolutionData = useMemo(() => {
    return MONTHS.map((month, index) => {
      const monthExpenses = allExpenses.filter(
        exp => exp.month === index + 1 && exp.year === currentYear && exp.status !== 'pendiente' && exp.status !== 'sin cargo'
      );

      const categoryTotals: Record<string, number> = {};

      // Inicializar totales solo para categorías activas
      activeCategories.forEach(cat => {
        categoryTotals[cat] = 0;
      });

      monthExpenses.forEach(exp => {
        if (categoryTotals[exp.category] !== undefined) {
          categoryTotals[exp.category] += expenseToARS(exp);
        }
      });

      const result: any = {
        mes: isMobile ? month.slice(0, 3) : month,
      };

      // Agregar cada categoría activa
      activeCategories.forEach(cat => {
        result[categoryMap[cat] || cat] = categoryTotals[cat];
      });

      return result;
    });
  }, [allExpenses, currentYear, isMobile, activeCategories, categoryMap, usdRate]);

  // Cálculos de resumen
  const yearToDateTotal = monthlyEvolutionData.reduce((sum, data) => sum + data.total, 0);
  const averageMonthly = yearToDateTotal / 12;
  const currentMonthTotal = categoryDistributionData.reduce((sum, item) => sum + item.value, 0);

  // Calcular inflación basada en datos propios
  const myInflationData = useMemo(() => {
    // Inflación mensual: comparar mes actual vs mes anterior
    const currentMonthExpenses = allExpenses.filter(
      exp => exp.month === currentMonth && exp.year === currentYear && exp.status !== 'pendiente' && exp.status !== 'sin cargo' && includedCategoryIds.has(exp.category)
    );
    const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => sum + expenseToARS(exp), 0);

    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const previousMonthExpenses = allExpenses.filter(
      exp => exp.month === previousMonth && exp.year === previousMonthYear && exp.status !== 'pendiente' && exp.status !== 'sin cargo' && includedCategoryIds.has(exp.category)
    );
    const previousMonthTotal = previousMonthExpenses.reduce((sum, exp) => sum + expenseToARS(exp), 0);

    const monthlyInflation = previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : 0;

    // Inflación anual: comparar año actual vs año anterior
    const currentYearExpenses = allExpenses.filter(exp => exp.year === currentYear && exp.status !== 'pendiente' && exp.status !== 'sin cargo' && includedCategoryIds.has(exp.category));
    const currentYearTotal = currentYearExpenses.reduce((sum, exp) => sum + expenseToARS(exp), 0);

    const previousYearExpenses = allExpenses.filter(exp => exp.year === currentYear - 1 && exp.status !== 'pendiente' && exp.status !== 'sin cargo' && includedCategoryIds.has(exp.category));
    const previousYearTotal = previousYearExpenses.reduce((sum, exp) => sum + expenseToARS(exp), 0);

    const annualInflation = previousYearTotal > 0
      ? ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100
      : 0;

    return {
      monthly: monthlyInflation,
      annual: annualInflation,
    };
  }, [allExpenses, currentMonth, currentYear, usdRate, includedCategoryIds]);

  // Calcular totales de gastos excluidos (Gastos ajenos)
  const excludedTotals = useMemo(() => {
    const currentMonthExpenses = allExpenses.filter(
      exp => exp.month === currentMonth && exp.year === currentYear && exp.status !== 'pendiente' && exp.status !== 'sin cargo' && !includedCategoryIds.has(exp.category)
    );
    const total = currentMonthExpenses.reduce((sum, exp) => sum + expenseToARS(exp), 0);

    return { total };
  }, [allExpenses, currentMonth, currentYear, usdRate, includedCategoryIds]);

  return (
    <Box>
      {/* Cards de resumen */}
      <Stack direction={isMobile ? 'column' : 'row'} spacing={1.5} sx={{ mb: 2 }}>
        <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
            Resumen {currentYear}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.25, flexWrap: 'nowrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
              ${(yearToDateTotal / 1000).toFixed(0)}k
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              (total)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', mx: 0.25 }}>
              |
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
              ${(averageMonthly / 1000).toFixed(0)}k
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              (prom)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', mx: 0.25 }}>
              |
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
              ${(currentMonthTotal / 1000).toFixed(0)}k
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              (mes)
            </Typography>
          </Box>
        </Paper>
        <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1, bgcolor: '#fff3e0', border: '1px solid #ffe0b2', flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#f57c00', fontSize: '0.7rem', display: 'block' }}>
            Inflación Mensual
          </Typography>
          {loadingInflation ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
              <CircularProgress size={20} sx={{ color: '#f57c00' }} />
              <Typography variant="caption" sx={{ color: '#f57c00', fontSize: '0.7rem' }}>
                Cargando...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.25, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#e65100' }}>
                {inflationData.monthly.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#f57c00', fontSize: '0.7rem' }}>
                (oficial)
              </Typography>
              <Typography variant="caption" sx={{ color: '#f57c00', fontSize: '0.7rem', mx: 0.25 }}>
                |
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#e65100' }}>
                {myInflationData.monthly.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#f57c00', fontSize: '0.7rem' }}>
                (mis datos)
              </Typography>
            </Box>
          )}
        </Paper>
        <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1, bgcolor: '#ffebee', border: '1px solid #ffcdd2', flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#c62828', fontSize: '0.7rem', display: 'block' }}>
            Inflación Anual
          </Typography>
          {loadingInflation ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
              <CircularProgress size={20} sx={{ color: '#c62828' }} />
              <Typography variant="caption" sx={{ color: '#c62828', fontSize: '0.7rem' }}>
                Cargando...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.25, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#b71c1c' }}>
                {inflationData.annual.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#c62828', fontSize: '0.7rem' }}>
                (oficial)
              </Typography>
              <Typography variant="caption" sx={{ color: '#c62828', fontSize: '0.7rem', mx: 0.25 }}>
                |
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#b71c1c' }}>
                {myInflationData.annual.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#c62828', fontSize: '0.7rem' }}>
                (mis datos)
              </Typography>
            </Box>
          )}
        </Paper>
        {excludedTotals.total > 0 && (
          <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1, bgcolor: '#fef3c7', border: '1px solid #fde68a', flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#92400e', fontSize: '0.7rem', display: 'block' }}>
              Gastos ajenos
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.25, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#78350f' }}>
                ${(excludedTotals.total / 1000).toFixed(0)}k
              </Typography>
              <Typography variant="caption" sx={{ color: '#92400e', fontSize: '0.7rem' }}>
                (mes)
              </Typography>
            </Box>
          </Paper>
        )}
      </Stack>

      <Stack spacing={2}>
        {/* 1️⃣ Distribución de gastos por categoría */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <PieChartIcon sx={{ color: '#2196f3', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2937' }}>
              Distribución de gastos por categoría
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
            Cuánto representa cada categoría del total mensual
          </Typography>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
            <PieChart>
              <Pie
                data={categoryDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={isMobile ? 80 : 100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryDistributionData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>

        {/* 2️⃣ Comparación de categorías (mismo mes) */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <BarChartIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2937' }}>
              Comparación de categorías (mes actual)
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
            Monto total por categoría, comparado en barras verticales
          </Typography>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
            <BarChart data={categoryComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="monto" name="Monto gastado" radius={[4, 4, 0, 0]}>
                {categoryComparisonData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* 3️⃣ Evolución de gastos mes a mes (total) */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <ShowChartIcon sx={{ color: '#14b8a6', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2937' }}>
              Evolución de gastos mes a mes
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
            Cómo varía el gasto total a lo largo de los meses del año
          </Typography>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
            <LineChart data={monthlyEvolutionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="total"
                name="Total del mes"
                stroke="#14b8a6"
                strokeWidth={3}
                dot={{ fill: '#14b8a6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        {/* 4️⃣ Evolución por categoría en el tiempo */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <TimelineIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2937' }}>
              Evolución por categoría en el tiempo
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
            Cómo cambia cada categoría específica a lo largo de los meses
          </Typography>
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <LineChart data={categoryEvolutionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
              {activeCategories.map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={categoryMap[category] || category}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[index % COLORS.length], r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Stack>
    </Box>
  );
};
