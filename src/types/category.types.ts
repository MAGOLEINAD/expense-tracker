export interface UserCategory {
  id?: string;
  userId: string;
  name: string;
  order: number;
  colorFrom?: string;
  colorTo?: string;
  icon?: string; // Nombre del icono de Material UI (siempre blanco)
  createdAt: Date;
  updatedAt: Date;
}
