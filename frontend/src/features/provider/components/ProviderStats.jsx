import { CalendarDays, CreditCard, Star, TimerReset } from 'lucide-react';
import { Grid } from '../../../components/ui/Layout/Grid';
import { StatCard } from '../../../components/common/StatCard';
import { formatCurrency } from '../../../utils/formatCurrency';

export function ProviderStats({ summary }) {
  return (
    <Grid className="md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Today's earnings" value={formatCurrency(summary?.earnings?.today?.amount || 0)} icon={CreditCard} />
      <StatCard label="Monthly earnings" value={formatCurrency(summary?.earnings?.thisMonth?.amount || 0)} icon={CalendarDays} />
      <StatCard label="Average rating" value={summary?.profile?.averageRating || '0.0'} icon={Star} />
      <StatCard label="Total jobs" value={summary?.profile?.totalJobs || 0} icon={TimerReset} />
    </Grid>
  );
}

export default ProviderStats;
