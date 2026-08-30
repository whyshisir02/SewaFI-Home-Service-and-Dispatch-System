import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProviders } from './providers/AppProviders';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/globals.css';
import './styles/animations.css';

// Global safety net for async errors that escape React's error boundary
// (e.g. fire-and-forget promises, socket handlers, timers).
if (import.meta.env.PROD) {
  window.addEventListener('unhandledrejection', (event) => {
    // Keep the default console output for debugging, but mark it clearly.
    console.error('[Unhandled Promise Rejection]', event.reason);
    // Prevent the browser's default crash overlay in production.
    event.preventDefault();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
