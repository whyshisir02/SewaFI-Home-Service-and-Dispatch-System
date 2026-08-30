import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../../../components/ui/Feedback/EmptyState';
import { Container } from '../../../../components/ui/Layout/Container';
import { SectionHeader } from '../../../../components/common/SectionHeader';
import { SkeletonCard } from '../../../../components/common/SkeletonCard';
import { ServiceCard } from '../../../services/components/ServiceCard';
import { ROUTES } from '../../../../constants/routes.constant';
import { useFeaturedServices } from '../../hooks/useHomePageData';

export function PopularServices() {
  const servicesQuery = useFeaturedServices();
  const services = servicesQuery.data || [];

  return (
    <section className="bg-[var(--sf-bg)] py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeader
          title="Popular Home Services"
          description="Choose a service, submit your request, and let SewaFi dispatch eligible nearby providers."
        />

        <div className="mt-10">
          {servicesQuery.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : null}

          {servicesQuery.isError ? (
            <EmptyState
              title="Unable to load services"
              description="We could not load services right now. Please try again."
              actionLabel="Retry"
              onAction={() => servicesQuery.refetch()}
            />
          ) : null}

          {!servicesQuery.isLoading && !servicesQuery.isError && !services.length ? (
            <EmptyState title="No services available" description="No services are available right now. Please check again later." />
          ) : null}

          {!servicesQuery.isLoading && !servicesQuery.isError && services.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-10 text-center">
          <Link to={ROUTES.services} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sf-secondary)] hover:underline">
            View all services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

export default PopularServices;
