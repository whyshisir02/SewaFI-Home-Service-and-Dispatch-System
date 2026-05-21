import { useRef, useState } from 'react';
import { useClickOutside } from '../../../hooks/useClickOutside';

export function Popover({ trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative inline-flex" ref={ref}>
      <button type="button" onClick={() => setOpen((prev) => !prev)}>
        {trigger}
      </button>
      {open ? <div className="surface-card absolute left-0 top-full z-30 mt-2 rounded-2xl p-4">{children}</div> : null}
    </div>
  );
}

export default Popover;
