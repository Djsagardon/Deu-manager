import { StrictMode, Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
            <span className="text-emerald-400 font-bold text-2xl">DM</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Due Manager Application</h1>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            Something went wrong while initializing the workspace. Please reload to restore your session.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

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
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
