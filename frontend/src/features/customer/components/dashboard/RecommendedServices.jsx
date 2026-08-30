import { EmptyState } from '../../../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../../../components/ui/Feedback/Skeleton';
import { ServiceCard } from '../../../services/components/ServiceCard';

export function RecommendedServices({ services = [], isLoading, isError }) {
  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading recommended services">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-72 rounded-2xl" />
        ))}
      </section>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
        <p className="font-semibold text-[var(--sf-text-main)]">Unable to load recommended services right now.</p>
        <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Please refresh the page or try again later.</p>
      </div>
    );
  }

  if (!services.length) {
    return (
      <EmptyState
        title="Recommended services will appear here once services are configured."
        description="SewaFi will show real services from the backend when they are available."
      />
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Recommended services">
      {services.slice(0, 4).map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </section>
  );
}

export default RecommendedServices;
