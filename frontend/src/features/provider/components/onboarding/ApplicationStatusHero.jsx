import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { Card } from '../../../../components/ui/Layout/Card';
import { PROVIDER_STATUS } from '../../../../constants/provider-status.constant';

const statusConfig = {
  [PROVIDER_STATUS.PENDING_APPROVAL]: {
    title: 'Application Under Review',
    text: 'Your provider profile has been submitted and is waiting for admin review.',
    icon: AlertTriangle,
    tone: 'text-warning',
  },
  [PROVIDER_STATUS.APPROVED]: {
    title: 'Provider Profile Approved',
    text: 'You can now access provider features and receive eligible nearby jobs when available.',
    icon: CheckCircle2,
    tone: 'text-success',
  },
  [PROVIDER_STATUS.REJECTED]: {
    title: 'Application Needs Update',
    text: 'Your provider application was not approved. Review the feedback and update your profile if allowed.',
    icon: ShieldAlert,
    tone: 'text-danger',
  },
  [PROVIDER_STATUS.SUSPENDED]: {
    title: 'Provider Access Suspended',
    text: 'Your provider access is currently restricted. Contact support for more information.',
    icon: ShieldAlert,
    tone: 'text-danger',
  },
  INCOMPLETE: {
    title: 'Complete Your Provider Profile',
    text: 'Add the required service and location details to submit your profile for review.',
    icon: ShieldQuestion,
    tone: 'text-primary',
  },
};

export const resolveProviderStatus = (providerProfile) => providerProfile?.status || 'INCOMPLETE';

export function ApplicationStatusHero({ providerProfile }) {
  const status = resolveProviderStatus(providerProfile);
  const config = statusConfig[status] || statusConfig.INCOMPLETE;
  const Icon = config.icon;

  return (
    <Card className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 shadow-[var(--sf-shadow)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sf-surface-soft)] ${config.tone}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">Current Status</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--sf-text-main)]">{config.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{config.text}</p>
          </div>
        </div>
        <div className="rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-4 py-2 text-xs font-semibold text-[var(--sf-text-main)]">
          {status}
        </div>
      </div>
    </Card>
  );
}

export default ApplicationStatusHero;
