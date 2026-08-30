import { Input } from '../../../../components/ui/Input/Input';
import { Select } from '../../../../components/ui/Input/Select';
import { Button } from '../../../../components/ui/Button/Button';

const statusOptions = [
  { value: 'ALL', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const topicOptions = [
  { value: 'ALL', label: 'All Topics' },
  { value: 'BOOKING_SUPPORT', label: 'Booking Support' },
  { value: 'PROVIDER_REGISTRATION', label: 'Provider Registration' },
  { value: 'ACCOUNT_HELP', label: 'Account Help' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { value: 'SERVICE_ISSUE', label: 'Service Issue' },
  { value: 'GENERAL_QUESTION', label: 'General Question' },
];

const priorityOptions = [
  { value: 'ALL', label: 'All Priority' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const roleOptions = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'PROVIDER', label: 'Provider' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'GUEST', label: 'Guest' },
];

const dateOptions = [
  { value: 'all_time', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
];

export function SupportFilters({
  values,
  onChange,
  onReset,
  showTopic,
  showPriority,
  showRole,
}) {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Input
          label="Search"
          value={values.search}
          onChange={(event) => onChange('search', event.target.value)}
          placeholder="Search by name, email, subject, ticket code..."
        />
        <Select
          label="Status"
          value={values.status}
          onChange={(event) => onChange('status', event.target.value)}
          options={statusOptions}
        />
        {showTopic ? (
          <Select
            label="Topic"
            value={values.topic}
            onChange={(event) => onChange('topic', event.target.value)}
            options={topicOptions}
          />
        ) : null}
        {showPriority ? (
          <Select
            label="Priority"
            value={values.priority}
            onChange={(event) => onChange('priority', event.target.value)}
            options={priorityOptions}
          />
        ) : null}
        {showRole ? (
          <Select
            label="Role"
            value={values.role}
            onChange={(event) => onChange('role', event.target.value)}
            options={roleOptions}
          />
        ) : null}
        <Select
          label="Date Range"
          value={values.range}
          onChange={(event) => onChange('range', event.target.value)}
          options={dateOptions}
        />
        <Select
          label="Sort"
          value={values.sort}
          onChange={(event) => onChange('sort', event.target.value)}
          options={sortOptions}
        />
      </div>
      <div className="mt-3">
        <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onReset}>
          Clear Filters
        </Button>
      </div>
    </section>
  );
}

export default SupportFilters;

