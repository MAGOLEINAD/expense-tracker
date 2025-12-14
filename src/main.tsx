import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register Service Worker for PWA (only in production)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');

      // Optional: force SW to check for updates on each load
      registration.update().catch(() => {});

      // Optional: auto-reload when a new SW takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      // Optional: detect updates (useful if you want to show a toast "Update available")
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // When installed and there's an existing controller => update available
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Acá podrías mostrar un aviso tipo "Hay una actualización, refrescá"
            // Si tu SW hace skipWaiting + clients.claim, el controllerchange recarga solo.
          }
        });
      });
    } catch (err) {
      console.log('SW registration failed:', err);
    }
  });
}
