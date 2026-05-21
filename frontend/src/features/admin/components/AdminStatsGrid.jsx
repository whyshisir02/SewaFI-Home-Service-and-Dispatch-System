import { Activity, CreditCard, ShieldCheck, Star, Users } from 'lucide-react';
import { Grid } from '../../../components/ui/Layout/Grid';
import { StatCard } from '../../../components/common/StatCard';
import { formatCurrency } from '../../../utils/formatCurrency';

export function AdminStatsGrid({ stats }) {
  return (
    <Grid className="md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total users" value={stats?.users?.total || 0} icon={Users} />
      <StatCard label="Pending providers" value={stats?.users?.pendingProviders || 0} icon={ShieldCheck} />
      <StatCard label="Completed bookings" value={stats?.bookings?.completed || 0} icon={Activity} />
      <StatCard label="Revenue" value={formatCurrency(stats?.revenue?.total || 0)} icon={CreditCard} helper={`${stats?.reviews?.averageRating || 0} avg rating`} />
    </Grid>
  );
}

export default AdminStatsGrid;
