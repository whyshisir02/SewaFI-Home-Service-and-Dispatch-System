import { MapPin, Navigation, Route } from 'lucide-react';
import { Container } from '../ui/Layout/Container';
import { EmptyState } from '../ui/Feedback/EmptyState';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { SectionHeader } from '../common/SectionHeader';
import { useCoverageLocations } from '../../hooks/useHomePageData';

export function NepalCoverageSection() {
  const coverageQuery = useCoverageLocations();
  const locations = coverageQuery.data || [];

  return (
    <section className="bg-[var(--sf-surface)] py-12 sm:py-16 lg:py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <SectionHeader
            align="left"
            title="Designed for Local Homes and Local Providers"
            description="SewaFi is built for Nepal-focused home service booking with local addresses, provider areas, and dispatch-ready workflows."
          />

          <div className="mt-8">
            {coverageQuery.isLoading ? (
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 7 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-28 rounded-full" />
                ))}
              </div>
            ) : null}

            {coverageQuery.isError ? (
              <EmptyState
                title="Unable to load service areas"
                description="We could not load configured service areas right now."
                actionLabel="Retry"
                onAction={() => coverageQuery.refetch()}
              />
            ) : null}

            {!coverageQuery.isLoading && !coverageQuery.isError && !locations.length ? <EmptyState title="No service areas listed yet." description="Coverage locations will appear here after setup." /> : null}

            {!coverageQuery.isLoading && !coverageQuery.isError && locations.length ? (
              <div className="flex flex-wrap gap-3">
                {locations.map((city) => (
                  <span
                    key={city.id || city.name}
                    className={
                      city.isActive === false
                        ? 'rounded-full border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-2 text-sm font-semibold text-[var(--sf-text-soft)]'
                        : 'rounded-full border border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)] px-4 py-2 text-sm font-bold text-[var(--sf-secondary)]'
                    }
                  >
                    {city.name}
                    {city.province && city.province !== city.name ? `, ${city.province}` : ''}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-[var(--sf-border)] bg-[linear-gradient(145deg,var(--sf-primary-soft),var(--sf-secondary-soft))] p-6 shadow-[var(--sf-shadow)]">
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(var(--sf-secondary)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative min-h-[360px] rounded-[24px] border border-white/40 bg-[var(--sf-surface)] p-6 backdrop-blur">
            <div className="absolute left-10 top-12 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sf-secondary)] text-white shadow-[var(--sf-shadow)]">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="absolute right-10 top-24 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sf-primary)] text-white shadow-[var(--sf-shadow)]">
              <Navigation className="h-5 w-5" />
            </div>
            <div className="absolute bottom-16 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-[var(--sf-accent)] text-white shadow-[var(--sf-shadow)]">
              <Route className="h-6 w-6" />
            </div>
            <svg className="absolute inset-0 h-full w-full text-[var(--sf-secondary)] opacity-40" viewBox="0 0 520 360" fill="none" aria-hidden="true">
              <path d="M86 88 C 180 48, 245 180, 372 118 S 455 240, 265 286" stroke="currentColor" strokeWidth="4" strokeDasharray="10 12" strokeLinecap="round" />
              <path d="M82 284 C 132 226, 188 244, 230 180 C 276 112, 330 92, 418 70" stroke="currentColor" strokeWidth="2" strokeDasharray="6 10" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
              <p className="font-bold text-[var(--sf-text-main)]">Local dispatch routes</p>
              <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">
                Provider service areas and customer addresses keep matching grounded in real Nepal location data.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default NepalCoverageSection;
