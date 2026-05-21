import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/errors/AppErrorBoundary';
import { AppProviders } from './providers/AppProviders';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/globals.css';
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </AppProviders>
  </React.StrictMode>
);
