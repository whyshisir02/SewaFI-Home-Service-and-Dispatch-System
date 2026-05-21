import { SearchFilterBar } from '../../../components/common/SearchFilterBar';
import { Select } from '../../../components/ui/Input/Select';

export function AdminFilters({ searchValue, onSearchChange, items = [] }) {
  return (
    <SearchFilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      filters={items.map((item) => (
        <Select
          key={item.label}
          label={item.label}
          value={item.value}
          onChange={(event) => item.onChange(event.target.value)}
          options={item.options}
        />
      ))}
    />
  );
}

export default AdminFilters;
