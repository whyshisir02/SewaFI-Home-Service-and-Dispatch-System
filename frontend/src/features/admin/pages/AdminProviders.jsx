import { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, RefreshCw, ShieldCheck, UserCheck, UserX, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { ConfirmDialog } from '../../../components/ui/Overlay/ConfirmDialog';
import { Modal } from '../../../components/ui/Overlay/Modal';
import { Drawer } from '../../../components/ui/Overlay/Drawer';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { formatDate } from '../../../utils/formatDate';
import { getErrorMessage } from '../../../utils/errorHandler';
import { appToast } from '../../../lib/toast';
import { useServiceCategories } from '../../services/hooks/useServiceCategories';
import { useAdminProviderDetails, useAdminProviders } from '../hooks/useAdminProviders';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const availabilityOptions = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'status', label: 'Status' },
  { value: 'rating_desc', label: 'Highest rated' },
];

const getProvidersArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.providers)) return payload.providers;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getProviderName = (provider) => provider?.user?.fullName || provider?.user?.name || provider?.name || 'Unknown';
const getProviderEmail = (provider) => provider?.user?.email || provider?.email || '—';
const getProviderPhone = (provider) => provider?.user?.phone || provider?.phone || '—';
const getProviderProfile = (provider) => {
  return provider?.providerProfile || provider?.profile || {};
};

const getCategoryName = (provider, categories) => {
  const profile = getProviderProfile(provider);

  const providerLabel =
    profile?.category?.name ||
    provider?.category?.name ||
    provider?.serviceCategory?.name ||
    provider?.serviceCategoryName;

  if (providerLabel) return providerLabel;

  const id =
    profile?.categoryId ||
    provider?.serviceCategoryId ||
    provider?.categoryId;

  if (!id) return null;

  const match = (Array.isArray(categories) ? categories : []).find(
    (item) => String(item?.id) === String(id)
  );

  return match?.name || null;
};

const getProviderStatus = (provider) => {
  return String(
    provider?.providerStatus ||
      provider?.status ||
      provider?.providerProfile?.status ||
      ''
  ).toUpperCase();
};

const isPendingProvider = (provider) => {
  return getProviderStatus(provider) === 'PENDING_APPROVAL';
};

const getProviderApprovalId = (provider) => {
  return (
    provider?.providerProfileId ||
    provider?.providerProfile?.id ||
    provider?.profileId ||
    provider?.id
  );
};

const getProviderAvailability = (provider) => {
  return provider?.isAvailable ?? provider?.providerProfile?.isAvailable ?? null;
};

const getProviderDocuments = (provider) => {
  const profile = provider?.providerProfile || provider?.profile || provider;

  const documents = [];

  if (profile?.citizenshipFront) {
    documents.push({
      label: 'Citizenship Front',
      url: profile.citizenshipFront,
      publicId: profile.citizenshipFrontPublicId,
    });
  }

  if (profile?.citizenshipBack) {
    documents.push({
      label: 'Citizenship Back',
      url: profile.citizenshipBack,
      publicId: profile.citizenshipBackPublicId,
    });
  }

  return documents;
};

const getProviderExperience = (provider) => {
  const profile = getProviderProfile(provider);

  const years =
    profile?.experienceYears ??
    provider?.experienceYears ??
    provider?.experience;

  if (years === null || years === undefined || years === '') return null;

  return Number(years) === 1 ? '1 year' : `${years} years`;
};

const getProviderAvailabilityLabel = (provider) => {
  const profile = getProviderProfile(provider);

  if (profile?.isCurrentlyBusy || provider?.isCurrentlyBusy) {
    return 'Busy';
  }

  return (
    profile?.availability ||
    provider?.availability ||
    (getProviderAvailability(provider) === true ? 'Available' : null)
  );
};

const getProviderTotalJobs = (provider) => {
  const profile = getProviderProfile(provider);

  return profile?.totalJobs ?? provider?.totalJobs ?? null;
};

const getProviderCompletedJobs = (provider) => {
  const profile = getProviderProfile(provider);

  return (
    profile?.completedJobs ??
    provider?.completedJobs ??
    profile?.totalJobs ??
    provider?.totalJobs ??
    null
  );
};

const getProviderRating = (provider) => {
  const profile = getProviderProfile(provider);

  const rating =
    profile?.averageRating ??
    provider?.averageRating ??
    provider?.rating;

  const totalReviews =
    profile?.totalReviews ??
    provider?.totalReviews;

  if (rating === null || rating === undefined || rating === '') return null;

  return totalReviews
    ? `${Number(rating).toFixed(1)} / 5 (${totalReviews} reviews)`
    : `${Number(rating).toFixed(1)} / 5`;
};

const getProviderServices = (provider) => {
  const profile = getProviderProfile(provider);
  const services = profile?.services || provider?.services || [];

  return services
    .map((item) => item?.service?.name || item?.name || item?.serviceName)
    .filter(Boolean);
};

const getProviderAreas = (provider) => {
  const profile = getProviderProfile(provider);
  const areas = profile?.serviceAreas || provider?.serviceAreas || [];

  return areas
    .map((area) =>
      [
        area?.province,
        area?.district,
        area?.municipality,
        area?.ward ? `Ward ${area.ward}` : null,
      ]
        .filter(Boolean)
        .join(', ')
    )
    .filter(Boolean);
};

function AdminProviders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [supportsActions, setSupportsActions] = useState({
    approve: true,
    reject: true,
    suspend: true,
    activate: true,
  });
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const category = searchParams.get('category') || 'all';
  const availability = searchParams.get('availability') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      ...(search ? { search } : {}),
      ...(status !== 'all' ? { status } : {}),
      ...(category !== 'all' ? { serviceCategoryId: category } : {}),
      ...(availability !== 'all' ? { isAvailable: availability === 'available' } : {}),
      ...(sort !== 'newest' ? { sort } : {}),
    }),
    [availability, category, page, search, sort, status]
  );

  const { providersQuery, statsQuery, approveMutation, rejectMutation, suspendMutation, activateMutation } = useAdminProviders(filters);
  const categoriesQuery = useServiceCategories();
  const providers = useMemo(() => getProvidersArray(providersQuery.data), [providersQuery.data]);
  const detailsQuery = useAdminProviderDetails(selectedProviderId);
  const selectedProvider = detailsQuery.data || providers.find((item) => String(item?.id) === String(selectedProviderId));

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'newest') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const filteredProviders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let list = providers.filter((item) => {
      const statusValue = getProviderStatus(item);
      const availabilityValue = getProviderAvailability(item);

      if (status !== 'all' && statusValue !== status) return false;
      if (availability === 'available' && availabilityValue !== true) return false;
      if (availability === 'unavailable' && availabilityValue !== false) return false;
      if (category !== 'all') {
        const categoryId = String(item?.serviceCategoryId || item?.categoryId || item?.serviceCategory?.id || '');
        if (categoryId !== String(category)) return false;
      }
      if (!needle) return true;
      const text = `${getProviderName(item)} ${getProviderEmail(item)} ${getProviderPhone(item)} ${getCategoryName(item, categoriesQuery.data) || ''}`.toLowerCase();
      return text.includes(needle);
    });
    if (sort === 'oldest') {
      list = [...list].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));
    } else if (sort === 'name_asc') {
      list = [...list].sort((a, b) => getProviderName(a).localeCompare(getProviderName(b)));
    } else if (sort === 'status') {
      list = [...list].sort((a, b) => getProviderStatus(a).localeCompare(getProviderStatus(b)));
    } else if (sort === 'rating_desc') {
      list = [...list].sort((a, b) => Number(b?.rating ?? -1) - Number(a?.rating ?? -1));
    } else {
      list = [...list].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    }
    return list;
  }, [availability, categoriesQuery.data, category, providers, search, sort, status]);

  const pendingProviders = filteredProviders.filter(isPendingProvider);

  const stats = useMemo(() => {
    const rawStats = statsQuery.data?.providers || statsQuery.data;
    const fromLoaded = {
  total: providers.length,
  pending: providers.filter((item) => getProviderStatus(item) === 'PENDING_APPROVAL').length,
  approved: providers.filter((item) => getProviderStatus(item) === 'APPROVED').length,
  rejected: providers.filter((item) => getProviderStatus(item) === 'REJECTED').length,
  suspended: providers.filter((item) => getProviderStatus(item) === 'SUSPENDED').length,
  available: providers.filter((item) => getProviderAvailability(item) === true).length,
};
    return {
      total: rawStats?.total ?? fromLoaded.total,
      pending: rawStats?.pending ?? fromLoaded.pending,
      approved: rawStats?.approved ?? fromLoaded.approved,
      rejected: rawStats?.rejected ?? fromLoaded.rejected,
      suspended: rawStats?.suspended ?? fromLoaded.suspended,
      available: rawStats?.available ?? fromLoaded.available,
      derived: !(rawStats?.total != null),
    };
  }, [providers, statsQuery.data]);

  const runAction = async () => {
    if (!pendingAction?.id || !pendingAction?.type) return;
    try {
      if (pendingAction.type === 'approve') {
        await approveMutation.mutateAsync(pendingAction.id);
        appToast.success('Provider approved successfully.');
      } else if (pendingAction.type === 'reject') {
        const reason = window.prompt('Enter rejection reason');

        if (!reason?.trim()) {
          appToast.error('Rejection reason is required.');
          return;
        }

        await rejectMutation.mutateAsync({
          id: pendingAction.id,
          reason: reason.trim(),
          rejectionReason: reason.trim(),
        });

        appToast.success('Provider rejected successfully.');
      } else if (pendingAction.type === 'suspend') {
        await suspendMutation.mutateAsync({ id: pendingAction.id });
        appToast.success('Provider suspended successfully.');
      } else if (pendingAction.type === 'activate') {
        await activateMutation.mutateAsync(pendingAction.id);
        appToast.success('Provider activated successfully.');
      }
      setPendingAction(null);
      providersQuery.refetch();
      statsQuery.refetch();
    } catch (error) {
      const code = error?.response?.status;
      if (code === 404 || code === 405) {
        setSupportsActions((prev) => ({ ...prev, [pendingAction.type]: false }));
      }
      appToast.error(getErrorMessage(error, 'Unable to update provider status right now.'));
    }
  };

  const providerActionButtons = (provider) => {
  const statusValue = getProviderStatus(provider);
  const approvalId = getProviderApprovalId(provider);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-9 rounded-xl"
        onClick={() => setSelectedProviderId(provider?.id)}
      >
        View Details
      </Button>

      {statusValue === 'PENDING_APPROVAL' && supportsActions.approve ? (
        <Button
          type="button"
          className="h-9 rounded-xl"
          onClick={() =>
            setPendingAction({
              type: 'approve',
              id: approvalId,
              name: getProviderName(provider),
            })
          }
        >
          Approve
        </Button>
      ) : null}

      {statusValue === 'PENDING_APPROVAL' && supportsActions.reject ? (
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl"
          onClick={() =>
            setPendingAction({
              type: 'reject',
              id: approvalId,
              name: getProviderName(provider),
            })
          }
        >
          Reject
        </Button>
      ) : null}

      {statusValue === 'APPROVED' && supportsActions.suspend ? (
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl"
          onClick={() =>
            setPendingAction({
              type: 'suspend',
              id: approvalId,
              name: getProviderName(provider),
            })
          }
        >
          Suspend
        </Button>
      ) : null}

      {statusValue === 'SUSPENDED' && supportsActions.activate ? (
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl"
          onClick={() =>
            setPendingAction({
              type: 'activate',
              id: approvalId,
              name: getProviderName(provider),
            })
          }
        >
          Activate
        </Button>
      ) : null}
    </div>
  );
};

  const detailsContent = selectedProvider ? (
    <div className="space-y-4 text-sm text-[var(--sf-text-muted)]">
      <div className="space-y-1">
        <p><span className="font-semibold text-[var(--sf-text-main)]">Name:</span> {getProviderName(selectedProvider)}</p>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Email:</span> {getProviderEmail(selectedProvider)}</p>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Phone:</span> {getProviderPhone(selectedProvider)}</p>
        {selectedProvider?.user?.createdAt || selectedProvider?.createdAt ? (
          <p><span className="font-semibold text-[var(--sf-text-main)]">Joined:</span> {formatDate(selectedProvider?.user?.createdAt || selectedProvider?.createdAt, { includeTime: true })}</p>
        ) : null}
      </div>
      <div className="space-y-1">
  <p>
    <span className="font-semibold text-[var(--sf-text-main)]">Status:</span>{' '}
    <StatusBadge
      status={getProviderStatus(selectedProvider) || 'PENDING_APPROVAL'}
      className="ml-2"
    />
  </p>

  <p>
    <span className="font-semibold text-[var(--sf-text-main)]">Service category:</span>{' '}
    {getCategoryName(selectedProvider, categoriesQuery.data) || '—'}
  </p>

  <p>
    <span className="font-semibold text-[var(--sf-text-main)]">Experience:</span>{' '}
    {getProviderExperience(selectedProvider) || '—'}
  </p>

  <p>
    <span className="font-semibold text-[var(--sf-text-main)]">Availability:</span>{' '}
    {getProviderAvailabilityLabel(selectedProvider) || '—'}
  </p>
</div>
      <div className="space-y-3">
  <p className="font-semibold text-[var(--sf-text-main)]">Documents</p>

  {getProviderDocuments(selectedProvider).length ? (
    <div className="grid gap-3 sm:grid-cols-2">
      {getProviderDocuments(selectedProvider).map((document) => (
        <div
              key={document.label}
                className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3"
              >
                <p className="mb-2 text-sm font-semibold text-[var(--sf-text-main)]">
                  {document.label}
                </p>

                {document.url?.includes('cloudinary') ||
                document.url?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <a href={document.url} target="_blank" rel="noreferrer">
                    <img
                      src={document.url}
                      alt={document.label}
                      className="h-40 w-full rounded-xl object-cover"
                    />
                  </a>
                ) : (
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[var(--sf-primary)] underline"
                  >
                    View document
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--sf-text-muted)]">
            No provider documents available.
          </p>
        )}
      </div>
      <div className="space-y-1">
  <p>
    <span className="font-semibold text-[var(--sf-text-main)]">Completed jobs:</span>{' '}
    {getProviderCompletedJobs(selectedProvider) ?? '—'}
  </p>

  <p>
    <span className="font-semibold text-[var(--sf-text-main)]">Total jobs:</span>{' '}
    {getProviderTotalJobs(selectedProvider) ?? '—'}
  </p>

  <p>
    <span className="font-semibold text-[var(--sf-text-main)]">Rating:</span>{' '}
    {getProviderRating(selectedProvider) || '—'}
  </p>
</div>
<div className="space-y-2">
  <p className="font-semibold text-[var(--sf-text-main)]">Services</p>

  {getProviderServices(selectedProvider).length ? (
    <div className="flex flex-wrap gap-2">
      {getProviderServices(selectedProvider).map((service) => (
        <span
          key={service}
          className="rounded-full border border-[var(--sf-border)] px-3 py-1 text-xs font-semibold text-[var(--sf-text-muted)]"
        >
          {service}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-sm text-[var(--sf-text-muted)]">No services selected.</p>
  )}
</div>
<div className="space-y-2">
  <p className="font-semibold text-[var(--sf-text-main)]">Service Areas</p>

  {getProviderAreas(selectedProvider).length ? (
    <div className="space-y-2">
      {getProviderAreas(selectedProvider).map((area) => (
        <p
          key={area}
          className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-3 py-2 text-sm text-[var(--sf-text-muted)]"
        >
          {area}
        </p>
      ))}
    </div>
  ) : (
    <p className="text-sm text-[var(--sf-text-muted)]">
      No service areas configured.
    </p>
  )}
</div>
      <div>{providerActionButtons(selectedProvider)}</div>
    </div>
  ) : (
    <p className="text-sm text-[var(--sf-text-muted)]">Provider details unavailable.</p>
  );

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Admin"
        title="Providers"
        description="Review provider applications, manage verification status, and monitor provider activity."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => {
              providersQuery.refetch();
              statsQuery.refetch();
            }}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setParam('status', 'PENDING_APPROVAL')}>
              Pending Approvals
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Total Providers', value: stats.total, icon: ShieldCheck },
          { label: 'Pending', value: stats.pending, icon: Clock3 },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2 },
          { label: 'Rejected', value: stats.rejected, icon: XCircle },
          { label: 'Suspended', value: stats.suspended, icon: UserX },
          { label: 'Available', value: stats.available, icon: UserCheck },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--sf-text-muted)]">
              <card.icon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">{card.label}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{card.value ?? '—'}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_0.9fr]">
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Search</span>
            <input value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Search by provider name, email, phone, or service..." className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]" />
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Status</span>
            <select value={status} onChange={(event) => setParam('status', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Service category</span>
            <select value={category} onChange={(event) => setParam('category', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              <option value="all">All categories</option>
              {(Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []).map((item) => (
                <option key={item?.id} value={item?.id}>{item?.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Availability</span>
            <select value={availability} onChange={(event) => setParam('availability', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setParam('sort', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <h2 className="text-base font-bold text-[var(--sf-text-main)]">Pending approval queue</h2>
        {pendingProviders.length ? (
          <div className="mt-3 space-y-2">
            {pendingProviders.map((provider) => (
              <article key={provider?.id} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--sf-text-main)]">{getProviderName(provider)}</p>
                    <p className="text-sm text-[var(--sf-text-muted)]">{getProviderEmail(provider)} • {getProviderPhone(provider)}</p>
                    <p className="text-xs text-[var(--sf-text-muted)]">{getCategoryName(provider, categoriesQuery.data) || 'Service category unavailable'}</p>
                  </div>
                  {providerActionButtons(provider)}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--sf-text-muted)]">No pending provider approvals.</p>
        )}
      </section>

      {providersQuery.isLoading ? (
        <section className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {!providersQuery.isLoading && providersQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load providers right now.</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => providersQuery.refetch()}>
            Retry
          </Button>
        </section>
      ) : null}

      {!providersQuery.isLoading && !providersQuery.isError && !filteredProviders.length ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">
            {providers.length ? 'No providers match these filters.' : 'No providers found.'}
          </p>
          {providers.length ? (
            <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => setSearchParams(new URLSearchParams())}>
              Clear Filters
            </Button>
          ) : null}
        </section>
      ) : null}

      {!providersQuery.isLoading && !providersQuery.isError && filteredProviders.length ? (
        <>
          <section className="hidden overflow-x-auto rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
            <table className="min-w-[1260px] w-full text-left">
              <thead className="bg-[var(--sf-surface-soft)]">
                <tr className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="sticky right-0 z-10 whitespace-nowrap bg-[var(--sf-surface-soft)] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map((provider) => (
                  <tr key={provider?.id} className="border-t border-[var(--sf-border)]">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--sf-text-main)]">{getProviderName(provider)}</p>
                      <p className="text-xs text-[var(--sf-text-muted)]">{provider?.id}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                      <p className="max-w-[220px] truncate">{getProviderEmail(provider)}</p>
                      <p className="max-w-[170px] truncate">{getProviderPhone(provider)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                      <p>{getCategoryName(provider, categoriesQuery.data) || '—'}</p>
                      <p>{getProviderExperience(provider) || '—'}</p>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={getProviderStatus(provider) || 'PENDING_APPROVAL'} /></td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                      {getProviderAvailability(provider) == null ? '—': getProviderAvailability(provider) ? 'Available':'Unavailable'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                      {getProviderTotalJobs(provider) != null || getProviderRating(provider)
                        ? `${getProviderCompletedJobs(provider) ?? '—'}/${getProviderTotalJobs(provider) ?? '—'} jobs | Rating ${getProviderRating(provider) || '—'}`
                        : '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                      {provider?.createdAt ? formatDate(provider.createdAt) : provider?.user?.createdAt ? formatDate(provider.user.createdAt) : '—'}
                    </td>
                    <td className="sticky right-0 z-[1] whitespace-nowrap bg-[var(--sf-surface)] px-4 py-4 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.18)]">{providerActionButtons(provider)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="space-y-3 lg:hidden">
            {filteredProviders.map((provider) => (
              <article key={provider?.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                <p className="font-semibold text-[var(--sf-text-main)]">{getProviderName(provider)}</p>
                <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{getProviderEmail(provider)}</p>
                <p className="text-sm text-[var(--sf-text-muted)]">{getProviderPhone(provider)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={getProviderStatus(provider) || 'PENDING_APPROVAL'} />
                  {getProviderAvailability(provider) != null ? (
                    <StatusBadge status={getProviderAvailability(provider) ? 'APPROVED' : 'SUSPENDED'} />) : null}
                </div>
                <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{getCategoryName(provider, categoriesQuery.data) || 'Service category unavailable'}</p>
                <div className="mt-3">{providerActionButtons(provider)}</div>
              </article>
            ))}
          </section>
        </>
      ) : null}

      {/* TODO: Replace local fallback filters with full backend filtering once provider list query contract is finalized. */}
      {/* TODO: Add explicit pagination controls when provider list endpoint returns stable pagination metadata. */}

      {isDesktop ? (
        <Modal open={Boolean(selectedProviderId)} onClose={() => setSelectedProviderId(null)} title="Provider Details">
          {detailsQuery.isLoading ? <p className="text-sm text-[var(--sf-text-muted)]">Loading provider details...</p> : detailsContent}
        </Modal>
      ) : (
        <Drawer open={Boolean(selectedProviderId)} onClose={() => setSelectedProviderId(null)} title="Provider Details">
          {detailsQuery.isLoading ? <p className="text-sm text-[var(--sf-text-muted)]">Loading provider details...</p> : detailsContent}
        </Drawer>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={runAction}
        title={
          pendingAction?.type === 'approve'
            ? 'Approve provider?'
            : pendingAction?.type === 'reject'
              ? 'Reject provider?'
              : pendingAction?.type === 'suspend'
                ? 'Suspend provider?'
                : 'Activate provider?'
        }
        description={`Are you sure you want to ${pendingAction?.type || 'update'} ${pendingAction?.name || 'this provider'}?`}
        confirmLabel={pendingAction?.type ? pendingAction.type[0].toUpperCase() + pendingAction.type.slice(1) : 'Confirm'}
        confirmLoading={
          approveMutation.isPending
          || rejectMutation.isPending
          || suspendMutation.isPending
          || activateMutation.isPending
        }
      />
    </Container>
  );
}

export default AdminProviders;
