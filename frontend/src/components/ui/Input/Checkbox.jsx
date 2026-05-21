export function Checkbox({ label, hint, ...props }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 text-sm text-foreground">
      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border text-primary" {...props} />
      <span className="space-y-1">
        <span className="block font-medium">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

export default Checkbox;
