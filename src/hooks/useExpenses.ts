import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expense } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const useExpenses = (month: number, year: number) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener gastos del mes actual
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('userId', '==', user.uid),
      where('month', '==', month),
      where('year', '==', year),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Expense[];
      setExpenses(expensesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, month, year]);

  // Obtener TODOS los gastos del usuario (para gráficos)
  useEffect(() => {
    if (!user) {
      setAllExpenses([]);
      return;
    }

    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('userId', '==', user.uid),
      orderBy('year', 'desc'),
      orderBy('month', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Expense[];
      setAllExpenses(expensesData);
    });

    return () => unsubscribe();
  }, [user]);

  const addExpense = async (expense: Partial<Expense>) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'expenses'), {
        ...expense,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      const expenseRef = doc(db, 'expenses', id);

      // Crear objeto de actualización
      const updateData: any = {
        updatedAt: new Date(),
      };

      // Copiar campos, usando deleteField() para valores null
      Object.keys(expense).forEach((key) => {
        const value = (expense as any)[key];

        // Si el valor es null, usar deleteField() para eliminar el campo
        if (value === null) {
          updateData[key] = deleteField();
        }
        // Si no es undefined, agregarlo
        else if (value !== undefined) {
          updateData[key] = value;
        }
      });

      await updateDoc(expenseRef, updateData);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  const applyTemplate = async (sourceMonth: number, sourceYear: number, targetMonth: number, targetYear: number) => {
    if (!user) return;

    try {
      // Obtener gastos del mes fuente
      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('userId', '==', user.uid),
        where('month', '==', sourceMonth),
        where('year', '==', sourceYear)
      );

      const snapshot = await new Promise<any>((resolve) => {
        const unsubscribe = onSnapshot(q, (snap) => {
          unsubscribe();
          resolve(snap);
        });
      });

      const sourceExpenses = snapshot.docs.map((doc: any) => doc.data()) as Expense[];

      // Crear batch para agregar múltiples documentos
      const batch = writeBatch(db);
      const timestamp = new Date();

      sourceExpenses.forEach((expense) => {
        const newDocRef = doc(collection(db, 'expenses'));
        batch.set(newDocRef, {
          userId: user.uid,
          item: expense.item,
          category: expense.category,
          currency: expense.currency,
          pagadoPor: expense.pagadoPor,
          // Copiar icono y su color si existen
          ...(expense.icon && { icon: expense.icon }),
          ...(expense.iconColor && { iconColor: expense.iconColor }),
          // Campos vacíos/pendientes
          vto: '',
          fechaPago: '',
          importe: 0,
          status: 'pendiente' as const,
          month: targetMonth,
          year: targetYear,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error applying template:', error);
      throw error;
    }
  };

  const clearMonth = async (month: number, year: number) => {
    if (!user) return;

    try {
      // Obtener todos los gastos del mes
      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('userId', '==', user.uid),
        where('month', '==', month),
        where('year', '==', year)
      );

      const snapshot = await new Promise<any>((resolve) => {
        const unsubscribe = onSnapshot(q, (snap) => {
          unsubscribe();
          resolve(snap);
        });
      });

      // Eliminar todos los documentos en batch
      const batch = writeBatch(db);
      snapshot.docs.forEach((document: any) => {
        batch.delete(document.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error clearing month:', error);
      throw error;
    }
  };

  const linkExpensesToCard = async (cardId: string, expenseIds: string[]) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const batch = writeBatch(db);

      expenseIds.forEach(expenseId => {
        const expenseRef = doc(db, 'expenses', expenseId);
        batch.update(expenseRef, {
          linkedToCardId: cardId,
          updatedAt: new Date()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error linking expenses to card:', error);
      throw error;
    }
  };

  const unlinkExpensesFromCard = async (expenseIds: string[]) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const batch = writeBatch(db);

      expenseIds.forEach(expenseId => {
        const expenseRef = doc(db, 'expenses', expenseId);
        batch.update(expenseRef, {
          linkedToCardId: deleteField(),
          updatedAt: new Date()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error unlinking expenses from card:', error);
      throw error;
    }
  };

  return {
    expenses,
    allExpenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    applyTemplate,
    clearMonth,
    linkExpensesToCard,
    unlinkExpensesFromCard,
  };
};
