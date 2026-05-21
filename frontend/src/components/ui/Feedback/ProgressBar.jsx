export function ProgressBar({ value = 0 }) {
  return (
    <div className="h-2 w-full rounded-full bg-surface-muted">
      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}

export default ProgressBar;
