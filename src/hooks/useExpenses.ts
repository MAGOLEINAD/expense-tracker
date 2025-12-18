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

  const applyTemplate = async (
    sourceMonth: number,
    sourceYear: number,
    targetMonth: number,
    targetYear: number,
    keepCardLinks: boolean = false,
    keepRecurringExpenses: boolean = true,
    keepPagoAnual: boolean = true,
    keepBonificado: boolean = true
  ) => {
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

      let sourceExpenses = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];

      // Filtrar gastos según los switches de gastos recurrentes
      if (keepRecurringExpenses) {
        // Si está activado el master switch, filtrar según los switches específicos
        sourceExpenses = sourceExpenses.filter((expense) => {
          // Mantener el gasto si:
          // 1. No es "pago anual" ni "bonificado" (siempre se copia)
          // 2. Es "pago anual" y keepPagoAnual está activado
          // 3. Es "bonificado" y keepBonificado está activado
          if (expense.status === 'pago anual') {
            return keepPagoAnual;
          }
          if (expense.status === 'bonificado') {
            return keepBonificado;
          }
          // Los demás gastos siempre se copian
          return true;
        });
      } else {
        // Si el master switch está desactivado, excluir todos los "pago anual" y "bonificado"
        sourceExpenses = sourceExpenses.filter((expense) => {
          return expense.status !== 'pago anual' && expense.status !== 'bonificado';
        });
      }

      // Crear batch para agregar múltiples documentos
      const batch = writeBatch(db);
      const timestamp = new Date();

      // Mapa para relacionar IDs antiguos con nuevos (para TCs)
      const oldToNewIdMap = new Map<string, string>();

      // Primera pasada: crear todos los documentos y mapear IDs
      sourceExpenses.forEach((expense) => {
        const newDocRef = doc(collection(db, 'expenses'));
        const newId = newDocRef.id;

        if (expense.id) {
          oldToNewIdMap.set(expense.id, newId);
        }

        // Determinar si este gasto debe copiarse tal cual (pago anual o bonificado con switches activos)
        const isRecurringExpense = (expense.status === 'pago anual' && keepPagoAnual) ||
                                    (expense.status === 'bonificado' && keepBonificado);

        const newExpense: any = {
          userId: user.uid,
          item: expense.item,
          category: expense.category,
          currency: expense.currency,
          pagadoPor: expense.pagadoPor,
          // Copiar icono y su color si existen
          ...(expense.icon && { icon: expense.icon }),
          ...(expense.iconColor && { iconColor: expense.iconColor }),
          // Si es gasto recurrente, copiar tal cual. Si no, resetear a pendiente
          vto: isRecurringExpense ? expense.vto : '',
          fechaPago: isRecurringExpense ? expense.fechaPago : '',
          importe: isRecurringExpense ? expense.importe : 0,
          status: isRecurringExpense ? expense.status : ('pendiente' as const),
          month: targetMonth,
          year: targetYear,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        // Si es gasto recurrente, copiar también comentarios, deuda y attachments
        if (isRecurringExpense) {
          if (expense.comment) {
            newExpense.comment = expense.comment;
          }
          if (expense.debt) {
            newExpense.debt = expense.debt;
          }
          if (expense.attachments && expense.attachments.length > 0) {
            newExpense.attachments = expense.attachments;
          }
        }

        // Si keepCardLinks está activado, mantener asociaciones y datos de TC
        if (keepCardLinks) {
          // Copiar datos de TC si existen
          if (expense.cardTotalARS !== undefined) {
            newExpense.cardTotalARS = expense.cardTotalARS;
          }
          if (expense.cardTotalUSD !== undefined) {
            newExpense.cardTotalUSD = expense.cardTotalUSD;
          }
          if (expense.cardUSDRate !== undefined) {
            newExpense.cardUSDRate = expense.cardUSDRate;
          }
        }

        batch.set(newDocRef, newExpense);
      });

      // Segunda pasada: actualizar linkedToCardId si keepCardLinks está activado
      if (keepCardLinks) {
        sourceExpenses.forEach((expense) => {
          if (expense.linkedToCardId && expense.id) {
            const newExpenseId = oldToNewIdMap.get(expense.id);
            const newCardId = oldToNewIdMap.get(expense.linkedToCardId);

            // Solo actualizar si ambos IDs se mapearon correctamente
            if (newExpenseId && newCardId) {
              const expenseRef = doc(db, 'expenses', newExpenseId);
              batch.update(expenseRef, {
                linkedToCardId: newCardId
              });
            }
          }
        });
      }

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
