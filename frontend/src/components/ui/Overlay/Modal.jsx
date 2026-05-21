import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="surface-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl text-foreground">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
