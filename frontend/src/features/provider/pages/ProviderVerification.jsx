import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { serviceApi } from '../../services/api/service.api';
import { providerApi } from '../api/provider.api';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { ROUTES } from '../../../constants/routes.constant';
import { PROVIDER_STATUS } from '../../../constants/provider-status.constant';
import { useProviderProfile } from '../hooks/useProviderProfile';
import { useUpdateProviderProfile } from '../hooks/useUpdateProviderProfile';
import ApplicationStatusHero from '../components/onboarding/ApplicationStatusHero';
import { resolveProviderStatus } from '../utils/providerStatus';
import ProfileCompletionChecklist from '../components/onboarding/ProfileCompletionChecklist';
import ProviderInfoForm from '../components/onboarding/ProviderInfoForm';
import ProviderDocumentsSection from '../components/onboarding/ProviderDocumentsSection';
import AdminReviewNote from '../components/onboarding/AdminReviewNote';
import ProviderNextSteps from '../components/onboarding/ProviderNextSteps';

const getProviderProfile = (payload) => {
  if (!payload) return null;
  if (payload?.providerProfile) return payload.providerProfile;
  if (payload?.status || payload?.categoryId || payload?.serviceAreas) return payload;
  return null;
};

function ProviderVerification() {
  const profileQuery = useProviderProfile();
  const updateMutation = useUpdateProviderProfile();

  const userPayload = profileQuery.data || null;
  const providerProfile = getProviderProfile(userPayload);
  const user = providerProfile?.user || userPayload?.user || null;
  const status = resolveProviderStatus(providerProfile);
  const isApproved = status === PROVIDER_STATUS.APPROVED;
  // const isRejected = status === PROVIDER_STATUS.REJECTED;
  const rejectionReason = providerProfile?.rejectionReason || 'No reason was provided.';

  const categoriesQuery = useQuery({
    queryKey: ['service-categories', 'provider-onboarding'],
    queryFn: serviceApi.categories,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const documentMutation = useMutation({
  mutationFn: providerApi.updateDocuments,
  });

  const resubmitMutation = useMutation({
    mutationFn: providerApi.resubmitApplication,
    onSuccess: () => {
      appToast.success('Application resubmitted successfully.');
      profileQuery.refetch();
    },
    onError: (error) => {
      appToast.error(
        getErrorMessage(error, 'Unable to resubmit application right now.')
      );
    },
  });

  const onSave = async (payload) => {
    try {
      await updateMutation.mutateAsync(payload);
      appToast.success('Provider profile saved successfully.');
      profileQuery.refetch();
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to save provider profile right now.'));
    }
  };

  const onUploadDocuments = async ({ citizenshipFront, citizenshipBack }) => {
  try {
    const formData = new FormData();

    if (citizenshipFront) {
      formData.append('citizenshipFront', citizenshipFront);
    }

    if (citizenshipBack) {
      formData.append('citizenshipBack', citizenshipBack);
    }

    if (!citizenshipFront && !citizenshipBack) {
      appToast.error('Please choose at least one document to upload.');
      return;
    }

    await documentMutation.mutateAsync(formData);

    appToast.success('Documents uploaded successfully.');
    profileQuery.refetch();
  } catch (error) {
    appToast.error(getErrorMessage(error, 'Unable to upload documents right now.'));
  }
};

const onResubmit = () => {
  resubmitMutation.mutate();
};

  if (profileQuery.isLoading) {
    return (
      <Container className="space-y-6 py-6 lg:py-8">
        <Skeleton className="h-28 rounded-[28px]" />
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        </div>
      </Container>
    );
  }

  if (profileQuery.error?.response?.status === 404) {
    return (
      <Container className="space-y-6 py-6 lg:py-8">
        <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <h1 className="text-2xl font-extrabold text-[var(--sf-text-main)]">Provider profile was not found.</h1>
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
            Provider profile was not found.
          </p>
        </section>
      </Container>
    );
  }

  if (profileQuery.isError) {
    return (
      <Container className="space-y-6 py-6 lg:py-8">
        <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <h1 className="text-2xl font-extrabold text-[var(--sf-text-main)]">Unable to load provider application status right now.</h1>
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
            {getErrorMessage(profileQuery.error, 'Please try again shortly.')}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => profileQuery.refetch()}>
              Retry
            </Button>
            <Button as={Link} to={ROUTES.contact} variant="outline" className="h-11 rounded-xl">
              Contact Support
            </Button>
          </div>
        </section>
      </Container>
    );
  }

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">Provider Application Status</h1>
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
            Track your provider verification progress and complete required profile information.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => profileQuery.refetch()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
          {isApproved ? (
            <Button as={Link} to={ROUTES.provider.dashboard} className="h-11 rounded-xl bg-[var(--sf-secondary)] text-white hover:brightness-95">
              Go to Provider Dashboard
            </Button>
          ) : (
            <Button as={Link} to={ROUTES.provider.profile} variant="outline" className="h-11 rounded-xl">
              View Profile
            </Button>
          )}
        </div>
      </header>

      <ApplicationStatusHero providerProfile={providerProfile} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <ProfileCompletionChecklist user={user} providerProfile={providerProfile} />
          <ProviderInfoForm
            key={`${providerProfile?.id || 'new'}-${user?.id || 'anon'}-${Boolean(providerProfile?.categoryId || providerProfile?.category?.id)}`}
            profile={providerProfile}
            user={user}
            categoriesQuery={categoriesQuery}
            onSave={onSave}
            saving={updateMutation.isPending}
            editable
          />
          <ProviderDocumentsSection
            providerProfile={providerProfile}
            status={status}
            rejectionReason={rejectionReason}
            uploading={documentMutation.isPending}
            resubmitting={resubmitMutation.isPending}
            onUpload={onUploadDocuments}
            onResubmit={onResubmit}
          />
        </div>

        <div className="space-y-6">
          <AdminReviewNote providerProfile={providerProfile} />
          <ProviderNextSteps status={status} />
        </div>
      </div>

      {/* TODO: Enable submit/resubmit action when backend provides provider submission endpoint. */}
    </Container>
  );
}

export default ProviderVerification;
