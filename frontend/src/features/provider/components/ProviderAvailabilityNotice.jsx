import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes.constant';
import { StatusBadge } from '../../../components/common/StatusBadge';

const statusMessage = {
  PENDING_APPROVAL: 'Your provider profile must be approved before you can receive nearby jobs.',
  REJECTED: 'Your provider profile is currently rejected. Update your profile and re-apply for verification.',
  SUSPENDED: 'Your provider account is suspended. Please contact support for assistance.',
};

export function ProviderAvailabilityNotice({
  approved,
  available,
  status,
  onToggleAvailability,
  toggleLoading = false,
}) {
  if (!approved) {
    return (
      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--sf-danger)]" />
          <div className="space-y-2">
            <p className="font-semibold text-[var(--sf-text-main)]">{statusMessage[status] || statusMessage.PENDING_APPROVAL}</p>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={status || 'PENDING_APPROVAL'} />
              <Button as={Link} to={ROUTES.provider.profile} variant="outline" className="rounded-xl">
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--sf-secondary)]" />
            <p className="font-semibold text-[var(--sf-text-main)]">Provider status</p>
            <StatusBadge status={status || 'APPROVED'} />
          </div>
          <p className="text-sm text-[var(--sf-text-muted)]">
            {available
              ? 'You are available and eligible to receive nearby jobs.'
              : 'You are currently unavailable. Turn on availability to receive nearby jobs.'}
          </p>
        </div>
        <Button
          type="button"
          variant={available ? 'secondary' : 'outline'}
          className="h-11 min-w-[180px] rounded-xl"
          onClick={() => onToggleAvailability?.(!available)}
          loading={toggleLoading}
        >
          {available ? 'Available' : 'Turn on availability'}
        </Button>
      </div>
    </section>
  );
}

export default ProviderAvailabilityNotice;

