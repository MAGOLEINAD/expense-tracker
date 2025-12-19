import type { Currency, Expense } from '@/types';
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

/**
 * Formatea automáticamente la entrada de fecha con barras (/) y auto-completa el año
 * @param value - El valor ingresado por el usuario
 * @returns Objeto con el texto formateado y la fecha completa en formato YYYY-MM-DD
 */
export const formatDateInput = (value: string): { formatted: string; isoDate: string | null } => {
  // Auto-completar día con 0 si escribe un solo dígito + "/" (ej: "3/" -> "03/")
  let processedValue = value;
  if (/^[1-9]\//.test(value)) {
    processedValue = '0' + value;
  }

  // Auto-completar mes con 0 si escribe DD/ + un solo dígito + "/" (ej: "03/1/" -> "03/01/")
  if (/^(\d{2})\/([1-9])\/$/.test(processedValue)) {
    processedValue = processedValue.replace(/^(\d{2})\/([1-9])\/$/, '$1/0$2/');
  }

  // Remover todo lo que no sea número
  const numbers = processedValue.replace(/\D/g, '');

  let formatted = '';
  let isoDate = null;

  // Formatear DD/MM/YYYY con barras automáticas
  if (numbers.length > 0) {
    // Limitar día entre 01 y 31
    let day = numbers.substring(0, 2);
    const dayNum = parseInt(day);
    if (dayNum > 31) {
      day = '31';
    } else if (dayNum === 0 && day.length === 2) {
      day = '01';
    }
    formatted = day;

    if (numbers.length >= 3) {
      // Limitar mes entre 01 y 12
      let month = numbers.substring(2, 4);
      const monthNum = parseInt(month);
      if (monthNum > 12) {
        month = '12';
      } else if (monthNum === 0 && month.length === 2) {
        month = '01';
      }
      formatted += '/' + month;
    }
    if (numbers.length >= 5) {
      // Limitar año a máximo 2050
      let year = numbers.substring(4, 8);
      if (year.length === 4 && parseInt(year) > 2050) {
        year = '2050';
      }
      formatted += '/' + year;
    }

    // Auto-completar año si solo hay DD/MM (4 dígitos)
    if (numbers.length === 4) {
      const day = numbers.substring(0, 2);
      const month = numbers.substring(2, 4);
      const currentYear = new Date().getFullYear();

      // Validar que día y mes sean válidos
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);

      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
        isoDate = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } else if (numbers.length >= 8) {
      // Convertir DD/MM/YYYY a YYYY-MM-DD para el estado interno
      const day = numbers.substring(0, 2);
      const month = numbers.substring(2, 4);
      const year = numbers.substring(4, 8);

      // Validar fecha
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum <= 2050) {
        isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }

  return { formatted, isoDate };
};

/**
 * Convierte fecha de formato YYYY-MM-DD a DD/MM/YYYY
 * @param isoDate - Fecha en formato YYYY-MM-DD
 * @returns Fecha en formato DD/MM/YYYY
 */
export const isoToDisplayDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Detecta si un gasto es una tarjeta de crédito (contiene "TC" en el nombre)
 * @param expense - El gasto a verificar
 * @returns true si el gasto es una TC, false en caso contrario
 */
export const isCreditCard = (expense: Expense): boolean => {
  return expense.item.toUpperCase().includes('TC');
};

/**
 * Obtiene todos los gastos vinculados a una tarjeta de crédito
 * @param cardId - El ID de la tarjeta de crédito
 * @param allExpenses - Array con todos los gastos
 * @returns Array de gastos vinculados a la TC
 */
export const getLinkedExpenses = (
  cardId: string,
  allExpenses: Expense[]
): Expense[] => {
  return allExpenses.filter(exp => exp.linkedToCardId === cardId);
};
