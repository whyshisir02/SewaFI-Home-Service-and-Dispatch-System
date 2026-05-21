import { Search } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder = 'Search services, jobs, users...' }) {
  return (
    <label className="relative flex w-full items-center">
      <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-sm text-foreground placeholder:text-muted"
      />
    </label>
  );
}

export default SearchInput;
