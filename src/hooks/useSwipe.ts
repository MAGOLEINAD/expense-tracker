import { useRef, useEffect, type RefObject } from 'react';

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  minSwipeDistance?: number;
  preventScroll?: boolean;
}

/**
 * Hook para detectar gestos de swipe en un elemento
 * @param callbacks - Funciones a ejecutar para cada dirección de swipe
 * @param config - Configuración del swipe (distancia mínima, etc.)
 * @returns RefObject para asignar al elemento donde detectar swipes
 */
export const useSwipe = <T extends HTMLElement = HTMLDivElement>(
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
): RefObject<T | null> => {
  const {
    minSwipeDistance = 50,
    preventScroll = false,
  } = config;

  const elementRef = useRef<T>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;

      // Prevenir scroll si se está haciendo swipe horizontal
      if (preventScroll) {
        const deltaX = Math.abs(touchEndX.current - touchStartX.current);
        const deltaY = Math.abs(touchEndY.current - touchStartY.current);

        // Si el movimiento es más horizontal que vertical, prevenir scroll
        if (deltaX > deltaY) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      const deltaX = touchStartX.current - touchEndX.current;
      const deltaY = touchStartY.current - touchEndY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determinar si es un swipe horizontal (más movimiento en X que en Y)
      const isHorizontalSwipe = absDeltaX > absDeltaY;

      if (isHorizontalSwipe && absDeltaX > minSwipeDistance) {
        if (deltaX > 0) {
          // Swipe hacia la izquierda
          callbacks.onSwipeLeft?.();
        } else {
          // Swipe hacia la derecha
          callbacks.onSwipeRight?.();
        }
      } else if (!isHorizontalSwipe && absDeltaY > minSwipeDistance) {
        if (deltaY > 0) {
          // Swipe hacia arriba
          callbacks.onSwipeUp?.();
        } else {
          // Swipe hacia abajo
          callbacks.onSwipeDown?.();
        }
      }

      // Reset
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchEndX.current = 0;
      touchEndY.current = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [callbacks, minSwipeDistance, preventScroll]);

  return elementRef;
};
