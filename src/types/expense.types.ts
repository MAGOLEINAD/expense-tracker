export type Currency = 'ARS' | 'USD';

export type PaymentStatus = 'pagado' | 'bonificado' | 'pendiente';

export type Category =
  | 'IMPUESTOS_SERVICIOS'
  | 'SERVICIOS_TARJETAS'
  | 'FORD_KA';

export interface Expense {
  id?: string;
  userId: string;
  item: string;
  vto: string; // Vencimiento
  fechaPago: string;
  importe: number;
  currency: Currency;
  pagadoPor: string;
  status: PaymentStatus;
  category: Category;
  month: number; // 1-12
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthTotal {
  category: Category;
  totalARS: number;
  totalUSD: number;
}
