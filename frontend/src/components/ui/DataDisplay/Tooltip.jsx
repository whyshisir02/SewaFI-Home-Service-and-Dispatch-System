export function Tooltip({ content, children }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 rounded-xl bg-slate-950 px-3 py-2 text-xs text-white group-hover:block group-focus-within:block">
        {content}
      </span>
    </span>
  );
}

export default Tooltip;
