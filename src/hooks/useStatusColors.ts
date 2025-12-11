import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { PaymentStatus } from '@/types';
import { STATUS_COLORS } from '@/utils/constants';

export const useStatusColors = () => {
  const { user } = useAuth();
  const [colors, setColors] = useState<Record<PaymentStatus, string>>(STATUS_COLORS);
  const [loading, setLoading] = useState(true);

  // Cargar colores personalizados del usuario con listener en tiempo real
  useEffect(() => {
    if (!user) {
      setColors(STATUS_COLORS);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'userSettings', user.uid);

    // Listener en tiempo real para cambios en los colores
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().statusColors) {
          setColors(docSnap.data().statusColors);
        } else {
          setColors(STATUS_COLORS);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading status colors:', error);
        setColors(STATUS_COLORS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Guardar colores personalizados
  const saveColors = async (newColors: Record<PaymentStatus, string>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const docRef = doc(db, 'userSettings', user.uid);
      await setDoc(
        docRef,
        {
          statusColors: newColors,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      // No necesitamos setColors aquí - el listener onSnapshot lo hará automáticamente
    } catch (error) {
      console.error('Error saving status colors:', error);
      throw error;
    }
  };

  // Obtener color para un estado específico (retorna objeto con bgcolor y color)
  const getStatusColor = (status: PaymentStatus): { bgcolor: string; color: string } => {
    return {
      bgcolor: colors[status] || STATUS_COLORS[status],
      color: 'white',
    };
  };

  return {
    colors,
    loading,
    saveColors,
    getStatusColor,
  };
};
