import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Container } from '../../../components/ui/Layout/Container';
import { Button } from '../../../components/ui/Button/Button';
import { getErrorMessage } from '../../../utils/errorHandler';
import { ROUTES } from '../../../constants/routes.constant';
import ProviderAboutSection from '../../../components/providers/ProviderAboutSection';
import ProviderBookingCTA from '../../../components/providers/ProviderBookingCTA';
import ProviderProfileHero from '../../../components/providers/ProviderProfileHero';
import ProviderReviewsSection from '../../../components/providers/ProviderReviewsSection';
import ProviderServicesSection from '../../../components/providers/ProviderServicesSection';
import ProviderTrustStats from '../../../components/providers/ProviderTrustStats';
import ProviderWorkingArea from '../../../components/providers/ProviderWorkingArea';
import { useProviderPublicProfile, useProviderPublicReviews } from '../../provider/hooks/useProviderPublicProfile';

function LoadingState() {
  return (
    <Container className="space-y-6 py-8 sm:py-10">
      <div className="h-24 animate-pulse rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-52 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          <div className="h-44 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
        </div>
      </div>
    </Container>
  );
}

function StateCard({ title, description, onRetry }) {
  return (
    <Container className="py-10">
      <div className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--sf-text-main)]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{description}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <Button type="button" onClick={onRetry} variant="outline" className="rounded-xl">
              Retry
            </Button>
          ) : null}
          <Button as={Link} to={ROUTES.services} className="rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
            Back to Services
          </Button>
        </div>
      </div>
    </Container>
  );
}

function ProviderDetailPage() {
  const { id } = useParams();
  const profileQuery = useProviderPublicProfile(id);
  const reviewsQuery = useProviderPublicReviews(id);
  const provider = profileQuery.data;

  const profileUnsupported = profileQuery.error?.code === 'PROVIDER_PROFILE_ENDPOINT_UNAVAILABLE';
  const isNotFound = profileQuery.error?.status === 404 || profileQuery.error?.response?.status === 404;
  const reviewsUnsupported = reviewsQuery.error?.code === 'REVIEW_ENDPOINT_UNAVAILABLE';

  if (profileQuery.isLoading) return <LoadingState />;

  if (profileUnsupported) {
    return (
      <StateCard
        title="Provider profile is currently unavailable."
        description="This provider profile cannot be viewed right now. Please try again later."
      />
    );
  }

  if (isNotFound || !provider) {
    return (
      <StateCard
        title="Provider not found."
        description="This provider profile is not available right now."
      />
    );
  }

  if (profileQuery.isError) {
    return (
      <StateCard
        title="Unable to load provider profile right now."
        description={getErrorMessage(profileQuery.error, 'Unable to load provider profile right now.')}
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  return (
    <div className="bg-[var(--sf-bg)] text-[var(--sf-text-main)]">
      <Container className="space-y-6 py-8 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button as={Link} to={ROUTES.services} variant="ghost" className="mb-3 rounded-xl">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Services
            </Button>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-secondary)]">Provider Profile</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">Provider Profile</h1>
            <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
              View provider details, service category, experience, and customer feedback when available.
            </p>
          </div>
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => profileQuery.refetch()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </header>

        <ProviderProfileHero provider={provider} />

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <ProviderServicesSection provider={provider} />
            <ProviderWorkingArea provider={provider} />
            <ProviderAboutSection provider={provider} />
            <ProviderReviewsSection
              reviews={reviewsQuery.data || []}
              isLoading={reviewsQuery.isLoading}
              isError={reviewsQuery.isError && !reviewsUnsupported}
              error={reviewsQuery.error}
              onRetry={() => reviewsQuery.refetch()}
              unsupported={reviewsUnsupported}
            />
          </div>

          <div className="space-y-4">
            <ProviderTrustStats provider={provider} />
            <ProviderBookingCTA provider={provider} />
          </div>
        </div>
      </Container>
    </div>
  );
}

export default ProviderDetailPage;
