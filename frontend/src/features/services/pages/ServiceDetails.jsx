import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { Container } from '../../../components/ui/Layout/Container';
import { RelatedServices } from '../../../components/services/RelatedServices';
import { ServiceBreadcrumb } from '../../../components/services/ServiceBreadcrumb';
// import { ServiceCommonProblems } from '../../../components/services/ServiceCommonProblems';
import { ServiceDetailHero } from '../../../components/services/ServiceDetailHero';
// import { ServiceFaq } from '../../../components/services/ServiceFaq';
// import { ServiceIncludedSection } from '../../../components/services/ServiceIncludedSection';
import { ServicePriceDuration } from '../../../components/services/ServicePriceDuration';
// import { ServiceSafetyNotes } from '../../../components/services/ServiceSafetyNotes';
import { ServiceSummaryCard } from '../../../components/services/ServiceSummaryCard';
import { ROUTES } from '../../../constants/routes.constant';
import { useRelatedServices, useServiceDetail, useServiceFaqs } from '../../../hooks/useServiceDetail';

function DetailSkeleton() {
  return (
    <Container className="space-y-8 py-10">
      <Skeleton className="h-6 w-80 rounded-full" />
      <div className="grid gap-8 rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="h-14 w-4/5" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <Skeleton className="h-72 rounded-[24px]" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </Container>
  );
}

function ServiceUnavailableState({ title, description, onRetry }) {
  return (
    <Container className="py-12">
      <div className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 shadow-[var(--sf-shadow)]">
        <EmptyState title={title} description={description} />
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {onRetry ? (
            <Button type="button" onClick={onRetry} className="rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
              Retry
            </Button>
          ) : null}
          <Button as={Link} to={ROUTES.services} variant="outline" className="rounded-xl">
            Back to Services
          </Button>
          <Button as={Link} to={ROUTES.home} variant="ghost" className="rounded-xl">
            Go Home
          </Button>
        </div>
      </div>
    </Container>
  );
}

function ServiceDetails() {
  const { id } = useParams();
  const detailQuery = useServiceDetail(id);
  const service = detailQuery.data?.service;
  const relatedQuery = useRelatedServices(service);
  // const faqQuery = useServiceFaqs(service?.id);
  const isNotFound = detailQuery.error?.response?.status === 404;

  if (detailQuery.isLoading) return <DetailSkeleton />;

  if (detailQuery.isError && !isNotFound) {
    return (
      <ServiceUnavailableState
        title="Unable to load this service"
        description="Unable to load this service right now."
        onRetry={() => detailQuery.refetch()}
      />
    );
  }

  if (isNotFound || !service?.id) {
    return (
      <ServiceUnavailableState
        title="Service not found"
        description="The requested service is unavailable or has been removed."
      />
    );
  }

  return (
    <div className="bg-[var(--sf-bg)]">
      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <ServiceBreadcrumb service={service} />
        <ServiceDetailHero service={service} />

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* <ServiceIncludedSection includedItems={service.includedItems} /> */}
            {/* <ServiceCommonProblems commonProblems={service.commonProblems} /> */}
            {/* <ServiceSafetyNotes safetyNotes={service.safetyNotes} /> */}
            {/* <ServiceFaq
              faqs={faqQuery.data || []}
              isLoading={faqQuery.isLoading}
              isError={faqQuery.isError}
              onRetry={() => faqQuery.refetch()}
              /> */}
            <ServicePriceDuration service={service} />
            <RelatedServices
              services={relatedQuery.data || []}
              isLoading={relatedQuery.isLoading}
              isError={relatedQuery.isError}
              onRetry={() => relatedQuery.refetch()}
            />
          </div>

          <ServiceSummaryCard service={service} />
        </div>
      </Container>
    </div>
  );
}

export default ServiceDetails;
