import { SearchInput } from '../ui/Input/SearchInput';

export function SearchFilterBar({ searchValue, onSearchChange, filters }) {
  return (
    <div className="surface-card flex flex-col gap-4 rounded-[1.75rem] p-4 lg:flex-row lg:items-center">
      <div className="flex-1">
        <SearchInput value={searchValue} onChange={onSearchChange} />
      </div>
      {filters ? <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{filters}</div> : null}
    </div>
  );
}

export default SearchFilterBar;
