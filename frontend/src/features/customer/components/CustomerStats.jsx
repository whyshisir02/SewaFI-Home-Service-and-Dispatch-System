import { CalendarRange, CreditCard, FolderClock, Wrench } from 'lucide-react';
import { Grid } from '../../../components/ui/Layout/Grid';
import { StatCard } from '../../../components/common/StatCard';
import { formatCurrency } from '../../../utils/formatCurrency';

export function CustomerStats({ summary }) {
  const spending = summary?.spending?.thisMonth?.amount || 0;
  const active = summary?.bookings?.active || 0;
  const completed = summary?.bookings?.completed || 0;

  return (
    <Grid className="md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Monthly spend" value={formatCurrency(spending)} icon={CreditCard} />
      <StatCard label="Active bookings" value={active} icon={FolderClock} />
      <StatCard label="Completed bookings" value={completed} icon={CalendarRange} />
      <StatCard label="Recommended services" value="12+" icon={Wrench} />
    </Grid>
  );
}

export default CustomerStats;
