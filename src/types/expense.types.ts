export type Currency = 'ARS' | 'USD';

export type PaymentStatus = 'pagado' | 'bonificado' | 'pendiente' | 'pago anual';

// Category is now a string since it's dynamic per user
export type Category = string;

export interface Expense {
  id?: string;
  userId: string;
  item: string;
  icon?: string; // Icon name from Material UI
  iconColor?: string; // Custom color for the icon (hex code)
  vto: string; // Vencimiento
  fechaPago: string;
  importe: number;
  currency: Currency;
  pagadoPor: string;
  status: PaymentStatus;
  category: Category;
  month: number; // 1-12
  year: number;
  comment?: string; // Optional comment
  debt?: number; // Optional pending debt amount
  order?: number; // Order within category for drag-and-drop sorting
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthTotal {
  category: Category;
  totalARS: number;
  totalUSD: number;
}
