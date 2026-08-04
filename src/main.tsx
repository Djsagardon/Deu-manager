import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Catch and prevent crashes from browser/iframe IndexedDB "Database is closing/hidden" errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (
      reason.includes('Database is closing') ||
      reason.includes('Database is hidden') ||
      reason.includes('IndexedDB') ||
      reason.includes('indexedDB')
    ) {
      console.warn('Handled browser database closing/hidden note:', reason);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || String(event.error || '');
    if (
      msg.includes('Database is closing') ||
      msg.includes('Database is hidden') ||
      msg.includes('IndexedDB') ||
      msg.includes('indexedDB')
    ) {
      console.warn('Handled browser database error:', msg);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
