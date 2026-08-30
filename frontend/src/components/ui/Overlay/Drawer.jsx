import { useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

export function Drawer({ open, onClose, title, children, side = 'right' }) {
  const containerRef = useRef(null);
  useFocusTrap({ active: open, containerRef, onClose });

  if (!open) return null;

  const sideClasses =
    side === 'left'
      ? 'left-0 rounded-r-[2rem]'
      : 'right-0 rounded-l-[2rem]';

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/40">
      <button type="button" className="absolute inset-0 z-40" onClick={onClose} aria-label="Close drawer" />
      <aside ref={containerRef} className={`surface-card absolute top-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden p-5 transition-transform duration-200 sm:p-6 ${sideClasses} translate-x-0`}>
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
