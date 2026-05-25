import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { BookingCard } from '../../booking/components/BookingCard';
import { NearbyJobCard } from '../components/NearbyJobCard';
import { useProviderJobs } from '../hooks/useProviderJobs';

function ProviderJobs() {
  const { availableJobsQuery, myJobsQuery, acceptJobMutation } = useProviderJobs();
  const availableJobs = Array.isArray(availableJobsQuery.data?.items)
    ? availableJobsQuery.data.items
    : Array.isArray(availableJobsQuery.data)
      ? availableJobsQuery.data
      : [];
  const assignedJobs = Array.isArray(myJobsQuery.data?.items)
    ? myJobsQuery.data.items
    : Array.isArray(myJobsQuery.data)
      ? myJobsQuery.data
      : [];

  return (
    <Container className="space-y-8">
      <PageHeader eyebrow="Jobs" title="Nearby requests and accepted work" description="Review new dispatch opportunities, then manage accepted and in-progress jobs." />
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-foreground">Nearby requests</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {availableJobs.map((booking) => (
            <NearbyJobCard key={booking.id} booking={booking} onAccept={(id) => acceptJobMutation.mutate(id)} loading={acceptJobMutation.isPending} />
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-foreground">Accepted jobs</h2>
        <div className="space-y-4">
          {assignedJobs.map((booking) => (
            <BookingCard key={booking.id} booking={booking} detailPath={`/provider/jobs/${booking.id}`} />
          ))}
        </div>
      </section>
    </Container>
  );
}

export default ProviderJobs;
