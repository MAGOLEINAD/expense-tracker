import type { PaymentStatus, Currency } from '@/types';

// Estados de pago disponibles
export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'pagado',
  'bonificado',
  'pendiente',
] as const;

// Etiquetas legibles para estados
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pagado: 'Pagado',
  bonificado: 'Bonificado',
  pendiente: 'Pendiente',
};

// Monedas disponibles
export const CURRENCIES: readonly Currency[] = ['ARS', 'USD'] as const;

// Símbolos de moneda
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ARS: '$',
  USD: 'USD',
};

// Meses del año
export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

// Colores para estados
export const STATUS_COLORS: Record<PaymentStatus, string> = {
  pagado: '#4caf50',
  bonificado: '#2196f3',
  pendiente: '#ff9800',
};
