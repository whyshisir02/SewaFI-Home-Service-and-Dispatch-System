import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Drawer({ open, onClose, title, children }) {
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
    <div className="fixed inset-0 z-50 bg-slate-950/40">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close drawer" />
      <aside className="surface-card absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-hidden rounded-l-[2rem] p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl text-foreground">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close drawer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 flex-1 overflow-y-auto pr-1">{children}</div>
      </aside>
    </div>
  );
}

export default Drawer;
