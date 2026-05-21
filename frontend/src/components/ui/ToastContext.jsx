/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

let idCounter = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = idCounter++;
    setToasts((t) => [{ id, ...toast }, ...t].slice(0, 5));
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div aria-live="polite" style={{ position: 'fixed', top: 72, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onClose }) {
  const { id, title, message, type = 'info', duration = 3500 } = toast;

  useEffect(() => {
    const tm = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(tm);
  }, [id, duration, onClose]);

  const bg = type === 'success' ? 'var(--card2)' : type === 'error' ? 'rgba(239,68,68,0.08)' : 'var(--card2)';
  const border = type === 'success' ? '1px solid var(--border2)' : '1px solid var(--border)';

  return (
    <div style={{ minWidth: 280, maxWidth: 360, background: bg, border, borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start', boxShadow: 'var(--shadow)', pointerEvents: 'auto' }}>
      <div style={{ fontSize: 16 }}>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</div>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>}
        {message && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{message}</div>}
      </div>
      <button onClick={onClose} aria-label="dismiss" style={{ background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>✕</button>
    </div>
  );
}

export default ToastContext;
