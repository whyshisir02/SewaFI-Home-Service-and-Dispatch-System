import { useRef, useState } from 'react';
import { useClickOutside } from '../../../hooks/useClickOutside';

export function Dropdown({ trigger, items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((prev) => !prev)}>
        {trigger}
      </button>
      {open ? (
        <div className="surface-card absolute right-0 z-30 mt-2 min-w-[12rem] rounded-2xl p-2">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick?.();
                setOpen(false);
              }}
              className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default Dropdown;
