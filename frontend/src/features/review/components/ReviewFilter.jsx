import { Tabs } from '../../../components/ui/Navigation/Tabs';

export function ReviewFilter({ value, onChange }) {
  return (
    <Tabs
      active={value}
      onChange={onChange}
      items={[
        { label: 'Recent', value: 'recent' },
        { label: 'Top rated', value: 'top' },
      ]}
    />
  );
}

export default ReviewFilter;
