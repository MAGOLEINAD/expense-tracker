export type Currency = 'ARS' | 'USD';

export type PaymentStatus = 'pagado' | 'bonificado' | 'pendiente';

// Category is now a string since it's dynamic per user
export type Category = string;

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
