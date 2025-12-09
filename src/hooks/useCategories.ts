import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserCategory } from '@/types';

export const useCategories = (userId: string | undefined) => {
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'categories'),
      where('userId', '==', userId),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const categoriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as UserCategory[];

        // Si no hay categorías, crear las 3 por defecto
        if (categoriesData.length === 0) {
          await initializeDefaultCategories(userId);
        } else {
          setCategories(categoriesData);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching categories:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const initializeDefaultCategories = async (uid: string) => {
    try {
      const defaultCategories = [
        { name: 'Categoría 1', order: 1 },
        { name: 'Categoría 2', order: 2 },
        { name: 'Categoría 3', order: 3 },
      ];

      for (const category of defaultCategories) {
        await addDoc(collection(db, 'categories'), {
          userId: uid,
          name: category.name,
          order: category.order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('Error initializing categories:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const addCategory = async (name: string) => {
    if (!userId) return;

    try {
      const newOrder = categories.length + 1;
      await addDoc(collection(db, 'categories'), {
        userId,
        name,
        order: newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  };

  const updateCategory = async (categoryId: string, newName: string) => {
    if (!userId) return;

    try {
      const categoryRef = doc(db, 'categories', categoryId);
      await updateDoc(categoryRef, {
        name: newName,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  };

  const updateCategoryColors = async (categoryId: string, colorFrom: string, colorTo: string) => {
    if (!userId) return;

    try {
      const categoryRef = doc(db, 'categories', categoryId);
      await updateDoc(categoryRef, {
        userId, // Asegurar que userId esté presente
        colorFrom,
        colorTo,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating category colors:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  };

  const updateCategoryIcon = async (categoryId: string, icon: string | null) => {
    if (!userId) return;

    try {
      const categoryRef = doc(db, 'categories', categoryId);
      const updateData: any = {
        userId, // Asegurar que userId esté presente
        updatedAt: serverTimestamp(),
      };

      if (icon) {
        updateData.icon = icon;
      } else {
        // Si icon es null, eliminamos el campo
        updateData.icon = null;
      }

      await updateDoc(categoryRef, updateData);
    } catch (err) {
      console.error('Error updating category icon:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  };

  const deleteCategory = async (categoryId: string, cascadeDelete = false) => {
    if (!userId) return;

    try {
      // Buscar gastos usando esta categoría
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        where('category', '==', categoryId)
      );
      const expensesSnapshot = await getDocs(expensesQuery);

      if (!expensesSnapshot.empty && !cascadeDelete) {
        throw new Error(
          `Esta categoría tiene ${expensesSnapshot.size} gasto(s) asociado(s). ¿Deseas eliminar la categoría y todos sus gastos?`
        );
      }

      // Si cascadeDelete es true, eliminar todos los gastos asociados
      if (cascadeDelete && !expensesSnapshot.empty) {
        const deletePromises = expensesSnapshot.docs.map(expenseDoc =>
          deleteDoc(doc(db, 'expenses', expenseDoc.id))
        );
        await Promise.all(deletePromises);
      }

      // Eliminar la categoría
      const categoryRef = doc(db, 'categories', categoryId);
      await deleteDoc(categoryRef);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  };

  const findOrphanedExpenses = async () => {
    if (!userId) return [];

    try {
      // Obtener todos los gastos del usuario
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', userId)
      );
      const expensesSnapshot = await getDocs(expensesQuery);

      // Crear un Set con los IDs de categorías existentes
      const validCategoryIds = new Set(categories.map(cat => cat.id).filter(Boolean));

      // Encontrar gastos con categorías que no existen
      const orphanedExpenses = expensesSnapshot.docs
        .filter(expenseDoc => {
          const categoryId = expenseDoc.data().category;
          return categoryId && !validCategoryIds.has(categoryId);
        })
        .map(expenseDoc => ({
          id: expenseDoc.id,
          ...expenseDoc.data(),
        }));

      return orphanedExpenses;
    } catch (err) {
      console.error('Error finding orphaned expenses:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return [];
    }
  };

  const cleanupOrphanedExpenses = async () => {
    if (!userId) return 0;

    try {
      const orphaned = await findOrphanedExpenses();

      if (orphaned.length === 0) return 0;

      // Eliminar todos los gastos huérfanos
      const deletePromises = orphaned.map(expense =>
        deleteDoc(doc(db, 'expenses', expense.id as string))
      );
      await Promise.all(deletePromises);

      return orphaned.length;
    } catch (err) {
      console.error('Error cleaning up orphaned expenses:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  };

  const toggleIncludeInTotals = async (categoryId: string, includeInTotals: boolean) => {
    if (!userId) return;

    try {
      const categoryRef = doc(db, 'categories', categoryId);
      await updateDoc(categoryRef, {
        includeInTotals,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating includeInTotals:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    updateCategoryColors,
    updateCategoryIcon,
    deleteCategory,
    findOrphanedExpenses,
    cleanupOrphanedExpenses,
    toggleIncludeInTotals,
  };
};
