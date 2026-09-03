import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope:'/' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) window.dispatchEvent(new CustomEvent('caresync-pwa-update', { detail:registration }));
        });
      });
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) { refreshing = true; location.reload(); }
      });
    } catch (error) {
      console.error('CareSync service worker registration failed:', error);
    }
  });
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
