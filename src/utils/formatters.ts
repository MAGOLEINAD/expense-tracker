import type { Currency } from '@/types';
import { CURRENCY_SYMBOLS } from './constants';

/**
 * Formatea un número como moneda
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return currency === 'USD' ? `${symbol} ${formatted}` : `${symbol} ${formatted}`;
};

/**
 * Formatea una fecha en formato dd/MM/yyyy
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-AR').format(dateObj);
};

/**
 * Obtiene el nombre del mes
 */
export const getMonthName = (month: number): string => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1] || '';
};

/**
 * Genera años para el selector
 */
export const generateYearOptions = (startYear: number = 2020): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear + 1; year >= startYear; year--) {
    years.push(year);
  }
  return years;
};
