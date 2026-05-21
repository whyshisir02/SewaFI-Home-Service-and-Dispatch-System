import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Wrench,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatDate } from '../../../utils/formatDate';
import { getErrorMessage } from '../../../utils/errorHandler';
import { appToast } from '../../../lib/toast';
import { ROUTES } from '../../../constants/routes.constant';
import {
  getProviderProfile,
  parseAvailability,
} from '../../../components/provider/providerDashboardUtils';
import { useProviderAvailabilityPage } from '../hooks/useProviderAvailabilityPage';

const getServiceCategoryName = (providerProfile, categories) => {
  const categoryId = providerProfile?.serviceCategoryId || providerProfile?.categoryId;
  const providerLabel = providerProfile?.serviceCategory?.name || providerProfile?.serviceCategoryName;
  if (providerLabel) return providerLabel;
  if (!categoryId) return null;
  const match = (Array.isArray(categories) ? categories : []).find(
    (item) => String(item?.id) === String(categoryId)
  );
  return match?.name || null;
};

const DAY_LABELS = {
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
};

const DAY_ORDER = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const formatTime12h = (value) => {
  const raw = String(value || '').trim();
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(raw)) return '--:--';
  const [hour, minute] = raw.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
};

const formatWorkingDaysSummary = (workingDays) => {
  if (!Array.isArray(workingDays) || !workingDays.length) {
    return 'Sunday to Friday';
  }

  const normalized = Array.from(
    new Set(workingDays.map((day) => String(day || '').trim().toUpperCase()).filter(Boolean))
  );

  const ordered = DAY_ORDER.filter((day) => normalized.includes(day));

  if (!ordered.length) {
    return 'Sunday to Friday';
  }

  return ordered.map((day) => DAY_LABELS[day] || day).join(', ');
};

function ProviderAvailabilityPage() {
  const {
    profileQuery,
    categoriesQuery,
    provincesQuery,
    districtsQuery,
    municipalitiesQuery,
    updateAvailabilityMutation,
  } = useProviderAvailabilityPage({});

  const providerProfile = getProviderProfile(profileQuery.data);
  const providerStatus = providerProfile?.status || 'PENDING_APPROVAL';
  const approved = providerStatus === 'APPROVED';
  const availability = parseAvailability(providerProfile?.availability);
  const isAvailable = availability?.availableToday !== false;
  const categoryName = getServiceCategoryName(providerProfile, categoriesQuery.data);

  const rawWorkingAreas =
    providerProfile?.serviceAreas ||
    providerProfile?.workingAreas ||
    providerProfile?.areas ||
    providerProfile?.locations;
  const workingAreas = Array.isArray(rawWorkingAreas)
    ? rawWorkingAreas
    : rawWorkingAreas && typeof rawWorkingAreas === 'object'
      ? [rawWorkingAreas]
      : [];

  const onToggleAvailability = async () => {
    if (!approved || updateAvailabilityMutation.isPending) return;
    try {
      await updateAvailabilityMutation.mutateAsync({ available: !isAvailable });
      appToast.success(!isAvailable ? 'Availability turned on.' : 'Availability turned off.');
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to update availability right now.'));
    }
  };

  const onRefresh = () => {
    profileQuery.refetch();
    categoriesQuery.refetch();
    provincesQuery.refetch();
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Provider Settings"
        title="Availability"
        description="Control when and where you are available to receive nearby service requests."
        actions={
          <>
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button as={Link} to={ROUTES.provider.nearbyJobs} variant="outline" className="h-11 rounded-xl">
              Nearby Jobs
            </Button>
          </>
        }
      />

      {profileQuery.isLoading ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {profileQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load availability settings right now.</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onRefresh}>
              Retry
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </section>
      ) : null}

      {!profileQuery.isLoading && !profileQuery.isError ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[var(--sf-secondary)]" />
                <h2 className="text-lg font-bold text-[var(--sf-text-main)]">Current availability status</h2>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-[var(--sf-text-muted)]">
                <p>
                  <span className="font-semibold text-[var(--sf-text-main)]">Status:</span>{' '}
                  <StatusBadge status={isAvailable ? 'APPROVED' : 'SUSPENDED'} className="ml-2" />
                  <span className="ml-2">{isAvailable ? 'Available' : 'Unavailable'}</span>
                </p>
                <p>
                  <span className="font-semibold text-[var(--sf-text-main)]">Profile:</span>{' '}
                  <StatusBadge status={providerStatus} className="ml-2" />
                </p>
                {categoryName ? (
                  <p>
                    <span className="font-semibold text-[var(--sf-text-main)]">Service category:</span> {categoryName}
                  </p>
                ) : null}
                <p>
                  <span className="font-semibold text-[var(--sf-text-main)]">Working areas:</span> {workingAreas.length || 0}
                </p>
                {providerProfile?.updatedAt ? (
                  <p>
                    <span className="font-semibold text-[var(--sf-text-main)]">Last updated:</span>{' '}
                    {formatDate(providerProfile.updatedAt, { includeTime: true })}
                  </p>
                ) : null}
              </div>
            </article>

            <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <h2 className="text-lg font-bold text-[var(--sf-text-main)]">Receive Nearby Jobs</h2>
              <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
                Turn availability on when you are ready to receive service requests that match your service type and working area.
              </p>
              <Button
                type="button"
                className={`mt-5 h-12 w-full rounded-xl ${isAvailable ? 'bg-[var(--sf-secondary)] text-white hover:bg-[var(--sf-secondary)]/90' : ''}`}
                variant={isAvailable ? 'secondary' : 'outline'}
                onClick={onToggleAvailability}
                loading={updateAvailabilityMutation.isPending}
                disabled={!approved || updateAvailabilityMutation.isPending}
                aria-label="Toggle provider availability"
              >
                {isAvailable ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                {isAvailable ? 'Available' : 'Unavailable'}
              </Button>
              {!approved ? (
                <p className="mt-3 text-sm text-[var(--sf-text-muted)]">
                  Your provider profile must be approved before you can receive jobs or manage active availability.
                </p>
              ) : null}
            </article>
          </section>

          {!approved ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <p className="font-semibold text-[var(--sf-text-main)]">
                Your provider profile must be approved before you can receive jobs or manage active availability.
              </p>
              <Button as={Link} to={ROUTES.provider.profile} variant="outline" className="mt-4 rounded-xl">
                View Profile
              </Button>
            </section>
          ) : null}

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[var(--sf-primary)]" />
                <h3 className="text-base font-bold text-[var(--sf-text-main)]">Working schedule</h3>
              </div>
              <div className="mt-3 space-y-2 text-sm text-[var(--sf-text-muted)]">
                <p>
                  <span className="font-semibold text-[var(--sf-text-main)]">Working days:</span>{' '}
                  {formatWorkingDaysSummary(availability?.workingDays)}
                </p>
                <p>
                  <span className="font-semibold text-[var(--sf-text-main)]">Time:</span>{' '}
                  {`${formatTime12h(availability?.startTime || '09:00')} - ${formatTime12h(
                    availability?.endTime || '18:00'
                  )}`}
                </p>
              </div>
              <Button as={Link} to={ROUTES.provider.schedule} variant="outline" className="mt-4 rounded-xl">
                Manage Schedule
              </Button>
            </article>

            <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[var(--sf-primary)]" />
                <h3 className="text-base font-bold text-[var(--sf-text-main)]">Working areas / service locations</h3>
              </div>
              {workingAreas.length ? (
                <div className="mt-3 space-y-2 text-sm text-[var(--sf-text-muted)]">
                  {workingAreas.map((area, index) => (
                    <div key={`${area?.id || area?.municipality || index}`} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
                      <p>
                        {[area?.municipality || 'Whole district', area?.district, area?.province]
                          .filter(Boolean)
                          .join(', ') || area?.label || 'Configured area'}
                      </p>
                      {area?.ward ? <p className="text-xs">Ward: {area.ward}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--sf-text-muted)]">No working areas configured yet.</p>
              )}
              <Button as={Link} to={ROUTES.provider.schedule} variant="outline" className="mt-4 rounded-xl">
                Manage Coverage Areas
              </Button>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[var(--sf-primary)]" />
                <h3 className="text-base font-bold text-[var(--sf-text-main)]">Service category / skills summary</h3>
              </div>
              {categoryName ? (
                <p className="mt-3 text-sm text-[var(--sf-text-muted)]">
                  Current service category: <span className="font-semibold text-[var(--sf-text-main)]">{categoryName}</span>
                </p>
              ) : (
                <p className="mt-3 text-sm text-[var(--sf-text-muted)]">No service category assigned yet.</p>
              )}
              <p className="mt-2 text-xs text-[var(--sf-text-muted)]">
                Contact support or admin to change your service category.
              </p>
            </article>

            <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[var(--sf-secondary)]" />
                <h3 className="text-base font-bold text-[var(--sf-text-main)]">How availability affects dispatch</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-[var(--sf-text-muted)]">
                <li>Provider profile approved</li>
                <li>Availability turned on</li>
                <li>Matching service category</li>
                <li>Working area configured</li>
                <li>Booking available in your dispatch area</li>
              </ul>
            </article>
          </section>

          <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <p className="text-sm text-[var(--sf-text-muted)]">
              Location datasets are loaded from backend:
              {' '}
              provinces {provincesQuery.data?.length || 0},
              {' '}
              districts {districtsQuery.data?.length || 0},
              {' '}
              municipalities {municipalitiesQuery.data?.length || 0}.
            </p>
          </section>
        </>
      ) : null}
    </Container>
  );
}

export default ProviderAvailabilityPage;
