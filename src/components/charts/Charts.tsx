import { useMemo } from 'react';
import { Paper, Typography, Box, useMediaQuery, useTheme, Stack } from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import type { Expense } from '@/types';
import { MONTHS, CATEGORY_LABELS } from '@/utils';

interface ChartsProps {
  allExpenses: Expense[];
  currentYear: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ p: 1.5, bgcolor: 'white', border: '1px solid #e5e7eb' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Typography key={index} variant="body2" sx={{ fontSize: '0.75rem' }}>
            {entry.name}: <strong>${entry.value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</strong>
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

export const Charts = ({ allExpenses, currentYear }: ChartsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Obtener categorías únicas dinámicamente de los gastos del año actual
  const activeCategories = useMemo(() => {
    const categoriesInUse = new Set(
      allExpenses
        .filter(exp => exp.year === currentYear)
        .map(exp => exp.category)
    );
    return Array.from(categoriesInUse);
  }, [allExpenses, currentYear]);

  const monthlyData = useMemo(() => {
    return MONTHS.map((month, index) => {
      const monthExpenses = allExpenses.filter(
        exp => exp.month === index + 1 && exp.year === currentYear
      );

      const categoryTotals: Record<string, number> = {};

      // Inicializar totales solo para categorías activas
      activeCategories.forEach(cat => {
        categoryTotals[cat] = 0;
      });

      monthExpenses.forEach(exp => {
        if (categoryTotals[exp.category] !== undefined) {
          categoryTotals[exp.category] += exp.importe;
        }
      });

      const total = monthExpenses.reduce((sum, exp) => sum + exp.importe, 0);

      const result: any = {
        month: isMobile ? month.slice(0, 3) : month,
        total,
      };

      // Agregar cada categoría activa con su label corto
      activeCategories.forEach(cat => {
        const label = CATEGORY_LABELS[cat].split(' ')[0];
        result[label] = categoryTotals[cat];
      });

      return result;
    });
  }, [allExpenses, currentYear, isMobile, activeCategories]);

  const yearlyData = useMemo(() => {
    const years = [currentYear - 2, currentYear - 1, currentYear];

    return years.map(year => {
      const yearExpenses = allExpenses.filter(exp => exp.year === year);
      const total = yearExpenses.reduce((sum, exp) => sum + exp.importe, 0);

      return {
        year: year.toString(),
        total,
      };
    });
  }, [allExpenses, currentYear]);

  const categoryYearData = useMemo(() => {
    return activeCategories.map(category => {
      const categoryExpenses = allExpenses.filter(
        exp => exp.category === category && exp.year === currentYear
      );
      const total = categoryExpenses.reduce((sum, exp) => sum + exp.importe, 0);

      return {
        name: CATEGORY_LABELS[category].split(' ')[0],
        value: total,
      };
    }).filter(item => item.value > 0);
  }, [allExpenses, currentYear, activeCategories]);

  const yearToDateTotal = monthlyData.reduce((sum, data) => sum + data.total, 0);
  const averageMonthly = yearToDateTotal / 12;
  const highestMonth = monthlyData.reduce((max, data) => data.total > max.total ? data : max);

  return (
    <Box>
      {/* Resumen compacto */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
            Total {currentYear}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mt: 0.25 }}>
            ${(yearToDateTotal / 1000).toFixed(0)}k
          </Typography>
        </Paper>
        <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
            Promedio
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mt: 0.25 }}>
            ${(averageMonthly / 1000).toFixed(0)}k
          </Typography>
        </Paper>
        <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
            Mayor
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mt: 0.25, fontSize: '0.875rem' }}>
            {highestMonth.month.slice(0, 3)}
          </Typography>
        </Paper>
      </Stack>

      <Stack spacing={2}>
        {/* Gráfico principal - Evolución Mensual con categorías */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <ShowChartIcon sx={{ color: '#2196f3', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2937' }}>
              Evolución Mensual por Categoría
            </Typography>
          </Stack>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 380}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
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
                {activeCategories.map((category, index) => {
                  const colors = ['#2196f3', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#10b981'];
                  const label = CATEGORY_LABELS[category].split(' ')[0];
                  return (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={label}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ fill: colors[index % colors.length], r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>

            {/* Leyenda personalizada dinámica */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }} flexWrap="wrap">
              {activeCategories.map((category, index) => {
                const colors = ['#2196f3', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#10b981'];
                const label = CATEGORY_LABELS[category].split(' ')[0];
                return (
                  <Box key={category} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 3, bgcolor: colors[index % colors.length], borderRadius: 1 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b' }}>{label}</Typography>
                  </Box>
                );
              })}
          </Stack>
        </Paper>

        {/* Comparación Anual */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <BarChartIcon sx={{ color: '#64748b', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2937' }}>
              Comparación Anual
            </Typography>
          </Stack>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
              <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: '#1f2937', fontWeight: 600 }}
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
                <Bar
                  dataKey="total"
                  name="Total anual"
                  fill="#64748b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={80}
                />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Total por Categoría */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2937', mb: 1.5 }}>
            Total por Categoría {currentYear}
          </Typography>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
              <BarChart data={categoryYearData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#1f2937', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  name="Total"
                  fill="#2196f3"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={40}
                />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Stack>
    </Box>
  );
};
