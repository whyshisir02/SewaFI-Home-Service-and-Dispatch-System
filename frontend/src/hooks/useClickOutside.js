import { useEffect } from 'react';

export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const onClick = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [handler, ref]);
};
