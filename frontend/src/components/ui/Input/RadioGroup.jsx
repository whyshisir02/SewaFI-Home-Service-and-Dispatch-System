export function RadioGroup({ label, options = [], value, onChange, name }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-sm"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
            />
            <span>
              <span className="block font-medium text-foreground">{option.label}</span>
              {option.description ? <span className="block text-xs text-muted">{option.description}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default RadioGroup;
