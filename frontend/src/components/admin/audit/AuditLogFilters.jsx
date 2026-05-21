import { Filter } from 'lucide-react';
import { Input } from '../../ui/Input/Input';
import { Button } from '../../ui/Button/Button';

const actionOptions = ['ALL', 'AUTH', 'BOOKING', 'PROVIDER', 'USER', 'PAYMENT', 'SETTINGS', 'SYSTEM'];
const entityOptions = ['ALL', 'USER', 'BOOKING', 'PROVIDER', 'SERVICE', 'CATEGORY', 'PAYMENT', 'SETTINGS'];
const severityOptions = ['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL'];
const actorRoleOptions = ['ALL', 'ADMIN', 'CUSTOMER', 'PROVIDER', 'SYSTEM'];
const rangeOptions = ['all_time', 'today', 'this_week', 'this_month'];
const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const toOptionLabel = (value) =>
  String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
      >
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || toOptionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterGrid({ values, onChange, showSeverity, showEntity, onReset }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_0.9fr_0.8fr_0.8fr_auto]">
      <Input
        label="Search"
        value={values.search}
        onChange={(event) => onChange('search', event.target.value)}
        placeholder="Search by action, actor, booking code, entity, or user..."
      />
      <SelectField label="Action Type" value={values.actionType} options={actionOptions} onChange={(val) => onChange('actionType', val)} />
      {showEntity ? (
        <SelectField label="Entity Type" value={values.entityType} options={entityOptions} onChange={(val) => onChange('entityType', val)} />
      ) : (
        <div />
      )}
      {showSeverity ? (
        <SelectField label="Severity" value={values.severity} options={severityOptions} onChange={(val) => onChange('severity', val)} />
      ) : (
        <div />
      )}
      <SelectField label="Actor Role" value={values.actorRole} options={actorRoleOptions} onChange={(val) => onChange('actorRole', val)} />
      <SelectField
        label="Date Range"
        value={values.range}
        options={rangeOptions.map((item) => ({ value: item, label: toOptionLabel(item) }))}
        onChange={(val) => onChange('range', val)}
      />
      <SelectField label="Sort" value={values.sort} options={sortOptions} onChange={(val) => onChange('sort', val)} />
      <div className="flex items-end">
        <Button type="button" variant="outline" className="h-11 w-full rounded-xl" onClick={onReset}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export function AuditLogFilters({ values, onChange, showSeverity, showEntity, onReset }) {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
      <div className="hidden lg:block">
        <FilterGrid values={values} onChange={onChange} showSeverity={showSeverity} showEntity={showEntity} onReset={onReset} />
      </div>

      <details className="lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-3 text-sm font-semibold text-[var(--sf-text-main)]">
          <Filter className="h-4 w-4" />
          Filters
        </summary>
        <div className="mt-3">
          <FilterGrid values={values} onChange={onChange} showSeverity={showSeverity} showEntity={showEntity} onReset={onReset} />
        </div>
      </details>
    </section>
  );
}

export default AuditLogFilters;

