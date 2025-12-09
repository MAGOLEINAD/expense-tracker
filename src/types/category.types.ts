export interface UserCategory {
  id?: string;
  userId: string;
  name: string;
  order: number;
  colorFrom?: string;
  colorTo?: string;
  icon?: string; // Nombre del icono de Material UI (siempre blanco)
  includeInTotals?: boolean; // Si se incluye en totales generales (por defecto true)
  createdAt: Date;
  updatedAt: Date;
}
