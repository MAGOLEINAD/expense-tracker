export type Currency = 'ARS' | 'USD';

export type PaymentStatus = 'pagado' | 'bonificado' | 'pendiente' | 'pago anual' | 'sin cargo';

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
  linkedToCardId?: string; // ID of the credit card expense this is linked to
  cardTotalARS?: number; // Total ARS de la TC (solo para gastos TC)
  cardTotalUSD?: number; // Total USD de la TC (solo para gastos TC)
  cardUSDRate?: number; // Cotización USD usada para la TC (solo para gastos TC)
  cardTax?: number; // Impuesto Db.rg 5617 30% (solo para gastos TC)
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthTotal {
  category: Category;
  totalARS: number;
  totalUSD: number;
}
