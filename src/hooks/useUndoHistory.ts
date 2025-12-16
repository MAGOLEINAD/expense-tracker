import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';

interface UndoHistoryItem<T> {
  item: T;
  previousValue: any;
  field: string;
  timestamp: number;
}

interface UseUndoHistoryOptions<T> {
  maxHistorySize?: number;
  enableShortcut?: boolean;
  isEditing?: boolean;
  onUndo?: (restoredItem: T, field: string) => void;
}

/**
 * Hook personalizado para manejar un historial de cambios con funcionalidad de deshacer (Ctrl+Z)
 *
 * @param maxHistorySize - Número máximo de cambios a guardar en el historial (por defecto: 20)
 * @param enableShortcut - Si se debe habilitar el atajo Ctrl+Z (por defecto: true)
 * @param isEditing - Si actualmente se está editando (bloquea el undo mientras se edita)
 * @param onUndo - Callback que se ejecuta cuando se deshace un cambio
 * @returns { addToHistory, undo, canUndo, clearHistory }
 */
export function useUndoHistory<T extends { id?: string }>(
  options: UseUndoHistoryOptions<T> = {}
) {
  const {
    maxHistorySize = 20,
    enableShortcut = true,
    isEditing = false,
    onUndo,
  } = options;

  const { enqueueSnackbar } = useSnackbar();
  const [history, setHistory] = useState<UndoHistoryItem<T>[]>([]);

  /**
   * Agregar un cambio al historial
   */
  const addToHistory = useCallback((item: T, field: string, previousValue: any) => {
    setHistory(prev => {
      const newHistory = [
        ...prev,
        {
          item,
          previousValue,
          field,
          timestamp: Date.now(),
        },
      ];

      // Limitar el tamaño del historial
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(newHistory.length - maxHistorySize);
      }

      return newHistory;
    });
  }, [maxHistorySize]);

  /**
   * Deshacer el último cambio
   * @returns El item restaurado con su valor anterior, o undefined si no hay cambios
   */
  const undo = useCallback((): { restoredItem: T; field: string } | undefined => {
    if (history.length === 0) {
      enqueueSnackbar('No hay cambios para deshacer', { variant: 'info', autoHideDuration: 2000 });
      return undefined;
    }

    // Obtener el último cambio
    const lastEdit = history[history.length - 1];
    const { item, previousValue, field } = lastEdit;

    // Restaurar el valor anterior
    const restoredItem = {
      ...item,
      [field]: previousValue,
    } as T;

    // Eliminar del historial
    setHistory(prev => prev.slice(0, -1));

    // Ejecutar callback si está definido
    if (onUndo) {
      onUndo(restoredItem, field);
    }

    // Mostrar notificación
    enqueueSnackbar(`Cambio deshecho en campo "${field}"`, {
      variant: 'success',
      autoHideDuration: 2000,
    });

    return { restoredItem, field };
  }, [history, enqueueSnackbar, onUndo]);

  /**
   * Verificar si hay cambios para deshacer
   */
  const canUndo = history.length > 0;

  /**
   * Limpiar todo el historial
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  /**
   * Escuchar el atajo de teclado Ctrl+Z
   */
  useEffect(() => {
    if (!enableShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z o Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        // Solo deshacer si NO estamos editando actualmente
        if (!isEditing && canUndo) {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcut, isEditing, canUndo, undo]);

  return {
    addToHistory,
    undo,
    canUndo,
    clearHistory,
    historySize: history.length,
  };
}
