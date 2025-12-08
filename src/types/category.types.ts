export interface UserCategory {
  id?: string;
  userId: string;
  name: string;
  order: number;
  colorFrom?: string;
  colorTo?: string;
  createdAt: Date;
  updatedAt: Date;
}
