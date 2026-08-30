import { useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

export function Modal({ open, onClose, title, children }) {
  const containerRef = useRef(null);
  useFocusTrap({ active: open, containerRef, onClose });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div ref={containerRef} className="surface-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] p-6">
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
